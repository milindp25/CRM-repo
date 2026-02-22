'use client';

import { useState } from 'react';
import type { SalaryComponent } from '@/lib/api/types';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface SalaryStructureFormProps {
  components: SalaryComponent[];
  onChange: (components: SalaryComponent[]) => void;
  country: string; // 'IN' or 'US'
  currency: string; // '₹' or '$'
  disabled?: boolean;
}

const EMPTY_COMPONENT: SalaryComponent = {
  name: '',
  type: 'EARNING',
  calculationType: 'FIXED',
  value: 0,
  isTaxable: true,
};

const INDIA_PRESETS: SalaryComponent[] = [
  { name: 'Basic Salary', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 50, isTaxable: true },
  { name: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', value: 40, isTaxable: true },
  { name: 'Special Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 10, isTaxable: true },
];

const US_PRESETS: SalaryComponent[] = [
  { name: 'Base Salary', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 85, isTaxable: true },
  { name: 'Health Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 10, isTaxable: false },
  { name: 'Transport Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 5, isTaxable: true },
];

export function SalaryStructureForm({
  components,
  onChange,
  country,
  currency,
  disabled = false,
}: SalaryStructureFormProps) {
  const [showPresets, setShowPresets] = useState(false);

  const addComponent = () => {
    onChange([...components, { ...EMPTY_COMPONENT }]);
  };

  const removeComponent = (index: number) => {
    onChange(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: keyof SalaryComponent, value: any) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const loadPreset = () => {
    onChange(country === 'IN' ? [...INDIA_PRESETS] : [...US_PRESETS]);
    setShowPresets(false);
  };

  // Validate India 50% basic rule
  const basicComponent = components.find(c => c.name.toLowerCase().includes('basic') && c.type === 'EARNING');
  const totalEarningPercent = components
    .filter(c => c.type === 'EARNING' && c.calculationType === 'PERCENTAGE_OF_GROSS')
    .reduce((sum, c) => sum + c.value, 0);
  const basicPercent = basicComponent?.calculationType === 'PERCENTAGE_OF_GROSS' ? basicComponent.value : 0;
  const showBasicWarning = country === 'IN' && basicPercent > 0 && basicPercent < 50;

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Salary Components</h4>
        <div className="flex gap-2">
          {components.length === 0 && (
            <button
              type="button"
              onClick={loadPreset}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Load {country === 'IN' ? 'India' : 'US'} Template
            </button>
          )}
          <button
            type="button"
            onClick={addComponent}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Component
          </button>
        </div>
      </div>

      {/* India 50% Basic Warning */}
      {showBasicWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              India Labor Code Compliance
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Basic Salary must be at least 50% of CTC as per 2025 Labor Code. Currently set at {basicPercent}%.
            </p>
          </div>
        </div>
      )}

      {/* Component Table */}
      {components.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_110px_150px_90px_60px_40px] gap-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
            <span>Component Name</span>
            <span>Type</span>
            <span>Calculation</span>
            <span>Value</span>
            <span>Taxable</span>
            <span></span>
          </div>

          {/* Component Rows */}
          <div className="divide-y divide-border">
            {components.map((comp, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_110px_150px_90px_60px_40px] gap-2 px-3 py-2 items-center"
              >
                <input
                  type="text"
                  value={comp.name}
                  onChange={(e) => updateComponent(index, 'name', e.target.value)}
                  disabled={disabled}
                  placeholder="e.g., Basic Salary"
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />

                <select
                  value={comp.type}
                  onChange={(e) => updateComponent(index, 'type', e.target.value)}
                  disabled={disabled}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                  <option value="EARNING">Earning</option>
                  <option value="DEDUCTION">Deduction</option>
                </select>

                <select
                  value={comp.calculationType}
                  onChange={(e) => updateComponent(index, 'calculationType', e.target.value)}
                  disabled={disabled}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                  <option value="FIXED">Fixed ({currency})</option>
                  <option value="PERCENTAGE_OF_BASIC">% of Basic</option>
                  <option value="PERCENTAGE_OF_GROSS">% of Gross</option>
                </select>

                <input
                  type="number"
                  value={comp.value}
                  onChange={(e) => updateComponent(index, 'value', parseFloat(e.target.value) || 0)}
                  disabled={disabled}
                  min={0}
                  step={comp.calculationType === 'FIXED' ? 100 : 1}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                />

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={comp.isTaxable}
                    onChange={(e) => updateComponent(index, 'isTaxable', e.target.checked)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeComponent(index)}
                  disabled={disabled}
                  className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                  title="Remove component"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary row */}
          {totalEarningPercent > 0 && (
            <div className="border-t border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Total Earning Allocation (% of Gross):{' '}
              <span className={`font-medium ${totalEarningPercent === 100 ? 'text-emerald-600 dark:text-emerald-400' : totalEarningPercent > 100 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {totalEarningPercent}%
              </span>
              {totalEarningPercent !== 100 && (
                <span className="ml-1">(should be 100%)</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No components added yet. Add components manually or load a template.
          </p>
        </div>
      )}
    </div>
  );
}
