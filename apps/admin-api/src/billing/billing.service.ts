import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingRepository } from './billing.repository.js';

@Injectable()
export class BillingService {
  constructor(private readonly repository: BillingRepository) {}

  // ── Billing Plans ──────────────────────────────────────────────────

  async listPlans() {
    return this.repository.findAllPlans();
  }

  async createPlan(data: {
    name: string;
    tier: string;
    basePrice: number;
    yearlyBasePrice?: number;
    pricePerEmployee: number;
    pricePerUser: number;
    includedEmployees?: number;
    includedUsers?: number;
  }) {
    return this.repository.createPlan(data);
  }

  async updatePlan(
    id: string,
    data: {
      name?: string;
      basePrice?: number;
      yearlyBasePrice?: number;
      pricePerEmployee?: number;
      pricePerUser?: number;
      includedEmployees?: number;
      includedUsers?: number;
      isActive?: boolean;
    },
  ) {
    const plan = await this.repository.findPlanById(id);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }
    return this.repository.updatePlan(id, data);
  }

  // ── Company Billing ────────────────────────────────────────────────

  async getCompanyBilling(companyId: string) {
    const billing = await this.repository.findCompanyBilling(companyId);
    if (!billing) {
      return { companyId, hasBilling: false, billing: null };
    }
    return { companyId, hasBilling: true, billing };
  }

  async assignBillingPlan(
    companyId: string,
    billingPlanId: string,
    billingCycle?: string,
  ) {
    const plan = await this.repository.findPlanById(billingPlanId);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }

    // Get current counts
    const counts = await this.repository.getCompanyCounts(companyId);

    // Calculate monthly total
    const monthlyTotal = this.calculateMonthlyTotal(
      plan,
      counts.employeeCount,
      counts.userCount,
    );

    // Set next billing date to 1 month from now
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    return this.repository.upsertCompanyBilling({
      companyId,
      billingPlanId,
      billingCycle: billingCycle ?? 'MONTHLY',
      currentEmployees: counts.employeeCount,
      currentUsers: counts.userCount,
      monthlyTotal,
      nextBillingDate,
    });
  }

  async updateCompanyBilling(
    companyId: string,
    data: { billingPlanId?: string; billingCycle?: string },
  ) {
    const billing = await this.repository.findCompanyBilling(companyId);
    if (!billing) {
      throw new NotFoundException('Company billing not found. Assign a billing plan first.');
    }

    const planId = data.billingPlanId ?? billing.billingPlanId;
    const plan = await this.repository.findPlanById(planId);
    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }

    const counts = await this.repository.getCompanyCounts(companyId);
    const monthlyTotal = this.calculateMonthlyTotal(
      plan,
      counts.employeeCount,
      counts.userCount,
    );

    return this.repository.upsertCompanyBilling({
      companyId,
      billingPlanId: planId,
      billingCycle: data.billingCycle ?? billing.billingCycle,
      currentEmployees: counts.employeeCount,
      currentUsers: counts.userCount,
      monthlyTotal,
    });
  }

  // ── Invoices ───────────────────────────────────────────────────────

  async getCompanyInvoices(companyId: string) {
    return this.repository.findInvoicesByCompany(companyId);
  }

  async generateInvoice(companyId: string) {
    const billing = await this.repository.findCompanyBilling(companyId);
    if (!billing) {
      throw new BadRequestException('Company does not have a billing plan assigned');
    }

    const plan = billing.billingPlan;
    const counts = await this.repository.getCompanyCounts(companyId);

    // Calculate amounts
    const extraEmployees = Math.max(0, counts.employeeCount - plan.includedEmployees);
    const extraUsers = Math.max(0, counts.userCount - plan.includedUsers);

    const baseAmount = Number(plan.basePrice);
    const employeeAmount = extraEmployees * Number(plan.pricePerEmployee);
    const userAmount = extraUsers * Number(plan.pricePerUser);

    // Get add-on costs
    const activeAddons = await this.repository.getActiveCompanyAddons(companyId);
    const addonAmount = activeAddons.reduce(
      (sum, ca) => sum + Number(ca.featureAddon.price),
      0,
    );

    const totalAmount = baseAmount + employeeAmount + userAmount + addonAmount;

    // Generate invoice number: INV-YYYYMM-XXXX
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const invoiceNumber = `INV-${yearMonth}-${random}`;

    // Period: current month
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Due date: 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Build line items
    const lineItems = [
      {
        description: `${plan.name} - Base Plan`,
        quantity: 1,
        unitPrice: baseAmount,
        amount: baseAmount,
      },
    ];

    if (extraEmployees > 0) {
      lineItems.push({
        description: `Additional Employees (${extraEmployees} x $${Number(plan.pricePerEmployee).toFixed(2)})`,
        quantity: extraEmployees,
        unitPrice: Number(plan.pricePerEmployee),
        amount: employeeAmount,
      });
    }

    if (extraUsers > 0) {
      lineItems.push({
        description: `Additional Users (${extraUsers} x $${Number(plan.pricePerUser).toFixed(2)})`,
        quantity: extraUsers,
        unitPrice: Number(plan.pricePerUser),
        amount: userAmount,
      });
    }

    for (const ca of activeAddons) {
      lineItems.push({
        description: `Add-on: ${ca.featureAddon.name}`,
        quantity: 1,
        unitPrice: Number(ca.featureAddon.price),
        amount: Number(ca.featureAddon.price),
      });
    }

    const invoice = await this.repository.createInvoice({
      companyBillingId: billing.id,
      invoiceNumber,
      periodStart,
      periodEnd,
      baseAmount,
      employeeAmount,
      userAmount,
      addonAmount,
      totalAmount,
      employeeCount: counts.employeeCount,
      userCount: counts.userCount,
      lineItems,
      dueDate,
    });

    // Update billing counts
    await this.repository.updateCompanyBillingCounts(
      companyId,
      counts.employeeCount,
      counts.userCount,
      totalAmount,
    );

    return invoice;
  }

  async updateInvoiceStatus(invoiceId: string, status: string) {
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const validStatuses = ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    return this.repository.updateInvoiceStatus(invoiceId, status);
  }

  // ── Revenue ────────────────────────────────────────────────────────

  async getRevenueSummary() {
    return this.repository.getRevenueSummary();
  }

  // ── Helper ─────────────────────────────────────────────────────────

  private calculateMonthlyTotal(
    plan: { basePrice: any; pricePerEmployee: any; pricePerUser: any; includedEmployees: number; includedUsers: number },
    employeeCount: number,
    userCount: number,
  ): number {
    const extraEmployees = Math.max(0, employeeCount - plan.includedEmployees);
    const extraUsers = Math.max(0, userCount - plan.includedUsers);

    return (
      Number(plan.basePrice) +
      extraEmployees * Number(plan.pricePerEmployee) +
      extraUsers * Number(plan.pricePerUser)
    );
  }
}
