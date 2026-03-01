import { Injectable, Logger } from '@nestjs/common';
import type {
  TaxEngine,
  TaxComputationInput,
  TaxComputationResult,
  AnnualProjection,
} from './tax-engine.interface';

/**
 * Indian Tax Engine — FY 2025-26
 *
 * Computes: PF, ESI, TDS (New/Old Regime), Professional Tax
 * Old Regime supports: 80C (₹1.5L), 80D (₹25K-₹1L), HRA exemption
 * Surcharge for high-income taxpayers (both regimes)
 * Tax rates loaded from TaxConfiguration table at runtime.
 * Falls back to hardcoded defaults if DB config unavailable.
 */
@Injectable()
export class IndianTaxEngine implements TaxEngine {
  private readonly logger = new Logger(IndianTaxEngine.name);

  // These will be overridden by DB-loaded config via setConfig()
  private newRegimeSlabs = [
    { min: 0, max: 400000, rate: 0 },
    { min: 400000, max: 800000, rate: 5 },
    { min: 800000, max: 1200000, rate: 10 },
    { min: 1200000, max: 1600000, rate: 15 },
    { min: 1600000, max: 2000000, rate: 20 },
    { min: 2000000, max: 2400000, rate: 25 },
    { min: 2400000, max: Infinity, rate: 30 },
  ];

