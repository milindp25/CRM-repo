'use client';

import { useMemo } from 'react';
import type { SalaryComponent } from '@/lib/api/types';
import { Calculator, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface TaxComputationPreviewProps {
  components: SalaryComponent[];
  annualCTC: number;
  country: string; // 'IN' or 'US'
  currency: string; // '₹' or '$'
  pfEnabled?: boolean;
  esiEnabled?: boolean;
}

interface ComputedLine {
  name: string;
  monthly: number;
  annual: number;
  type: 'earning' | 'deduction' | 'employer' | 'net';
}

export function TaxComputationPreview({
  components,
  annualCTC,
  country,
  currency,
  pfEnabled = false,
  esiEnabled = false,
}: TaxComputationPreviewProps) {
  const computation = useMemo(() => {
    if (!annualCTC || annualCTC <= 0 || components.length === 0) return null;

    const monthlyGross = annualCTC / 12;
    const lines: ComputedLine[] = [];
    let totalEarnings = 0;
    let basic = 0;

    // Calculate earnings from components
    for (const comp of components) {
      if (comp.type !== 'EARNING') continue;
      let amount = 0;
      if (comp.calculationType === 'FIXED') {
        amount = comp.value;
      } else if (comp.calculationType === 'PERCENTAGE_OF_BASIC') {
        // Basic should be first component typically
        amount = (basic * comp.value) / 100;
      } else if (comp.calculationType === 'PERCENTAGE_OF_GROSS') {
        amount = (monthlyGross * comp.value) / 100;
      }

      if (comp.name.toLowerCase().includes('basic')) {
        basic = amount;
      }

      lines.push({
        name: comp.name,
        monthly: amount,
        annual: amount * 12,
        type: 'earning',
      });
      totalEarnings += amount;
    }

    // Calculate deductions from components
    for (const comp of components) {
      if (comp.type !== 'DEDUCTION') continue;
      let amount = 0;
      if (comp.calculationType === 'FIXED') {
        amount = comp.value;
      } else if (comp.calculationType === 'PERCENTAGE_OF_BASIC') {
        amount = (basic * comp.value) / 100;
      } else if (comp.calculationType === 'PERCENTAGE_OF_GROSS') {
        amount = (totalEarnings * comp.value) / 100;
      }
      lines.push({
        name: comp.name,
        monthly: amount,
        annual: amount * 12,
        type: 'deduction',
      });
    }

    // Estimate statutory deductions
    const deductions: ComputedLine[] = [];
    const employerContribs: ComputedLine[] = [];

    if (country === 'IN') {
      if (pfEnabled && basic > 0) {
        const pfBase = Math.min(basic, 15000);
        const pfEmployee = pfBase * 0.12;
        const pfEmployer = pfBase * 0.12;
        deductions.push({ name: 'PF (Employee 12%)', monthly: pfEmployee, annual: pfEmployee * 12, type: 'deduction' });
        employerContribs.push({ name: 'PF (Employer 12%)', monthly: pfEmployer, annual: pfEmployer * 12, type: 'employer' });
      }
      if (esiEnabled && totalEarnings <= 21000) {
        const esiEmp = totalEarnings * 0.0075;
        const esiEmpr = totalEarnings * 0.0325;
        deductions.push({ name: 'ESI (Employee 0.75%)', monthly: esiEmp, annual: esiEmp * 12, type: 'deduction' });
        employerContribs.push({ name: 'ESI (Employer 3.25%)', monthly: esiEmpr, annual: esiEmpr * 12, type: 'employer' });
      }
      // Estimated TDS (simplified - new regime)
      const annualIncome = totalEarnings * 12;
      const taxable = Math.max(0, annualIncome - 75000); // Standard deduction
      let tax = 0;
      if (taxable > 2400000) tax = (taxable - 2400000) * 0.30 + 195000;
      else if (taxable > 2000000) tax = (taxable - 2000000) * 0.25 + 95000;
      else if (taxable > 1600000) tax = (taxable - 1600000) * 0.20 + 15000;
      else if (taxable > 1200000) tax = (taxable - 1200000) * 0.15 + 45000;
      else if (taxable > 800000) tax = (taxable - 800000) * 0.10 + 15000;
      else if (taxable > 400000) tax = (taxable - 400000) * 0.05;
      // 87A rebate
      if (taxable <= 1200000) tax = 0;
      tax = tax * 1.04; // 4% cess
      const monthlyTds = tax / 12;
      if (monthlyTds > 0) {
        deductions.push({ name: 'TDS (Est. New Regime)', monthly: monthlyTds, annual: tax, type: 'deduction' });
      }
    } else {
      // US deductions estimate
      const annualIncome = totalEarnings * 12;
      // Social Security
      const ssEmp = totalEarnings * 0.062;
      const ssEmpr = totalEarnings * 0.062;
      deductions.push({ name: 'Social Security (6.2%)', monthly: ssEmp, annual: Math.min(ssEmp * 12, 176100 * 0.062), type: 'deduction' });
      employerContribs.push({ name: 'SS Employer (6.2%)', monthly: ssEmpr, annual: Math.min(ssEmpr * 12, 176100 * 0.062), type: 'employer' });

      // Medicare
      const medEmp = totalEarnings * 0.0145;
      const medEmpr = totalEarnings * 0.0145;
      deductions.push({ name: 'Medicare (1.45%)', monthly: medEmp, annual: medEmp * 12, type: 'deduction' });
      employerContribs.push({ name: 'Medicare Employer (1.45%)', monthly: medEmpr, annual: medEmpr * 12, type: 'employer' });

      // Federal tax estimate (single filer simplified)
      const stdDeduction = 15750;
      const taxable = Math.max(0, annualIncome - stdDeduction);
      let fedTax = 0;
      if (taxable > 626350) fedTax = (taxable - 626350) * 0.37 + 188769.75;
      else if (taxable > 250525) fedTax = (taxable - 250525) * 0.35 + 57301.75;
      else if (taxable > 197300) fedTax = (taxable - 197300) * 0.32 + 40268.75;
      else if (taxable > 103350) fedTax = (taxable - 103350) * 0.24 + 17819.25;
      else if (taxable > 48475) fedTax = (taxable - 48475) * 0.22 + 5734.50;
      else if (taxable > 11925) fedTax = (taxable - 11925) * 0.12 + 1192.50;
      else fedTax = taxable * 0.10;
      const monthlyFed = fedTax / 12;
      if (monthlyFed > 0) {
        deductions.push({ name: 'Federal Tax (Est.)', monthly: monthlyFed, annual: fedTax, type: 'deduction' });
      }
    }

    const totalDeductions = deductions.reduce((s, d) => s + d.monthly, 0);
    const componentDeductions = lines.filter(l => l.type === 'deduction').reduce((s, l) => s + l.monthly, 0);
    const netPay = totalEarnings - totalDeductions - componentDeductions;

    return {
      earnings: lines.filter(l => l.type === 'earning'),
      componentDeductions: lines.filter(l => l.type === 'deduction'),
      statutoryDeductions: deductions,
      employerContribs,
      totalEarnings,
      totalDeductions: totalDeductions + componentDeductions,
      netPay,
    };
  }, [components, annualCTC, country, pfEnabled, esiEnabled, currency]);

  const fmt = (v: number) => {
    const formatted = country === 'IN'
      ? v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return `${currency}${formatted}`;
  };

  if (!computation) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <Calculator className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add salary components and enter annual CTC to see a tax computation preview.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          Monthly Tax Computation Preview
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Estimated based on {country === 'IN' ? 'New Tax Regime FY 2025-26' : 'US Federal 2025 (Single filer)'}
        </p>
      </div>

      <div className="divide-y divide-border">
        {/* Earnings */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Earnings</span>
          </div>
          <div className="space-y-1">
            {computation.earnings.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="font-medium text-foreground">{fmt(line.monthly)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-semibold pt-1 border-t border-border/50">
              <span className="text-foreground">Gross Salary</span>
              <span className="text-emerald-600 dark:text-emerald-400">{fmt(computation.totalEarnings)}</span>
            </div>
          </div>
        </div>

        {/* Component Deductions */}
        {computation.componentDeductions.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Minus className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Deductions (Structure)</span>
            </div>
            <div className="space-y-1">
              {computation.componentDeductions.map((line, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{line.name}</span>
                  <span className="font-medium text-foreground">-{fmt(line.monthly)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statutory Deductions */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">Statutory Deductions</span>
          </div>
          <div className="space-y-1">
            {computation.statutoryDeductions.map((line, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{line.name}</span>
                <span className="font-medium text-foreground">-{fmt(line.monthly)}</span>
              </div>
            ))}
            {computation.statutoryDeductions.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No statutory deductions applicable</p>
            )}
          </div>
        </div>

        {/* Employer Contributions */}
        {computation.employerContribs.length > 0 && (
          <div className="px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Employer Contributions (Not deducted from pay)</span>
            </div>
            <div className="space-y-1">
              {computation.employerContribs.map((line, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{line.name}</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{fmt(line.monthly)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Net Pay */}
        <div className="px-4 py-4 bg-primary/5">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-foreground">Net Pay (Est.)</span>
            <span className="text-lg font-bold text-primary">{fmt(computation.netPay)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Annual: {fmt(computation.netPay * 12)}</span>
            <span>Total Deductions: {fmt(computation.totalDeductions)}/month</span>
          </div>
        </div>
      </div>
    </div>
  );
}
