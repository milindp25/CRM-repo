import { Injectable, Logger } from '@nestjs/common';
import type {
  TaxEngine,
  TaxComputationInput,
  TaxComputationResult,
  AnnualProjection,
} from './tax-engine.interface';

/**
 * US Tax Engine — Tax Year 2025
 *
 * Computes: Social Security, Medicare, Federal Withholding, State Withholding
 * Tax rates loaded from TaxConfiguration table at runtime.
 * Falls back to hardcoded defaults if DB config unavailable.
 */
@Injectable()
export class USTaxEngine implements TaxEngine {
  private readonly logger = new Logger(USTaxEngine.name);

  // FICA config
  private ssEmployeeRate = 6.2;
  private ssEmployerRate = 6.2;
  private ssWageCap = 176100;
  private medicareEmployeeRate = 1.45;
  private medicareEmployerRate = 1.45;
  private additionalMedicareRate = 0.9;
  private additionalMedicareThreshold = 200000;

  // Federal brackets by filing status
  private standardDeductions: Record<string, number> = {
    SINGLE: 15750,
    MARRIED_FILING_JOINTLY: 31500,
    MARRIED_FILING_SEPARATELY: 15750,
    HEAD_OF_HOUSEHOLD: 23625,
  };

  private federalBrackets: Record<
    string,
    Array<{ min: number; max: number; rate: number }>
  > = {
    SINGLE: [
      { min: 0, max: 11925, rate: 10 },
      { min: 11925, max: 48475, rate: 12 },
      { min: 48475, max: 103350, rate: 22 },
      { min: 103350, max: 197300, rate: 24 },
      { min: 197300, max: 250525, rate: 32 },
      { min: 250525, max: 626350, rate: 35 },
      { min: 626350, max: Infinity, rate: 37 },
    ],
    MARRIED_FILING_JOINTLY: [
      { min: 0, max: 23850, rate: 10 },
      { min: 23850, max: 96950, rate: 12 },
      { min: 96950, max: 206700, rate: 22 },
      { min: 206700, max: 394600, rate: 24 },
      { min: 394600, max: 501050, rate: 32 },
      { min: 501050, max: 751600, rate: 35 },
      { min: 751600, max: Infinity, rate: 37 },
    ],
    MARRIED_FILING_SEPARATELY: [
      { min: 0, max: 11925, rate: 10 },
      { min: 11925, max: 48475, rate: 12 },
      { min: 48475, max: 103350, rate: 22 },
      { min: 103350, max: 197300, rate: 24 },
      { min: 197300, max: 250525, rate: 32 },
      { min: 250525, max: 375800, rate: 35 },
      { min: 375800, max: Infinity, rate: 37 },
    ],
    HEAD_OF_HOUSEHOLD: [
      { min: 0, max: 17000, rate: 10 },
      { min: 17000, max: 64850, rate: 12 },
      { min: 64850, max: 103350, rate: 22 },
      { min: 103350, max: 197300, rate: 24 },
      { min: 197300, max: 250500, rate: 32 },
      { min: 250500, max: 626350, rate: 35 },
      { min: 626350, max: Infinity, rate: 37 },
    ],
  };

