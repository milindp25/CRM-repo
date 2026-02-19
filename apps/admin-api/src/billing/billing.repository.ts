import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class BillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Billing Plans ──────────────────────────────────────────────────

  async findAllPlans() {
    return this.prisma.billingPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { companyBillings: true } },
      },
    });
  }

  async findPlanById(id: string) {
    return this.prisma.billingPlan.findUnique({ where: { id } });
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
    return this.prisma.billingPlan.create({
      data: {
        name: data.name,
        tier: data.tier,
        basePrice: data.basePrice,
        yearlyBasePrice: data.yearlyBasePrice ?? null,
        pricePerEmployee: data.pricePerEmployee,
        pricePerUser: data.pricePerUser,
        includedEmployees: data.includedEmployees ?? 0,
        includedUsers: data.includedUsers ?? 0,
      },
    });
  }

  async updatePlan(id: string, data: Prisma.BillingPlanUpdateInput) {
    return this.prisma.billingPlan.update({
      where: { id },
      data,
    });
  }

  // ── Company Billing ────────────────────────────────────────────────

  async findCompanyBilling(companyId: string) {
    return this.prisma.companyBilling.findUnique({
      where: { companyId },
      include: {
        billingPlan: true,
        company: {
          select: {
            companyName: true,
            companyCode: true,
            subscriptionTier: true,
            _count: { select: { employees: true, users: true } },
          },
        },
      },
    });
  }

  async upsertCompanyBilling(data: {
    companyId: string;
    billingPlanId: string;
    billingCycle?: string;
    currentEmployees: number;
    currentUsers: number;
    monthlyTotal: number;
    nextBillingDate?: Date;
  }) {
    return this.prisma.companyBilling.upsert({
      where: { companyId: data.companyId },
      create: {
        companyId: data.companyId,
        billingPlanId: data.billingPlanId,
        billingCycle: data.billingCycle ?? 'MONTHLY',
        currentEmployees: data.currentEmployees,
        currentUsers: data.currentUsers,
        monthlyTotal: data.monthlyTotal,
        nextBillingDate: data.nextBillingDate ?? null,
      },
      update: {
        billingPlanId: data.billingPlanId,
        billingCycle: data.billingCycle,
        currentEmployees: data.currentEmployees,
        currentUsers: data.currentUsers,
        monthlyTotal: data.monthlyTotal,
        nextBillingDate: data.nextBillingDate ?? undefined,
      },
      include: {
        billingPlan: true,
      },
    });
  }

  async updateCompanyBillingCounts(
    companyId: string,
    employeeCount: number,
    userCount: number,
    monthlyTotal: number,
  ) {
    return this.prisma.companyBilling.update({
      where: { companyId },
      data: {
        currentEmployees: employeeCount,
        currentUsers: userCount,
        monthlyTotal,
      },
    });
  }

  // ── Invoices ───────────────────────────────────────────────────────

  async findInvoicesByCompany(companyId: string) {
    const billing = await this.prisma.companyBilling.findUnique({
      where: { companyId },
    });
    if (!billing) return [];

    return this.prisma.billingInvoice.findMany({
      where: { companyBillingId: billing.id },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async findInvoiceById(id: string) {
    return this.prisma.billingInvoice.findUnique({
      where: { id },
      include: {
        companyBilling: {
          include: {
            company: { select: { companyName: true, companyCode: true } },
            billingPlan: true,
          },
        },
      },
    });
  }

  async createInvoice(data: {
    companyBillingId: string;
    invoiceNumber: string;
    periodStart: Date;
    periodEnd: Date;
    baseAmount: number;
    employeeAmount: number;
    userAmount: number;
    addonAmount: number;
    totalAmount: number;
    employeeCount: number;
    userCount: number;
    lineItems: any;
    dueDate: Date;
  }) {
    return this.prisma.billingInvoice.create({
      data: {
        companyBillingId: data.companyBillingId,
        invoiceNumber: data.invoiceNumber,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        baseAmount: data.baseAmount,
        employeeAmount: data.employeeAmount,
        userAmount: data.userAmount,
        addonAmount: data.addonAmount,
        totalAmount: data.totalAmount,
        status: 'PENDING',
        employeeCount: data.employeeCount,
        userCount: data.userCount,
        lineItems: data.lineItems,
        dueDate: data.dueDate,
      },
    });
  }

  async updateInvoiceStatus(id: string, status: string) {
    const data: any = { status };
    if (status === 'PAID') {
      data.paidAt = new Date();
    }
    return this.prisma.billingInvoice.update({
      where: { id },
      data,
    });
  }

  // ── Revenue Metrics ────────────────────────────────────────────────

  async getRevenueSummary() {
    // Get all active company billings
    const billings = await this.prisma.companyBilling.findMany({
      include: {
        billingPlan: true,
        company: {
          select: {
            subscriptionTier: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    let totalMRR = 0;
    const revenueByTier: Record<string, number> = {};

    for (const billing of billings) {
      const monthly = Number(billing.monthlyTotal);
      totalMRR += monthly;

      const tier = billing.billingPlan.tier;
      revenueByTier[tier] = (revenueByTier[tier] || 0) + monthly;
    }

    // Get add-on revenue
    const activeAddons = await this.prisma.companyAddon.findMany({
      where: { status: 'ACTIVE' },
      include: { featureAddon: true },
    });

    let addonMRR = 0;
    for (const ca of activeAddons) {
      addonMRR += Number(ca.featureAddon.price);
    }

    // Get invoice totals
    const paidInvoices = await this.prisma.billingInvoice.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true },
      _count: true,
    });

    const pendingInvoices = await this.prisma.billingInvoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { totalAmount: true },
      _count: true,
    });

    return {
      mrr: totalMRR + addonMRR,
      arr: (totalMRR + addonMRR) * 12,
      baseMRR: totalMRR,
      addonMRR,
      revenueByTier: Object.entries(revenueByTier).map(([tier, amount]) => ({
        tier,
        amount,
      })),
      totalCompaniesWithBilling: billings.length,
      totalActiveAddons: activeAddons.length,
      invoicesSummary: {
        totalPaid: Number(paidInvoices._sum.totalAmount ?? 0),
        paidCount: paidInvoices._count,
        totalPending: Number(pendingInvoices._sum.totalAmount ?? 0),
        pendingCount: pendingInvoices._count,
      },
    };
  }

  // ── Employee/User Counts ───────────────────────────────────────────

  async getCompanyCounts(companyId: string) {
    const [employeeCount, userCount] = await Promise.all([
      this.prisma.employee.count({ where: { companyId } }),
      this.prisma.user.count({ where: { companyId } }),
    ]);
    return { employeeCount, userCount };
  }

  async getActiveCompanyAddons(companyId: string) {
    return this.prisma.companyAddon.findMany({
      where: { companyId, status: 'ACTIVE' },
      include: { featureAddon: true },
    });
  }
}
