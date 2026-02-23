/**
 * Tax Default Seed Values
 *
 * These are the initial tax configuration values used to seed the TaxConfiguration
 * table at day-0. Admin can update these via the admin API for new fiscal years
 * without code redeployment.
 *
 * These constants are ONLY used for the initial database seed migration.
 * Tax engines load rates from the TaxConfiguration DB table at runtime.
 */

// =============================================================================
// INDIA — FY 2025-26 (April 2025 - March 2026)
// =============================================================================

/**
 * India New Tax Regime Slabs (FY 2025-26)
 * Budget 2025 rates — default for all employees unless old regime opted
 */
export const IN_NEW_REGIME_BRACKETS = {
  fiscalYear: 2025,
  standardDeduction: 75000,
  slabs: [
    { min: 0, max: 400000, rate: 0 },
    { min: 400000, max: 800000, rate: 5 },
    { min: 800000, max: 1200000, rate: 10 },
    { min: 1200000, max: 1600000, rate: 15 },
    { min: 1600000, max: 2000000, rate: 20 },
    { min: 2000000, max: 2400000, rate: 25 },
    { min: 2400000, max: Infinity, rate: 30 },
  ],
  rebate87A: {
    maxIncome: 1200000, // Rebate available if taxable income <= 12L
    maxRebate: 60000, // Maximum rebate amount (tax on 12L under new regime)
  },
  cess: 4, // Health & Education Cess
};

/**
 * India Old Tax Regime Slabs (FY 2025-26)
 * For employees who opt for old regime
 */
export const IN_OLD_REGIME_BRACKETS = {
  fiscalYear: 2025,
  standardDeduction: 50000,
  slabs: [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
  ],
  rebate87A: {
    maxIncome: 500000, // Rebate if taxable income <= 5L
    maxRebate: 12500,
  },
  cess: 4,
};

/**
 * Provident Fund Rates (India)
 * PF is optional at company level (mandatory only for 20+ employees)
 */
export const IN_PF_CONFIG = {
  employeeRate: 12, // 12% of basic (capped)
  employerEpfRate: 3.67, // 3.67% to EPF
  employerEpsRate: 8.33, // 8.33% to EPS
  ceilingMonthly: 15000, // Max basic for PF calculation
};

/**
 * ESI Rates (India)
 * ESI is optional at company level (mandatory for 10+ employees with wages ≤ ₹21K)
 */
export const IN_ESI_CONFIG = {
  employeeRate: 0.75,
  employerRate: 3.25,
  grossCeilingMonthly: 21000, // Employees above this are not covered
};

/**
 * Professional Tax (India) — State-wise monthly deductions
 * Key = state name or abbreviation, Value = monthly PT amount
 * Note: PT varies by salary slab in some states; simplified to common rates.
 */
export const IN_PROFESSIONAL_TAX: Record<string, Array<{ minMonthly: number; maxMonthly: number; tax: number }>> = {
  // Karnataka
  Karnataka: [
    { minMonthly: 0, maxMonthly: 15000, tax: 0 },
    { minMonthly: 15001, maxMonthly: Infinity, tax: 200 },
  ],
  // Maharashtra
  Maharashtra: [
    { minMonthly: 0, maxMonthly: 7500, tax: 0 },
    { minMonthly: 7501, maxMonthly: 10000, tax: 175 },
    { minMonthly: 10001, maxMonthly: Infinity, tax: 200 },
    // Note: Feb month is 300 for > 10K bracket — handle in engine
  ],
  // Tamil Nadu
  'Tamil Nadu': [
    { minMonthly: 0, maxMonthly: 21000, tax: 0 },
    { minMonthly: 21001, maxMonthly: 30000, tax: 135 },
    { minMonthly: 30001, maxMonthly: 45000, tax: 315 },
    { minMonthly: 45001, maxMonthly: 60000, tax: 690 },
    { minMonthly: 60001, maxMonthly: 75000, tax: 1025 },
    { minMonthly: 75001, maxMonthly: Infinity, tax: 1250 },
  ],
  // Telangana
  Telangana: [
    { minMonthly: 0, maxMonthly: 15000, tax: 0 },
    { minMonthly: 15001, maxMonthly: 20000, tax: 150 },
    { minMonthly: 20001, maxMonthly: Infinity, tax: 200 },
  ],
  // Andhra Pradesh
  'Andhra Pradesh': [
    { minMonthly: 0, maxMonthly: 15000, tax: 0 },
    { minMonthly: 15001, maxMonthly: 20000, tax: 150 },
    { minMonthly: 20001, maxMonthly: Infinity, tax: 200 },
  ],
  // West Bengal
  'West Bengal': [
    { minMonthly: 0, maxMonthly: 10000, tax: 0 },
    { minMonthly: 10001, maxMonthly: 15000, tax: 110 },
    { minMonthly: 15001, maxMonthly: 25000, tax: 130 },
    { minMonthly: 25001, maxMonthly: 40000, tax: 150 },
    { minMonthly: 40001, maxMonthly: Infinity, tax: 200 },
  ],
  // Gujarat
  Gujarat: [
    { minMonthly: 0, maxMonthly: 5999, tax: 0 },
    { minMonthly: 6000, maxMonthly: 8999, tax: 80 },
    { minMonthly: 9000, maxMonthly: 11999, tax: 150 },
    { minMonthly: 12000, maxMonthly: Infinity, tax: 200 },
  ],
  // Rajasthan — no professional tax
  // Delhi — no professional tax
  // Haryana — no professional tax
  // Uttar Pradesh — no professional tax
};

