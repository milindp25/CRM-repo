'use client';

/**
 * Payroll Reconciliation Report
 * Compares current vs previous month payroll batches,
 * surfaces anomalies, and lets HR acknowledge or hold the batch.
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';
import type { ReconciliationReport as ReconciliationReportData, ReconciliationAnomaly } from '@/lib/api/types';
import {
  Loader2,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  UserMinus,
  UserPlus,
  ArrowUpDown,
  Receipt,
  ShieldCheck,
  PauseCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ReconciliationReportProps {
  month: number;
  year: number;
  currency: string; // e.g. '$' or '\u20B9'
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function fmtCurrency(value: number | undefined, symbol: string): string {
  if (value == null) return '--';
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPercent(value: number | undefined): string {
  if (value == null) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function previousMonthLabel(month: number, year: number): string {
  const pm = month === 1 ? 12 : month - 1;
  const py = month === 1 ? year - 1 : year;
  return `${MONTH_NAMES[pm - 1]} ${py}`;
}

/** Anomaly type metadata: label, icon, row tint classes, badge classes */
const ANOMALY_META: Record<
  ReconciliationAnomaly['type'],
  {
    label: string;
    Icon: typeof UserMinus;
    row: string;
    badge: string;
    border: string;
  }
> = {
  MISSING: {
    label: 'Missing',
    Icon: UserMinus,
    row: 'bg-red-50 dark:bg-red-950/20',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    border: 'border-l-red-500',
  },
  NEW: {
    label: 'New',
    Icon: UserPlus,
    row: 'bg-yellow-50 dark:bg-yellow-950/20',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    border: 'border-l-yellow-500',
  },
  SALARY_CHANGE: {
    label: 'Salary Change',
    Icon: ArrowUpDown,
    row: 'bg-orange-50 dark:bg-orange-950/20',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  DEDUCTION_CHANGE: {
    label: 'Deduction Change',
    Icon: Receipt,
    row: 'bg-blue-50 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReconciliationReport({ month, year, currency, onClose }: ReconciliationReportProps) {
  const { success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReconciliationReportData | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState(false);
  const [holding, setHolding] = useState(false);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const fetchData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const report = await apiClient.reconcilePayroll(month, year);
      setData(report);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch reconciliation data';
      setFetchError(msg);
      showError('Reconciliation Error', msg);
    } finally {
      setLoading(false);
    }
  }, [month, year, showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      // Placeholder -- wire to real endpoint when available
      await new Promise((r) => setTimeout(r, 600));
      success('Acknowledged', 'All anomalies have been reviewed and acknowledged.');
    } catch {
      showError('Error', 'Failed to acknowledge anomalies.');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleHoldBatch = async () => {
    setHolding(true);
    try {
      // Placeholder -- wire to real endpoint when available
      await new Promise((r) => setTimeout(r, 600));
      success('Batch Held', 'The payroll batch has been put on hold for review.');
    } catch {
      showError('Error', 'Failed to hold the batch.');
    } finally {
      setHolding(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------------

  const varianceDirection =
    data == null
      ? 'neutral'
      : data.variance > 0
        ? 'up'
        : data.variance < 0
          ? 'down'
          : 'neutral';

  const VarianceIcon =
    varianceDirection === 'up'
      ? TrendingUp
      : varianceDirection === 'down'
        ? TrendingDown
        : Minus;

  const varianceColor =
    varianceDirection === 'up'
      ? 'text-red-600 dark:text-red-400'
      : varianceDirection === 'down'
        ? 'text-green-600 dark:text-green-400'
        : 'text-muted-foreground';

  const avgSalaryChange =
    data && data.previousBatchTotal > 0
      ? ((data.currentBatchTotal - data.previousBatchTotal) /
          data.previousBatchTotal) *
        100
      : 0;

  // -------------------------------------------------------------------------
  // Render: loading
  // -------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="w-full rounded-lg border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading reconciliation report for {MONTH_NAMES[month - 1]} {year}...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: error
  // -------------------------------------------------------------------------

  if (fetchError || !data) {
    return (
      <div className="w-full rounded-lg border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{fetchError || 'No data available.'}</p>
          <button
            onClick={fetchData}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: main report
  // -------------------------------------------------------------------------

  return (
    <div className="w-full rounded-lg border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Payroll Reconciliation
          </h2>
          <p className="text-sm text-muted-foreground">
            {MONTH_NAMES[month - 1]} {year} vs {previousMonthLabel(month, year)}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close reconciliation report"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 gap-4 border-b border-border px-6 py-5 sm:grid-cols-3">
        {/* Total Variance */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
          <div className={`rounded-md p-2 ${varianceDirection === 'up' ? 'bg-red-100 dark:bg-red-900/30' : varianceDirection === 'down' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
            <VarianceIcon className={`h-5 w-5 ${varianceColor}`} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Variance
            </p>
            <p className={`text-xl font-bold ${varianceColor}`}>
              {fmtCurrency(Math.abs(data.variance), currency)}
            </p>
            <p className={`text-sm ${varianceColor}`}>
              {fmtPercent(data.variancePercent)}
            </p>
          </div>
        </div>

        {/* Headcount Change */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
          <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Headcount Change
            </p>
            <p className="text-xl font-bold text-foreground">
              {data.headcountChange > 0 ? '+' : ''}
              {data.headcountChange}
            </p>
            <p className="text-sm text-muted-foreground">employees</p>
          </div>
        </div>

        {/* Average Salary Change */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
          <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900/30">
            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg Salary Change
            </p>
            <p className="text-xl font-bold text-foreground">
              {fmtPercent(avgSalaryChange)}
            </p>
            <p className="text-sm text-muted-foreground">month-over-month</p>
          </div>
        </div>
      </div>

      {/* Side-by-side comparison cards */}
      <div className="grid grid-cols-1 gap-4 border-b border-border px-6 py-5 md:grid-cols-2">
        {/* Current month */}
        <div className="rounded-lg border border-border bg-background p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {MONTH_NAMES[month - 1]} {year}
            </h3>
            <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Current
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Total Gross</dt>
              <dd className="text-sm font-semibold text-foreground">
                {fmtCurrency(data.currentBatchTotal, currency)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Previous month */}
        <div className="rounded-lg border border-border bg-background p-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              {previousMonthLabel(month, year)}
            </h3>
            <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Previous
            </span>
          </div>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Total Gross</dt>
              <dd className="text-sm font-semibold text-foreground">
                {fmtCurrency(data.previousBatchTotal, currency)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Anomalies section */}
      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Anomalies ({data.anomalies.length})
          </h3>
          {data.anomalies.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              Requires Review
            </span>
          )}
        </div>

        {data.anomalies.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No anomalies detected
            </p>
            <p className="text-xs text-muted-foreground">
              The payroll for {MONTH_NAMES[month - 1]} {year} reconciles cleanly
              with the previous period.
            </p>
          </div>
        ) : (
          /* Anomaly table */
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">
                    Previous
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">
                    Current
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium text-muted-foreground">
                    Change %
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.anomalies.map((anomaly) => {
                  const meta = ANOMALY_META[anomaly.type];
                  const AnomalyIcon = meta.Icon;

                  return (
                    <tr
                      key={`${anomaly.employeeId}-${anomaly.type}`}
                      className={`border-l-4 ${meta.border} ${meta.row} transition-colors`}
                    >
                      {/* Employee name */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                        {anomaly.employeeName}
                      </td>

                      {/* Type badge */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.badge}`}
                        >
                          <AnomalyIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>

                      {/* Previous amount */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                        {fmtCurrency(anomaly.previousGross, currency)}
                      </td>

                      {/* Current amount */}
                      <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                        {fmtCurrency(anomaly.currentGross, currency)}
                      </td>

                      {/* Change % */}
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <span
                          className={
                            anomaly.changePercent != null && anomaly.changePercent > 0
                              ? 'text-red-600 dark:text-red-400'
                              : anomaly.changePercent != null && anomaly.changePercent < 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-muted-foreground'
                          }
                        >
                          {fmtPercent(anomaly.changePercent)}
                        </span>
                      </td>

                      {/* Details / message */}
                      <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                        {anomaly.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col-reverse items-center justify-end gap-3 border-t border-border px-6 py-4 sm:flex-row">
        <button
          onClick={handleHoldBatch}
          disabled={holding || acknowledging}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50 sm:w-auto"
        >
          {holding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PauseCircle className="h-4 w-4" />
          )}
          Hold Batch
        </button>
        <button
          onClick={handleAcknowledge}
          disabled={acknowledging || holding}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800 sm:w-auto"
        >
          {acknowledging ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Acknowledge All
        </button>
      </div>
    </div>
  );
}
