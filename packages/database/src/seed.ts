/**
 * Database Seed Script
 * Seeds only system infrastructure data (billing plans, tax configs, super admin).
 * Customer data (companies, employees, etc.) is created via the app's registration flow.
 */
import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

import * as dotenv from "dotenv";
import path from "path";

// Load env from multiple possible locations
dotenv.config({ path: path.resolve(__dirname, "../../apps/api/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // ──────────────────────────────────────────────
  // 1. System company + Super Admin (required for admin portal)
  // ──────────────────────────────────────────────
  console.log('🔑 Creating system company & super admin...');
  const systemCompany = await prisma.company.upsert({
    where: { companyCode: 'SYSTEM' },
    update: {},
    create: {
      companyCode: 'SYSTEM',
      companyName: 'HRPlatform System',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      featuresEnabled: [],
      onboardingCompleted: true,
    },
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('SEED_ADMIN_PASSWORD env var is required. Set it in packages/database/.env');
  const superAdminHash = await bcrypt.hash(adminPassword, 12);

  const superAdmin = await prisma.user.upsert({
    where: { companyId_email: { companyId: systemCompany.id, email: 'superadmin@hrplatform.com' } },
    update: { passwordHash: superAdminHash },
    create: {
      companyId: systemCompany.id,
      email: 'superadmin@hrplatform.com',
      passwordHash: superAdminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Super admin: ${superAdmin.email}\n`);

  // ──────────────────────────────────────────────
  // 2. Billing Plans (required for subscription system)
  // ──────────────────────────────────────────────
  console.log('💳 Creating billing plans...');
  const plans = [
    { name: 'Starter', tier: 'FREE', basePrice: 0, yearlyBasePrice: 0, pricePerEmployee: 0, pricePerUser: 0, includedEmployees: 10, includedUsers: 5 },
    { name: 'Basic', tier: 'BASIC', basePrice: 49, yearlyBasePrice: 470, pricePerEmployee: 4, pricePerUser: 8, includedEmployees: 25, includedUsers: 10 },
    { name: 'Professional', tier: 'PROFESSIONAL', basePrice: 149, yearlyBasePrice: 1430, pricePerEmployee: 3, pricePerUser: 6, includedEmployees: 100, includedUsers: 25 },
    { name: 'Enterprise', tier: 'ENTERPRISE', basePrice: 499, yearlyBasePrice: 4790, pricePerEmployee: 2, pricePerUser: 4, includedEmployees: 500, includedUsers: 100 },
  ];

  // BillingPlan has no unique constraint on tier, so check existence first
  const existingPlans = await prisma.billingPlan.count();
  if (existingPlans === 0) {
    for (const plan of plans) {
      await prisma.billingPlan.create({ data: { ...plan, isActive: true } });
    }
    console.log(`✅ Created ${plans.length} billing plans\n`);
  } else {
    console.log(`⏭️  Billing plans already exist (${existingPlans} found), skipping\n`);
  }

  // ──────────────────────────────────────────────
  // 3. Feature Add-ons (required for addon purchase system)
  // ──────────────────────────────────────────────
  console.log('🧩 Creating feature add-ons...');
  const addons = [
    // Growth Modules (Enterprise-only, purchasable by BASIC/PROFESSIONAL)
    { feature: 'PERFORMANCE', name: 'Performance Management', description: 'Goals, OKRs, and performance review cycles with 360-degree feedback.', price: 39, yearlyPrice: 374 },
    { feature: 'RECRUITMENT', name: 'Recruitment & ATS', description: 'Job postings, applicant tracking, interview scheduling, and hiring pipeline.', price: 49, yearlyPrice: 470 },
    { feature: 'TRAINING', name: 'Training & LMS', description: 'Training courses, enrollment tracking, certifications, and completion reports.', price: 29, yearlyPrice: 279 },
    { feature: 'ASSETS', name: 'Asset Management', description: 'Track company assets (laptops, phones, etc.) assigned to employees.', price: 19, yearlyPrice: 182 },
    { feature: 'EXPENSES', name: 'Expense Management', description: 'Expense claims, receipt uploads, approval workflows, and reimbursement tracking.', price: 29, yearlyPrice: 279 },
    { feature: 'SHIFTS', name: 'Shift Management', description: 'Shift scheduling, rotation management, and shift swap requests.', price: 19, yearlyPrice: 182 },
    { feature: 'POLICIES', name: 'Policy Management', description: 'Company policies, handbooks, version control, and employee acknowledgment tracking.', price: 9, yearlyPrice: 86 },
    { feature: 'SURVEYS', name: 'Pulse Surveys', description: 'Employee engagement surveys, pulse checks, and NPS scoring with analytics.', price: 19, yearlyPrice: 182 },
    { feature: 'CONTRACTORS', name: 'Contractor Management', description: 'Contractor profiles, contracts, invoice management, and payment tracking.', price: 29, yearlyPrice: 279 },
    // Integration & Compliance (Enterprise-only)
    { feature: 'WEBHOOKS', name: 'Webhooks', description: 'Event-driven webhook notifications for third-party system integrations.', price: 29, yearlyPrice: 279 },
    { feature: 'API_ACCESS', name: 'API Access', description: 'REST API keys for programmatic access to HR data and external integrations.', price: 59, yearlyPrice: 566 },
    { feature: 'SSO', name: 'Single Sign-On (SSO)', description: 'SAML/OAuth SSO integration with Google, Microsoft, Okta, and more.', price: 39, yearlyPrice: 374 },
    { feature: 'ANALYTICS', name: 'Advanced Analytics', description: 'HR analytics dashboards with headcount, attrition, diversity, and payroll insights.', price: 49, yearlyPrice: 470 },
    // Pure add-on (not in any tier, always purchasable)
    { feature: 'PAYSLIP_ARCHIVE', name: 'Payslip Archive', description: 'Store and access historical payslips for all employees with unlimited retention.', price: 29, yearlyPrice: 279 },
  ];

  for (const addon of addons) {
    await prisma.featureAddon.upsert({
      where: { feature: addon.feature },
      update: { ...addon, isActive: true },
      create: { ...addon, isActive: true },
    });
  }
  console.log(`✅ Created ${addons.length} feature add-ons\n`);

  // ──────────────────────────────────────────────
  // 4. Tax Configurations (required for payroll engine)
  // ──────────────────────────────────────────────
  console.log('📊 Seeding tax configurations...');
  const taxConfigs = [
    {
      country: 'IN', configKey: 'IN_NEW_REGIME_BRACKETS', fiscalYear: 2025,
      configValue: {
        fiscalYear: 2025, standardDeduction: 75000,
        slabs: [
          { min: 0, max: 400000, rate: 0 }, { min: 400000, max: 800000, rate: 5 },
          { min: 800000, max: 1200000, rate: 10 }, { min: 1200000, max: 1600000, rate: 15 },
          { min: 1600000, max: 2000000, rate: 20 }, { min: 2000000, max: 2400000, rate: 25 },
          { min: 2400000, max: null, rate: 30 },
        ],
        rebate87A: { maxIncome: 1200000, maxRebate: 60000 }, cess: 4,
      },
      effectiveFrom: new Date('2025-04-01'), effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN', configKey: 'IN_OLD_REGIME_BRACKETS', fiscalYear: 2025,
      configValue: {
        fiscalYear: 2025, standardDeduction: 50000,
        slabs: [
          { min: 0, max: 250000, rate: 0 }, { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 }, { min: 1000000, max: null, rate: 30 },
        ],
        rebate87A: { maxIncome: 500000, maxRebate: 12500 }, cess: 4,
      },
      effectiveFrom: new Date('2025-04-01'), effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN', configKey: 'IN_PF_CONFIG', fiscalYear: 2025,
      configValue: { employeeRate: 12, employerEpfRate: 3.67, employerEpsRate: 8.33, ceilingMonthly: 15000 },
      effectiveFrom: new Date('2025-04-01'), effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN', configKey: 'IN_ESI_CONFIG', fiscalYear: 2025,
      configValue: { employeeRate: 0.75, employerRate: 3.25, grossCeilingMonthly: 21000 },
      effectiveFrom: new Date('2025-04-01'), effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN', configKey: 'IN_PROFESSIONAL_TAX', fiscalYear: 2025,
      configValue: {
        Karnataka: [{ minMonthly: 0, maxMonthly: 15000, tax: 0 }, { minMonthly: 15001, maxMonthly: null, tax: 200 }],
        Maharashtra: [{ minMonthly: 0, maxMonthly: 7500, tax: 0 }, { minMonthly: 7501, maxMonthly: 10000, tax: 175 }, { minMonthly: 10001, maxMonthly: null, tax: 200 }],
        'Tamil Nadu': [{ minMonthly: 0, maxMonthly: 21000, tax: 0 }, { minMonthly: 21001, maxMonthly: 30000, tax: 135 }, { minMonthly: 30001, maxMonthly: 45000, tax: 315 }, { minMonthly: 45001, maxMonthly: 60000, tax: 690 }, { minMonthly: 60001, maxMonthly: 75000, tax: 1025 }, { minMonthly: 75001, maxMonthly: null, tax: 1250 }],
        Telangana: [{ minMonthly: 0, maxMonthly: 15000, tax: 0 }, { minMonthly: 15001, maxMonthly: 20000, tax: 150 }, { minMonthly: 20001, maxMonthly: null, tax: 200 }],
        'Andhra Pradesh': [{ minMonthly: 0, maxMonthly: 15000, tax: 0 }, { minMonthly: 15001, maxMonthly: 20000, tax: 150 }, { minMonthly: 20001, maxMonthly: null, tax: 200 }],
        Gujarat: [{ minMonthly: 0, maxMonthly: 5999, tax: 0 }, { minMonthly: 6000, maxMonthly: 8999, tax: 80 }, { minMonthly: 9000, maxMonthly: 11999, tax: 150 }, { minMonthly: 12000, maxMonthly: null, tax: 200 }],
        'West Bengal': [{ minMonthly: 0, maxMonthly: 10000, tax: 0 }, { minMonthly: 10001, maxMonthly: 15000, tax: 110 }, { minMonthly: 15001, maxMonthly: 25000, tax: 130 }, { minMonthly: 25001, maxMonthly: 40000, tax: 150 }, { minMonthly: 40001, maxMonthly: null, tax: 200 }],
      },
      effectiveFrom: new Date('2025-04-01'), effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'US', configKey: 'US_FICA_CONFIG', fiscalYear: 2025,
      configValue: {
        socialSecurity: { employeeRate: 6.2, employerRate: 6.2, wageCap: 176100 },
        medicare: { employeeRate: 1.45, employerRate: 1.45, additionalMedicareRate: 0.9, additionalMedicareThreshold: 200000 },
      },
      effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2026-12-31'),
    },
    {
      country: 'US', configKey: 'US_FEDERAL_TAX', fiscalYear: 2025,
      configValue: {
        standardDeduction: { SINGLE: 15750, MARRIED_FILING_JOINTLY: 31500, MARRIED_FILING_SEPARATELY: 15750, HEAD_OF_HOUSEHOLD: 23625 },
        brackets: {
          SINGLE: [
            { min: 0, max: 11925, rate: 10 }, { min: 11925, max: 48475, rate: 12 },
            { min: 48475, max: 103350, rate: 22 }, { min: 103350, max: 197300, rate: 24 },
            { min: 197300, max: 250525, rate: 32 }, { min: 250525, max: 626350, rate: 35 },
            { min: 626350, max: null, rate: 37 },
          ],
          MARRIED_FILING_JOINTLY: [
            { min: 0, max: 23850, rate: 10 }, { min: 23850, max: 96950, rate: 12 },
            { min: 96950, max: 206700, rate: 22 }, { min: 206700, max: 394600, rate: 24 },
            { min: 394600, max: 501050, rate: 32 }, { min: 501050, max: 751600, rate: 35 },
            { min: 751600, max: null, rate: 37 },
          ],
          MARRIED_FILING_SEPARATELY: [
            { min: 0, max: 11925, rate: 10 }, { min: 11925, max: 48475, rate: 12 },
            { min: 48475, max: 103350, rate: 22 }, { min: 103350, max: 197300, rate: 24 },
            { min: 197300, max: 250525, rate: 32 }, { min: 250525, max: 375800, rate: 35 },
            { min: 375800, max: null, rate: 37 },
          ],
          HEAD_OF_HOUSEHOLD: [
            { min: 0, max: 17000, rate: 10 }, { min: 17000, max: 64850, rate: 12 },
            { min: 64850, max: 103350, rate: 22 }, { min: 103350, max: 197300, rate: 24 },
            { min: 197300, max: 250500, rate: 32 }, { min: 250500, max: 626350, rate: 35 },
            { min: 626350, max: null, rate: 37 },
          ],
        },
      },
      effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2026-12-31'),
    },
    {
      country: 'US', configKey: 'US_STATE_TAX', fiscalYear: 2025,
      configValue: {
        // No state income tax (9 states)
        TX: { type: 'none' }, FL: { type: 'none' }, WA: { type: 'none' }, NV: { type: 'none' },
        WY: { type: 'none' }, AK: { type: 'none' }, TN: { type: 'none' }, SD: { type: 'none' },
        NH: { type: 'none' },
        // Flat rate states (11 states)
        IL: { type: 'flat', rate: 4.95 }, IN: { type: 'flat', rate: 3.05 },
        MI: { type: 'flat', rate: 4.25 }, PA: { type: 'flat', rate: 3.07 },
        CO: { type: 'flat', rate: 4.4 }, NC: { type: 'flat', rate: 4.5 },
        UT: { type: 'flat', rate: 4.65 }, MA: { type: 'flat', rate: 5.0 },
        AZ: { type: 'flat', rate: 2.5 }, KY: { type: 'flat', rate: 4.0 },
        GA: { type: 'flat', rate: 5.39 },
        // Bracket states (5 states)
        CA: { type: 'bracket', brackets: [
          { min: 0, max: 10412, rate: 1 }, { min: 10412, max: 24684, rate: 2 },
          { min: 24684, max: 38959, rate: 4 }, { min: 38959, max: 54081, rate: 6 },
          { min: 54081, max: 68350, rate: 8 }, { min: 68350, max: 349137, rate: 9.3 },
          { min: 349137, max: 418961, rate: 10.3 }, { min: 418961, max: 698271, rate: 11.3 },
          { min: 698271, max: null, rate: 12.3 },
        ]},
        NY: { type: 'bracket', brackets: [
          { min: 0, max: 8500, rate: 4 }, { min: 8500, max: 11700, rate: 4.5 },
          { min: 11700, max: 13900, rate: 5.25 }, { min: 13900, max: 80650, rate: 5.5 },
          { min: 80650, max: 215400, rate: 6 }, { min: 215400, max: 1077550, rate: 6.85 },
          { min: 1077550, max: 5000000, rate: 9.65 }, { min: 5000000, max: 25000000, rate: 10.3 },
          { min: 25000000, max: null, rate: 10.9 },
        ]},
        NJ: { type: 'bracket', brackets: [
          { min: 0, max: 20000, rate: 1.4 }, { min: 20000, max: 35000, rate: 1.75 },
          { min: 35000, max: 40000, rate: 3.5 }, { min: 40000, max: 75000, rate: 5.525 },
          { min: 75000, max: 500000, rate: 6.37 }, { min: 500000, max: 1000000, rate: 8.97 },
          { min: 1000000, max: null, rate: 10.75 },
        ]},
        OH: { type: 'bracket', brackets: [
          { min: 0, max: 26050, rate: 0 }, { min: 26050, max: 100000, rate: 2.75 },
          { min: 100000, max: null, rate: 3.5 },
        ]},
        MN: { type: 'bracket', brackets: [
          { min: 0, max: 31690, rate: 5.35 }, { min: 31690, max: 104090, rate: 6.8 },
          { min: 104090, max: 183340, rate: 7.85 }, { min: 183340, max: null, rate: 9.85 },
        ]},
        OR: { type: 'bracket', brackets: [
          { min: 0, max: 4050, rate: 4.75 }, { min: 4050, max: 10200, rate: 6.75 },
          { min: 10200, max: 125000, rate: 8.75 }, { min: 125000, max: null, rate: 9.9 },
        ]},
      },
      effectiveFrom: new Date('2025-01-01'), effectiveTo: new Date('2026-12-31'),
    },
  ];

  for (const config of taxConfigs) {
    await prisma.taxConfiguration.upsert({
      where: {
        country_configKey_fiscalYear: {
          country: config.country,
          configKey: config.configKey,
          fiscalYear: config.fiscalYear,
        },
      },
      update: { configValue: config.configValue as any, effectiveFrom: config.effectiveFrom, effectiveTo: config.effectiveTo, isActive: true },
      create: { ...config, configValue: config.configValue as any, isActive: true },
    });
  }
  console.log(`✅ Seeded ${taxConfigs.length} tax configurations\n`);

  // ──────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────
  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log('   - 1 System company (for super admin)');
  console.log('   - 1 Super admin user (superadmin@hrplatform.com)');
  console.log(`   - ${plans.length} Billing plans (Starter, Basic, Professional, Enterprise)`);
  console.log(`   - ${addons.length} Feature add-ons (all Enterprise-only features purchasable a la carte)`);
  console.log(`   - ${taxConfigs.length} Tax configurations (India FY 2025-26: 7 states PT + US 2025-26: 25 states)`);
  console.log('\n💡 Real companies, employees, and users are created via the registration flow.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
