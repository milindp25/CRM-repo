import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { BillingRepository } from './billing.repository.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Billing service with proper financial precision handling.
 *
 * All monetary calculations use toFixed(2) rounding to maintain
 * 2-decimal precision consistent with the Decimal(10,2) DB columns.
 * Prisma Decimal objects are converted via toNumber() only at computation
 * boundaries, never stored as intermediate `any` types.
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

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
    this.logger.log(`Creating billing plan: ${data.name} (tier: ${data.tier})`);
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
    this.logger.log(`Updating billing plan: ${id}`);
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

    const counts = await this.repository.getCompanyCounts(companyId);
    const monthlyTotal = this.calculateMonthlyTotal(plan, counts.employeeCount, counts.userCount);

    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    this.logger.log(
      `Assigning plan ${billingPlanId} to company ${companyId} (monthly: $${monthlyTotal.toFixed(2)})`,
    );

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
    const monthlyTotal = this.calculateMonthlyTotal(plan, counts.employeeCount, counts.userCount);

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

    // Idempotency check: prevent duplicate invoices for the same period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const existingInvoice = await this.repository.findInvoiceByPeriod(
      billing.id,
      periodStart,
      periodEnd,
    );
    if (existingInvoice) {
      throw new BadRequestException(
        `Invoice already exists for this period (${existingInvoice.invoiceNumber}). ` +
        `Cancel the existing invoice before generating a new one.`,
      );
    }

    const plan = billing.billingPlan;
    const counts = await this.repository.getCompanyCounts(companyId);

    // Calculate amounts with proper precision
    const extraEmployees = Math.max(0, counts.employeeCount - plan.includedEmployees);
    const extraUsers = Math.max(0, counts.userCount - plan.includedUsers);

    const baseAmount = this.toMoney(plan.basePrice);
    const employeeAmount = this.roundMoney(extraEmployees * this.toMoney(plan.pricePerEmployee));
    const userAmount = this.roundMoney(extraUsers * this.toMoney(plan.pricePerUser));

    // Get add-on costs
    const activeAddons = await this.repository.getActiveCompanyAddons(companyId);
    const addonAmount = this.roundMoney(
      activeAddons.reduce((sum, ca) => sum + this.toMoney(ca.featureAddon.price), 0),
    );

    const totalAmount = this.roundMoney(baseAmount + employeeAmount + userAmount + addonAmount);

    // Generate deterministic invoice number: INV-YYYYMM-COMPANYPREFIX-SEQ
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const seq = await this.repository.getInvoiceCountForPeriod(billing.id, periodStart);
    const invoiceNumber = `INV-${yearMonth}-${(seq + 1).toString().padStart(4, '0')}`;

    // Due date: 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Build line items
    const lineItems: Array<{ description: string; quantity: number; unitPrice: number; amount: number }> = [
      {
        description: `${plan.name} - Base Plan`,
        quantity: 1,
        unitPrice: baseAmount,
        amount: baseAmount,
      },
    ];

    if (extraEmployees > 0) {
      const unitPrice = this.toMoney(plan.pricePerEmployee);
      lineItems.push({
        description: `Additional Employees (${extraEmployees} x $${unitPrice.toFixed(2)})`,
        quantity: extraEmployees,
        unitPrice,
        amount: employeeAmount,
      });
    }

    if (extraUsers > 0) {
      const unitPrice = this.toMoney(plan.pricePerUser);
      lineItems.push({
        description: `Additional Users (${extraUsers} x $${unitPrice.toFixed(2)})`,
        quantity: extraUsers,
        unitPrice,
        amount: userAmount,
      });
    }

    for (const ca of activeAddons) {
      const price = this.toMoney(ca.featureAddon.price);
      lineItems.push({
        description: `Add-on: ${ca.featureAddon.name}`,
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    }

    this.logger.log(
      `Generating invoice ${invoiceNumber} for company ${companyId}: ` +
      `base=$${baseAmount} + employees=$${employeeAmount} + users=$${userAmount} + addons=$${addonAmount} = $${totalAmount}`,
    );

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

    const validTransitions: Record<string, string[]> = {
      PENDING: ['PAID', 'OVERDUE', 'CANCELLED'],
      OVERDUE: ['PAID', 'CANCELLED'],
      PAID: [],
      CANCELLED: [],
    };

    const currentStatus = invoice.status;
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition invoice from ${currentStatus} to ${status}. ` +
        `Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,
      );
    }

    this.logger.log(`Updating invoice ${invoiceId} status: ${currentStatus} -> ${status}`);
    return this.repository.updateInvoiceStatus(invoiceId, status);
  }

  // ── Revenue ────────────────────────────────────────────────────────

  async getRevenueSummary() {
    return this.repository.getRevenueSummary();
  }

  // ── Financial Helpers ──────────────────────────────────────────────

  /**
   * Convert a Prisma Decimal or number to a JS number.
   * Uses parseFloat to handle Decimal objects that have a toString() method.
   */
  private toMoney(value: Decimal | number | string): number {
    if (typeof value === 'number') return value;
    return parseFloat(String(value));
  }

  /**
   * Round to 2 decimal places for monetary precision.
   */
  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private calculateMonthlyTotal(
    plan: {
      basePrice: Decimal | number;
      pricePerEmployee: Decimal | number;
      pricePerUser: Decimal | number;
      includedEmployees: number;
      includedUsers: number;
    },
    employeeCount: number,
    userCount: number,
  ): number {
    const extraEmployees = Math.max(0, employeeCount - plan.includedEmployees);
    const extraUsers = Math.max(0, userCount - plan.includedUsers);

    return this.roundMoney(
      this.toMoney(plan.basePrice) +
      extraEmployees * this.toMoney(plan.pricePerEmployee) +
      extraUsers * this.toMoney(plan.pricePerUser),
    );
  }
}
