/**
 * Tax Engine Interface
 *
 * Strategy pattern interface for tax computation.
 * Implementations: IndianTaxEngine, USTaxEngine
 * Selected via TaxEngineFactory based on company's payrollCountry.
 */

export interface TaxComputationInput {
  // Salary amounts
  grossMonthly: number;
  basicMonthly: number;
  annualCTC: number;

  // Location
  state: string; // India state name or US state abbreviation

  // Time context
  fiscalYear: number; // 2025 for FY 2025-26 (IN) or CY 2025 (US)
  payPeriodMonth: number; // 1-12
  monthsRemaining: number; // Months remaining in fiscal year (for TDS projection)

  // YTD cumulative data (critical for caps and projections)
  ytdGrossEarnings: number;
  ytdTaxPaid: number;
  ytdSsWages: number; // US only — Social Security wages YTD

  // India-specific
  taxRegime?: 'NEW' | 'OLD'; // India tax regime
  pfEnabled?: boolean; // Company-level PF toggle
  esiEnabled?: boolean; // Company-level ESI toggle

  // US-specific
  filingStatus?: string; // SINGLE, MARRIED_FILING_JOINTLY, etc.
  w4Allowances?: number; // W-4 allowances

  // Bonus flag — different treatment: no PF/ESI/FICA
  isBonus?: boolean;
}

export interface TaxComputationResult {
  // Summary
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalEmployerContributions: number;

  // India deductions
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  pt: number; // Professional Tax

  // US deductions
  ssEmployee: number;
  ssEmployer: number;
  medicareEmployee: number;
  medicareEmployer: number;
  federalWithholding: number;
  stateWithholding: number;

  // Detailed breakdown for payslip display
  computationBreakdown: Record<string, any>;
}

export interface AnnualProjection {
  annualGross: number;
  annualTaxableIncome: number;
  annualTaxLiability: number;
  monthlyTaxDeduction: number;
  effectiveTaxRate: number;
  breakdown: Record<string, any>;
}

export interface TaxEngine {
  /**
   * Compute monthly tax deductions for a single pay period.
   */
  compute(input: TaxComputationInput): TaxComputationResult;

  /**
   * Project annual tax liability based on current salary.
   * Useful for showing employees their estimated annual tax.
   */
  getAnnualProjection(input: TaxComputationInput): AnnualProjection;
}