  // State tax config
  private stateTax: Record<
    string,
    | { type: 'none' }
    | { type: 'flat'; rate: number }
    | {
        type: 'bracket';
        brackets: Array<{ min: number; max: number; rate: number }>;
      }
  > = {
    TX: { type: 'none' },
    FL: { type: 'none' },
    WA: { type: 'none' },
    NV: { type: 'none' },
    WY: { type: 'none' },
    AK: { type: 'none' },
    TN: { type: 'none' },
    SD: { type: 'none' },
    NH: { type: 'none' },
    IL: { type: 'flat', rate: 4.95 },
    IN: { type: 'flat', rate: 3.05 },
    MI: { type: 'flat', rate: 4.25 },
    PA: { type: 'flat', rate: 3.07 },
    CO: { type: 'flat', rate: 4.4 },
    NC: { type: 'flat', rate: 4.5 },
    UT: { type: 'flat', rate: 4.65 },
    MA: { type: 'flat', rate: 5.0 },
    AZ: { type: 'flat', rate: 2.5 },
    KY: { type: 'flat', rate: 4.0 },
    GA: { type: 'flat', rate: 5.39 },
    CA: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 10412, rate: 1 },
        { min: 10412, max: 24684, rate: 2 },
        { min: 24684, max: 38959, rate: 4 },
        { min: 38959, max: 54081, rate: 6 },
        { min: 54081, max: 68350, rate: 8 },
        { min: 68350, max: 349137, rate: 9.3 },
        { min: 349137, max: 418961, rate: 10.3 },
        { min: 418961, max: 698271, rate: 11.3 },
        { min: 698271, max: Infinity, rate: 12.3 },
      ],
    },
    NY: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 8500, rate: 4 },
        { min: 8500, max: 11700, rate: 4.5 },
        { min: 11700, max: 13900, rate: 5.25 },
        { min: 13900, max: 80650, rate: 5.5 },
        { min: 80650, max: 215400, rate: 6 },
        { min: 215400, max: 1077550, rate: 6.85 },
        { min: 1077550, max: 5000000, rate: 9.65 },
        { min: 5000000, max: 25000000, rate: 10.3 },
        { min: 25000000, max: Infinity, rate: 10.9 },
      ],
    },
    NJ: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 20000, rate: 1.4 },
        { min: 20000, max: 35000, rate: 1.75 },
        { min: 35000, max: 40000, rate: 3.5 },
        { min: 40000, max: 75000, rate: 5.525 },
        { min: 75000, max: 500000, rate: 6.37 },
        { min: 500000, max: 1000000, rate: 8.97 },
        { min: 1000000, max: Infinity, rate: 10.75 },
      ],
    },
    OH: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 26050, rate: 0 },
        { min: 26050, max: 100000, rate: 2.75 },
        { min: 100000, max: Infinity, rate: 3.5 },
      ],
    },
    MN: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 31690, rate: 5.35 },
        { min: 31690, max: 104090, rate: 6.8 },
        { min: 104090, max: 183340, rate: 7.85 },
        { min: 183340, max: Infinity, rate: 9.85 },
      ],
    },
    OR: {
      type: 'bracket',
      brackets: [
        { min: 0, max: 4050, rate: 4.75 },
        { min: 4050, max: 10200, rate: 6.75 },
        { min: 10200, max: 125000, rate: 8.75 },
        { min: 125000, max: Infinity, rate: 9.9 },
      ],
    },
  };

  /**
   * Load tax configuration from DB (called by payroll service on init/cache refresh)
   */
  setConfig(configs: Record<string, any>) {
    if (configs['US_FICA_CONFIG']) {
      const c = configs['US_FICA_CONFIG'];
      if (c.socialSecurity) {
        this.ssEmployeeRate = c.socialSecurity.employeeRate ?? this.ssEmployeeRate;
        this.ssEmployerRate = c.socialSecurity.employerRate ?? this.ssEmployerRate;
        this.ssWageCap = c.socialSecurity.wageCap ?? this.ssWageCap;
      }
      if (c.medicare) {
        this.medicareEmployeeRate = c.medicare.employeeRate ?? this.medicareEmployeeRate;
        this.medicareEmployerRate = c.medicare.employerRate ?? this.medicareEmployerRate;
        this.additionalMedicareRate = c.medicare.additionalMedicareRate ?? this.additionalMedicareRate;
        this.additionalMedicareThreshold = c.medicare.additionalMedicareThreshold ?? this.additionalMedicareThreshold;
      }
    }
    if (configs['US_FEDERAL_TAX']) {
      const c = configs['US_FEDERAL_TAX'];
      if (c.standardDeduction) {
        this.standardDeductions = { ...this.standardDeductions, ...c.standardDeduction };
      }
      if (c.brackets) {
        this.federalBrackets = { ...this.federalBrackets, ...c.brackets };
      }
    }
    if (configs['US_STATE_TAX']) {
      this.stateTax = { ...this.stateTax, ...configs['US_STATE_TAX'] };
    }
  }

  compute(input: TaxComputationInput): TaxComputationResult {
    const {
      grossMonthly,
      state,
      filingStatus = 'SINGLE',
      isBonus = false,
      ytdSsWages = 0,
      ytdGrossEarnings = 0,
      w4Allowances = 0,
    } = input;

    // Annualize for bracket calculations
    const annualGross = grossMonthly * 12;

    let ssEmployee = 0;
    let ssEmployer = 0;
    let medicareEmployee = 0;
    let medicareEmployer = 0;

    // FICA — Skip for bonus payouts
    if (!isBonus) {
      // Social Security — cap at wage base
      const ssResult = this.calculateSocialSecurity(grossMonthly, ytdSsWages);
      ssEmployee = ssResult.employee;
      ssEmployer = ssResult.employer;

      // Medicare — no cap, but additional rate above threshold
      const medicareResult = this.calculateMedicare(
        grossMonthly,
        ytdGrossEarnings,
      );
      medicareEmployee = medicareResult.employee;
      medicareEmployer = medicareResult.employer;
    }

    // Federal withholding — always applies (including bonus)
    // W-4 allowances reduce taxable income for withholding purposes
    const federalWithholding = this.calculateFederalWithholding(
      annualGross,
      filingStatus,
      w4Allowances,
    );

    // State withholding — always applies
    const stateWithholding = this.calculateStateWithholding(annualGross, state);

    const totalDeductions =
      ssEmployee + medicareEmployee + federalWithholding + stateWithholding;
    const netSalary = grossMonthly - totalDeductions;
    const totalEmployerContributions = ssEmployer + medicareEmployer;

    return {
      grossSalary: grossMonthly,
      netSalary: Math.round(netSalary),
      totalDeductions: Math.round(totalDeductions),
      totalEmployerContributions: Math.round(totalEmployerContributions),
      // India fields are zero for US engine
      pfEmployee: 0,
      pfEmployer: 0,
      esiEmployee: 0,
      esiEmployer: 0,
      tds: 0,
      pt: 0,
      ssEmployee,
      ssEmployer,
      medicareEmployee,
      medicareEmployer,
      federalWithholding,
      stateWithholding,
      computationBreakdown: {
        country: 'US',
        filingStatus,
        ssWageCap: this.ssWageCap,
        ytdSsWages,
        ssCapped: ytdSsWages >= this.ssWageCap,
        additionalMedicare:
          ytdGrossEarnings > this.additionalMedicareThreshold,
        stateType: this.stateTax[state]?.type || 'unknown',
        state,
      },
    };
  }

  getAnnualProjection(input: TaxComputationInput): AnnualProjection {
    const { annualCTC, filingStatus = 'SINGLE', state } = input;

    const stdDeduction = this.standardDeductions[filingStatus] || 15750;
    const taxableIncome = Math.max(0, annualCTC - stdDeduction);
    const brackets = this.federalBrackets[filingStatus] || this.federalBrackets['SINGLE'];
    const federalTax = this.computeBracketTax(taxableIncome, brackets);

    // State tax
    let stateTaxAnnual = 0;
    const stateConfig = this.stateTax[state];
    if (stateConfig) {
      if (stateConfig.type === 'flat') {
        stateTaxAnnual = Math.round((annualCTC * stateConfig.rate) / 100);
      } else if (stateConfig.type === 'bracket') {
        stateTaxAnnual = this.computeBracketTax(annualCTC, stateConfig.brackets);
      }
    }

    // FICA
    const ssAnnual = Math.round(
      (Math.min(annualCTC, this.ssWageCap) * this.ssEmployeeRate) / 100,
    );
    const medicareAnnual = Math.round(
      (annualCTC * this.medicareEmployeeRate) / 100,
    );
    const additionalMedicare =
      annualCTC > this.additionalMedicareThreshold
        ? Math.round(
            ((annualCTC - this.additionalMedicareThreshold) *
              this.additionalMedicareRate) /
              100,
          )
        : 0;

    const totalTax = federalTax + stateTaxAnnual + ssAnnual + medicareAnnual + additionalMedicare;
    const monthlyTax = Math.round(totalTax / 12);
    const effectiveRate = annualCTC > 0 ? (totalTax / annualCTC) * 100 : 0;

    return {
      annualGross: annualCTC,
      annualTaxableIncome: taxableIncome,
      annualTaxLiability: totalTax,
      monthlyTaxDeduction: monthlyTax,
      effectiveTaxRate: Math.round(effectiveRate * 100) / 100,
      breakdown: {
        standardDeduction: stdDeduction,
        federalTax,
        stateTax: stateTaxAnnual,
        socialSecurity: ssAnnual,
        medicare: medicareAnnual,
        additionalMedicare,
      },
    };
  }

  /**
   * Social Security: 6.2% each (employee + employer), capped at wage base.
   * Handles partial month when YTD crosses the cap mid-period.
   */
  private calculateSocialSecurity(
    grossMonthly: number,
    ytdSsWages: number,
  ): { employee: number; employer: number } {
    if (ytdSsWages >= this.ssWageCap) {
      return { employee: 0, employer: 0 }; // Cap already reached
    }

    const remainingCap = this.ssWageCap - ytdSsWages;
    const taxableWages = Math.min(grossMonthly, remainingCap);

    return {
      employee: Math.round((taxableWages * this.ssEmployeeRate) / 100),
      employer: Math.round((taxableWages * this.ssEmployerRate) / 100),
    };
  }

  /**
   * Medicare: 1.45% always + 0.9% additional on earnings over $200K YTD.
   */
  private calculateMedicare(
    grossMonthly: number,
    ytdGrossEarnings: number,
  ): { employee: number; employer: number } {
    const baseMedicare = Math.round(
      (grossMonthly * this.medicareEmployeeRate) / 100,
    );
    const employerMedicare = Math.round(
      (grossMonthly * this.medicareEmployerRate) / 100,
    );

    // Additional Medicare on earnings above threshold
    let additionalMedicare = 0;
    if (ytdGrossEarnings > this.additionalMedicareThreshold) {
      // Entire month is above threshold
      additionalMedicare = Math.round(
        (grossMonthly * this.additionalMedicareRate) / 100,
      );
    } else if (
      ytdGrossEarnings + grossMonthly >
      this.additionalMedicareThreshold
    ) {
      // Crosses threshold this month — only the excess is taxed
      const excess =
        ytdGrossEarnings + grossMonthly - this.additionalMedicareThreshold;
      additionalMedicare = Math.round(
        (excess * this.additionalMedicareRate) / 100,
      );
    }

    return {
      employee: baseMedicare + additionalMedicare,
      employer: employerMedicare, // Employer doesn't pay additional Medicare
    };
  }

  /**
   * Federal withholding: Standard deduction → W-4 allowance reduction → bracket tax → monthly amount.
   * W-4 allowances: Each allowance reduces annual taxable income by $4,300 (2025 equivalent).
   */
  private calculateFederalWithholding(
    annualGross: number,
    filingStatus: string,
    w4Allowances: number = 0,
  ): number {
    const stdDeduction = this.standardDeductions[filingStatus] || 15750;
    const allowanceDeduction = w4Allowances * 4300; // $4,300 per allowance (2025 personal exemption equivalent)
    const taxableIncome = Math.max(0, annualGross - stdDeduction - allowanceDeduction);
    const brackets =
      this.federalBrackets[filingStatus] || this.federalBrackets['SINGLE'];
    const annualTax = this.computeBracketTax(taxableIncome, brackets);
    return Math.round(annualTax / 12);
  }

  /**
   * State withholding: None / flat rate / bracket based on state.
   */
  private calculateStateWithholding(
    annualGross: number,
    state: string,
  ): number {
    const config = this.stateTax[state];
    if (!config || config.type === 'none') return 0;

    if (config.type === 'flat') {
      return Math.round((annualGross * config.rate) / 100 / 12);
    }

    if (config.type === 'bracket') {
      const annualTax = this.computeBracketTax(annualGross, config.brackets);
      return Math.round(annualTax / 12);
    }

    return 0;
  }

  private computeBracketTax(
    taxableIncome: number,
    brackets: Array<{ min: number; max: number; rate: number }>,
  ): number {
    let tax = 0;
    for (const bracket of brackets) {
      if (taxableIncome <= bracket.min) break;
      const taxableInBracket =
        Math.min(
          taxableIncome,
          bracket.max === Infinity ? taxableIncome : bracket.max,
        ) - bracket.min;
      tax += (taxableInBracket * bracket.rate) / 100;
    }
    return Math.round(tax);
  }
}