  private oldRegimeSlabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
  ];

  private newRegimeStdDeduction = 75000;
  private oldRegimeStdDeduction = 50000;
  private newRegimeRebate = { maxIncome: 1200000, maxRebate: 60000 };
  private oldRegimeRebate = { maxIncome: 500000, maxRebate: 12500 };
  private cess = 4; // %

  // Old Regime deduction caps
  private section80CCap = 150000; // ₹1.5L
  private section80DSelfCap = 25000; // ₹25K (₹50K for senior citizens — not tracked here)
  private section80DParentsCap = 50000; // ₹50K for senior citizen parents

  // Surcharge slabs (both regimes, applied on income tax before cess)
  private surchargeSlabs = [
    { min: 5000000, max: Infinity, rate: 37 },
    { min: 2000000, max: 5000000, rate: 25 },
    { min: 1000000, max: 2000000, rate: 15 },
    { min: 500000, max: 1000000, rate: 10 },
  ];
  private newRegimeMaxSurchargeRate = 25; // New regime caps surcharge at 25%

  private pfConfig = {
    employeeRate: 12,
    employerEpfRate: 3.67,
    employerEpsRate: 8.33,
    ceilingMonthly: 15000,
  };

  private esiConfig = {
    employeeRate: 0.75,
    employerRate: 3.25,
    grossCeilingMonthly: 21000,
  };

  private professionalTax: Record<
    string,
    Array<{ minMonthly: number; maxMonthly: number; tax: number }>
  > = {
    Karnataka: [
      { minMonthly: 0, maxMonthly: 15000, tax: 0 },
      { minMonthly: 15001, maxMonthly: Infinity, tax: 200 },
    ],
    Maharashtra: [
      { minMonthly: 0, maxMonthly: 7500, tax: 0 },
      { minMonthly: 7501, maxMonthly: 10000, tax: 175 },
      { minMonthly: 10001, maxMonthly: Infinity, tax: 200 },
    ],
    'Tamil Nadu': [
      { minMonthly: 0, maxMonthly: 21000, tax: 0 },
      { minMonthly: 21001, maxMonthly: 30000, tax: 135 },
      { minMonthly: 30001, maxMonthly: 45000, tax: 315 },
      { minMonthly: 45001, maxMonthly: 60000, tax: 690 },
      { minMonthly: 60001, maxMonthly: 75000, tax: 1025 },
      { minMonthly: 75001, maxMonthly: Infinity, tax: 1250 },
    ],
    Telangana: [
      { minMonthly: 0, maxMonthly: 15000, tax: 0 },
      { minMonthly: 15001, maxMonthly: 20000, tax: 150 },
      { minMonthly: 20001, maxMonthly: Infinity, tax: 200 },
    ],
    'Andhra Pradesh': [
      { minMonthly: 0, maxMonthly: 15000, tax: 0 },
      { minMonthly: 15001, maxMonthly: 20000, tax: 150 },
      { minMonthly: 20001, maxMonthly: Infinity, tax: 200 },
    ],
    Gujarat: [
      { minMonthly: 0, maxMonthly: 5999, tax: 0 },
      { minMonthly: 6000, maxMonthly: 8999, tax: 80 },
      { minMonthly: 9000, maxMonthly: 11999, tax: 150 },
      { minMonthly: 12000, maxMonthly: Infinity, tax: 200 },
    ],
    'West Bengal': [
      { minMonthly: 0, maxMonthly: 10000, tax: 0 },
      { minMonthly: 10001, maxMonthly: 15000, tax: 110 },
      { minMonthly: 15001, maxMonthly: 25000, tax: 130 },
      { minMonthly: 25001, maxMonthly: 40000, tax: 150 },
      { minMonthly: 40001, maxMonthly: Infinity, tax: 200 },
    ],
  };

  /**
   * Load tax configuration from DB (called by payroll service on init/cache refresh)
   */
  setConfig(configs: Record<string, any>) {
    if (configs['IN_NEW_REGIME_BRACKETS']) {
      const c = configs['IN_NEW_REGIME_BRACKETS'];
      this.newRegimeSlabs = c.slabs || this.newRegimeSlabs;
      this.newRegimeStdDeduction =
        c.standardDeduction ?? this.newRegimeStdDeduction;
      if (c.rebate87A) this.newRegimeRebate = c.rebate87A;
      if (c.cess !== undefined) this.cess = c.cess;
    }
    if (configs['IN_OLD_REGIME_BRACKETS']) {
      const c = configs['IN_OLD_REGIME_BRACKETS'];
      this.oldRegimeSlabs = c.slabs || this.oldRegimeSlabs;
      this.oldRegimeStdDeduction =
        c.standardDeduction ?? this.oldRegimeStdDeduction;
      if (c.rebate87A) this.oldRegimeRebate = c.rebate87A;
    }
    if (configs['IN_PF_CONFIG']) {
      this.pfConfig = { ...this.pfConfig, ...configs['IN_PF_CONFIG'] };
    }
    if (configs['IN_ESI_CONFIG']) {
      this.esiConfig = { ...this.esiConfig, ...configs['IN_ESI_CONFIG'] };
    }
    if (configs['IN_PROFESSIONAL_TAX']) {
      this.professionalTax = configs['IN_PROFESSIONAL_TAX'];
    }
  }

  compute(input: TaxComputationInput): TaxComputationResult {
    const {
      grossMonthly,
      basicMonthly,
      annualCTC,
      state,
      taxRegime = 'NEW',
      pfEnabled = false,
      esiEnabled = false,
      isBonus = false,
      ytdTaxPaid = 0,
      monthsRemaining = 12,
      investments,
    } = input;

    let pfEmployee = 0;
    let pfEmployer = 0;
    let esiEmployee = 0;
    let esiEmployer = 0;
    let pt = 0;

    // PF — Skip for bonus payouts
    if (pfEnabled && !isBonus) {
      const pfBasic = Math.min(basicMonthly, this.pfConfig.ceilingMonthly);
      pfEmployee = Math.round((pfBasic * this.pfConfig.employeeRate) / 100);
      const epf = Math.round((pfBasic * this.pfConfig.employerEpfRate) / 100);
      const eps = Math.round((pfBasic * this.pfConfig.employerEpsRate) / 100);
      pfEmployer = epf + eps;
    }

    // ESI — Skip for bonus payouts, skip if gross > ceiling
    if (
      esiEnabled &&
      !isBonus &&
      grossMonthly <= this.esiConfig.grossCeilingMonthly
    ) {
      esiEmployee = Math.round(
        (grossMonthly * this.esiConfig.employeeRate) / 100,
      );
      esiEmployer = Math.round(
        (grossMonthly * this.esiConfig.employerRate) / 100,
      );
    }

    // Professional Tax — Skip for bonus payouts
    if (!isBonus) {
      pt = this.calculatePT(state, grossMonthly);
    }

    // TDS — always applies (including bonus, with different projection)
    const tds = this.calculateMonthlyTDS(
      annualCTC,
      basicMonthly,
      taxRegime,
      ytdTaxPaid,
      monthsRemaining,
      investments,
      isBonus ? grossMonthly : undefined,
    );

    const totalDeductions = pfEmployee + esiEmployee + tds + pt;
    const netSalary = grossMonthly - totalDeductions;
    const totalEmployerContributions = pfEmployer + esiEmployer;

    return {
      grossSalary: grossMonthly,
      netSalary: Math.round(netSalary),
      totalDeductions: Math.round(totalDeductions),
      totalEmployerContributions: Math.round(totalEmployerContributions),
      pfEmployee,
      pfEmployer,
      esiEmployee,
      esiEmployer,
      tds,
      pt,
      // US fields are zero for Indian engine
      ssEmployee: 0,
      ssEmployer: 0,
      medicareEmployee: 0,
      medicareEmployer: 0,
      federalWithholding: 0,
      stateWithholding: 0,
      computationBreakdown: {
        country: 'IN',
        taxRegime,
        pfBasic: pfEnabled
          ? Math.min(basicMonthly, this.pfConfig.ceilingMonthly)
          : 0,
        pfEmployeeRate: this.pfConfig.employeeRate,
        esiApplicable:
          esiEnabled &&
          grossMonthly <= this.esiConfig.grossCeilingMonthly,
        ptState: state,
        ptAmount: pt,
        tdsProjectedAnnual: annualCTC,
      },
    };
  }

  getAnnualProjection(input: TaxComputationInput): AnnualProjection {
    const { annualCTC, basicMonthly, taxRegime = 'NEW', investments } = input;

    const result = this.computeAnnualTax(annualCTC, basicMonthly, taxRegime, investments);

    const monthlyTax = Math.round(result.totalTax / 12);
    const effectiveRate = annualCTC > 0 ? (result.totalTax / annualCTC) * 100 : 0;

    return {
      annualGross: annualCTC,
      annualTaxableIncome: result.taxableIncome,
      annualTaxLiability: result.totalTax,
      monthlyTaxDeduction: monthlyTax,
      effectiveTaxRate: Math.round(effectiveRate * 100) / 100,
      breakdown: {
        standardDeduction: result.standardDeduction,
        section80C: result.section80C,
        section80D: result.section80D,
        hraExemption: result.hraExemption,
        taxBeforeRebate: result.taxOnIncome,
        surcharge: result.surcharge,
        rebateApplied: result.rebate87A > 0,
        rebate87A: result.rebate87A,
        cess: result.cessAmount,
        slabsUsed: taxRegime,
      },
    };
  }

  /**
   * Compute full annual tax with all deductions, surcharge, rebate, and cess.
   * Public so Form 16 Part B can call it directly.
   */
  computeAnnualTax(
    annualCTC: number,
    basicMonthly: number,
    taxRegime: string,
    investments?: TaxComputationInput['investments'],
  ): {
    taxableIncome: number;
    standardDeduction: number;
    section80C: number;
    section80D: number;
    hraExemption: number;
    taxOnIncome: number;
    surcharge: number;
    rebate87A: number;
    cessAmount: number;
    totalTax: number;
  } {
    const slabs = taxRegime === 'NEW' ? this.newRegimeSlabs : this.oldRegimeSlabs;
    const stdDeduction = taxRegime === 'NEW' ? this.newRegimeStdDeduction : this.oldRegimeStdDeduction;
    const rebate = taxRegime === 'NEW' ? this.newRegimeRebate : this.oldRegimeRebate;

    let totalDeductions = stdDeduction;
    let section80C = 0;
    let section80D = 0;
    let hraExemption = 0;

    // Old Regime specific deductions (80C, 80D, HRA)
    if (taxRegime === 'OLD' && investments) {
      // Section 80C — max ₹1.5L
      if (investments.section80C) {
        section80C = Math.min(investments.section80C, this.section80CCap);
        totalDeductions += section80C;
      }

      // Section 80D — medical insurance
      if (investments.section80D) {
        const selfDeduction = Math.min(investments.section80D, this.section80DSelfCap);
        const parentsDeduction = investments.section80DSenior
          ? Math.min(investments.section80DSenior, this.section80DParentsCap)
          : 0;
        section80D = selfDeduction + parentsDeduction;
        totalDeductions += section80D;
      }

      // HRA exemption — min of (actual HRA, rent - 10% basic, 50%/40% of basic)
      if (investments.hraReceived && investments.rentPaid) {
        const annualHra = investments.hraReceived * 12;
        const annualRent = investments.rentPaid * 12;
        const annualBasic = basicMonthly * 12;
        const metroPercent = investments.metroCity ? 50 : 40;

        const hraOption1 = annualHra; // Actual HRA received
        const hraOption2 = annualRent - (0.10 * annualBasic); // Rent paid - 10% of basic
        const hraOption3 = (metroPercent / 100) * annualBasic; // 50%/40% of basic

        hraExemption = Math.max(0, Math.min(hraOption1, hraOption2, hraOption3));
        totalDeductions += hraExemption;
      }
    }

    const taxableIncome = Math.max(0, annualCTC - totalDeductions);
    let taxOnIncome = this.computeSlabTax(taxableIncome, slabs);

    // Apply Section 87A rebate (before surcharge)
    let rebate87A = 0;
    if (taxableIncome <= rebate.maxIncome) {
      rebate87A = Math.min(taxOnIncome, rebate.maxRebate);
      taxOnIncome = Math.max(0, taxOnIncome - rebate87A);
    }

    // Apply surcharge for high-income taxpayers
    const surcharge = this.calculateSurcharge(taxOnIncome, taxableIncome, taxRegime);

    // Tax after surcharge
    const taxAfterSurcharge = taxOnIncome + surcharge;

    // Apply 4% Health & Education Cess on (tax + surcharge)
    const cessAmount = Math.round((taxAfterSurcharge * this.cess) / 100);
    const totalTax = Math.round(taxAfterSurcharge + cessAmount);

    return {
      taxableIncome,
      standardDeduction: stdDeduction,
      section80C,
      section80D,
      hraExemption,
      taxOnIncome: Math.round(taxOnIncome),
      surcharge: Math.round(surcharge),
      rebate87A: Math.round(rebate87A),
      cessAmount,
      totalTax,
    };
  }

  /**
   * Calculate surcharge based on taxable income.
   * New Regime caps surcharge at 25%.
   * Includes marginal relief calculation.
   */
  private calculateSurcharge(tax: number, taxableIncome: number, taxRegime: string): number {
    if (tax <= 0 || taxableIncome <= 5000000) return 0;

    let surchargeRate = 0;
    for (const slab of this.surchargeSlabs) {
      if (taxableIncome > slab.min) {
        surchargeRate = slab.rate;
        break;
      }
    }

    // New regime caps surcharge at 25%
    if (taxRegime === 'NEW' && surchargeRate > this.newRegimeMaxSurchargeRate) {
      surchargeRate = this.newRegimeMaxSurchargeRate;
    }

    let surcharge = Math.round((tax * surchargeRate) / 100);

    // Marginal relief: surcharge should not exceed the excess income over the threshold
    // Find the applicable threshold
    let threshold = 5000000;
    for (const slab of this.surchargeSlabs) {
      if (taxableIncome > slab.min && slab.min >= 5000000) {
        threshold = slab.min;
        break;
      }
    }

    const excessIncome = taxableIncome - threshold;
    if (surcharge > excessIncome) {
      surcharge = excessIncome; // Marginal relief
    }

    return surcharge;
  }

  /**
   * Calculate monthly TDS using annualization method:
   * 1. Project annual income
   * 2. Apply standard deduction + Old Regime deductions (80C/80D/HRA)
   * 3. Compute tax from slabs
   * 4. Apply 87A rebate
   * 5. Apply surcharge for high income
   * 6. Add 4% cess
   * 7. Divide by remaining months
   * 8. Subtract YTD tax already paid
   */
  private calculateMonthlyTDS(
    annualCTC: number,
    basicMonthly: number,
    taxRegime: string,
    ytdTaxPaid: number,
    monthsRemaining: number,
    investments?: TaxComputationInput['investments'],
    bonusAmount?: number,
  ): number {
    // For bonus: add bonus to annual projection
    const projectedAnnual = bonusAmount ? annualCTC + bonusAmount : annualCTC;

    const result = this.computeAnnualTax(projectedAnnual, basicMonthly, taxRegime, investments);

    // Monthly TDS = (Total annual tax - YTD paid) / months remaining
    const remaining = Math.max(1, monthsRemaining);
    const monthlyTDS = Math.max(0, (result.totalTax - ytdTaxPaid) / remaining);

    return Math.round(monthlyTDS);
  }

  private computeSlabTax(
    taxableIncome: number,
    slabs: Array<{ min: number; max: number; rate: number }>,
  ): number {
    let tax = 0;
    for (const slab of slabs) {
      if (taxableIncome <= slab.min) break;
      const taxableInSlab =
        Math.min(taxableIncome, slab.max === Infinity ? taxableIncome : slab.max) - slab.min;
      tax += (taxableInSlab * slab.rate) / 100;
    }
    return tax;
  }

  private calculatePT(state: string, grossMonthly: number): number {
    const statePT = this.professionalTax[state];
    if (!statePT) return 0; // States without PT (Delhi, UP, Rajasthan, etc.)

    for (const slab of statePT) {
      if (grossMonthly >= slab.minMonthly && grossMonthly <= slab.maxMonthly) {
        return slab.tax;
      }
    }
    return 0;
  }
}