// =============================================================================
// USA — Tax Year 2025
// =============================================================================

/**
 * FICA — Social Security & Medicare (US 2025)
 */
export const US_FICA_CONFIG = {
  socialSecurity: {
    employeeRate: 6.2,
    employerRate: 6.2,
    wageCap: 176100, // Annual SS wage base limit
  },
  medicare: {
    employeeRate: 1.45,
    employerRate: 1.45,
    additionalMedicareRate: 0.9, // Additional on earnings > $200K
    additionalMedicareThreshold: 200000,
  },
};

/**
 * US Federal Income Tax Brackets — 2025
 * Standard deductions and bracket tables by filing status
 */
export const US_FEDERAL_TAX_2025 = {
  standardDeduction: {
    SINGLE: 15750,
    MARRIED_FILING_JOINTLY: 31500,
    MARRIED_FILING_SEPARATELY: 15750,
    HEAD_OF_HOUSEHOLD: 23625,
  },
  brackets: {
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
  },
};

/**
 * US State Income Tax (2025)
 * type: 'none' | 'flat' | 'bracket'
 * States with no income tax, flat rates, or progressive brackets
 */
export const US_STATE_TAX: Record<
  string,
  | { type: 'none' }
  | { type: 'flat'; rate: number }
  | { type: 'bracket'; brackets: Array<{ min: number; max: number; rate: number }> }
> = {
  // No income tax states
  TX: { type: 'none' },
  FL: { type: 'none' },
  WA: { type: 'none' },
  NV: { type: 'none' },
  WY: { type: 'none' },
  AK: { type: 'none' },
  TN: { type: 'none' },
  SD: { type: 'none' },
  NH: { type: 'none' }, // No wage income tax (dividends/interest only)

  // Flat rate states
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

  // Bracket states (simplified — major states)
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
 * Generates the full set of TaxConfiguration seed records.
 * Used by the Prisma seed script to populate the TaxConfiguration table at day-0.
 */
export function generateTaxConfigSeedData() {
  const now = new Date();

  return [
    // India New Regime FY 2025-26
    {
      country: 'IN',
      configKey: 'IN_NEW_REGIME_BRACKETS',
      configValue: IN_NEW_REGIME_BRACKETS,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // India Old Regime FY 2025-26
    {
      country: 'IN',
      configKey: 'IN_OLD_REGIME_BRACKETS',
      configValue: IN_OLD_REGIME_BRACKETS,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // India PF
    {
      country: 'IN',
      configKey: 'IN_PF_CONFIG',
      configValue: IN_PF_CONFIG,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // India ESI
    {
      country: 'IN',
      configKey: 'IN_ESI_CONFIG',
      configValue: IN_ESI_CONFIG,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // India Professional Tax
    {
      country: 'IN',
      configKey: 'IN_PROFESSIONAL_TAX',
      configValue: IN_PROFESSIONAL_TAX,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // US FICA 2025
    {
      country: 'US',
      configKey: 'US_FICA_CONFIG',
      configValue: US_FICA_CONFIG,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // US Federal Tax 2025
    {
      country: 'US',
      configKey: 'US_FEDERAL_TAX',
      configValue: US_FEDERAL_TAX_2025,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    // US State Tax 2025
    {
      country: 'US',
      configKey: 'US_STATE_TAX',
      configValue: US_STATE_TAX,
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}
