/**
 * Payroll Country
 * Determines which tax engine and compliance rules apply
 */
export enum PayrollCountry {
  IN = 'IN',
  US = 'US',
}

/**
 * India Tax Regime
 * Employee chooses between New and Old regime for TDS calculation
 */
export enum TaxRegime {
  NEW = 'NEW',
  OLD = 'OLD',
}

/**
 * US Filing Status (W-4)
 * Determines federal tax withholding brackets
 */
export enum USFilingStatus {
  SINGLE = 'SINGLE',
  MARRIED_FILING_JOINTLY = 'MARRIED_FILING_JOINTLY',
  MARRIED_FILING_SEPARATELY = 'MARRIED_FILING_SEPARATELY',
  HEAD_OF_HOUSEHOLD = 'HEAD_OF_HOUSEHOLD',
}

/**
 * Salary Component Type
 * Whether a salary component is an earning or deduction
 */
export enum SalaryComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

/**
 * Salary Component Calculation Type
 * How the component value is computed
 */
export enum SalaryComponentCalcType {
  FIXED = 'FIXED',
  PERCENTAGE_OF_BASIC = 'PERCENTAGE_OF_BASIC',
  PERCENTAGE_OF_GROSS = 'PERCENTAGE_OF_GROSS',
}

/**
 * Payroll Batch Status
 * Tracks batch payroll processing state
 */
export enum PayrollBatchStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

/**
 * Pay Frequency
 * India: MONTHLY only. US: company chooses.
 */
export enum PayFrequency {
  MONTHLY = 'MONTHLY',
  SEMI_MONTHLY = 'SEMI_MONTHLY',
  BI_WEEKLY = 'BI_WEEKLY',
  WEEKLY = 'WEEKLY',
}

/**
 * Bonus Type
 * How bonus amount is determined
 */
export enum BonusType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE_OF_BASIC = 'PERCENTAGE_OF_BASIC',
  PERCENTAGE_OF_CTC = 'PERCENTAGE_OF_CTC',
}

/**
 * Payroll Approval Status
 * Used when a payroll approval workflow is configured
 */
export enum PayrollApprovalStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
