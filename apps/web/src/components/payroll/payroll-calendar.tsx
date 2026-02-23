'use client';

/**
 * Payroll Calendar Component
 * Mini calendar with pay date indicators, compliance deadlines, and batch status
 * for embedding in dashboard or payroll run tabs.
 */

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PayrollCalendarProps {
  companyCountry: string; // 'IN' or 'US'
  payFrequency: string; // 'MONTHLY' | 'SEMI_MONTHLY' | 'BI_WEEKLY' | 'WEEKLY'
  batches: Array<{ month: number; year: number; status: string }>;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dots: DotType[];
}

type DotType = 'pay' | 'pending' | 'overdue' | 'completed';

interface Deadline {
  date: Date;
  label: string;
  type: 'tax' | 'compliance' | 'filing';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a date is a weekday (Mon-Fri). */
function isWeekday(d: Date): boolean {
  const dow = d.getDay();
  return dow !== 0 && dow !== 6;
}

/** Return the last working day (Mon-Fri) of a given month/year. */
function lastWorkingDay(year: number, month: number): Date {
  const last = new Date(year, month + 1, 0); // last calendar day
  while (!isWeekday(last)) {
    last.setDate(last.getDate() - 1);
  }
  return last;
}

/** Return the nearest working day to a target date (shifts earlier if weekend). */
function nearestWorkingDay(year: number, month: number, day: number): Date {
  const d = new Date(year, month, day);
  while (!isWeekday(d)) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

/** Simple date-only equality check (ignores time). */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Format a date as "Mon DD". */
function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Compute days between two dates (date-only, ignoring time). */
function daysBetween(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((utcB - utcA) / msPerDay);
}

// ---------------------------------------------------------------------------
// Pay date computation
// ---------------------------------------------------------------------------

function getPayDatesForMonth(
  year: number,
  month: number,
  payFrequency: string,
): Date[] {
  const dates: Date[] = [];

  switch (payFrequency) {
    case 'MONTHLY': {
      dates.push(lastWorkingDay(year, month));
      break;
    }
    case 'SEMI_MONTHLY': {
      // 15th (or nearest working day) + last working day
      dates.push(nearestWorkingDay(year, month, 15));
      dates.push(lastWorkingDay(year, month));
      break;
    }
    case 'BI_WEEKLY': {
      // Every other Friday in the month.
      // Use a reference anchor: Jan 2, 2026 is a Friday. Bi-weekly from there.
      const anchor = new Date(2026, 0, 2); // Friday
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);

      // Find first Friday >= firstOfMonth
      const cursor = new Date(firstOfMonth);
      const dow = cursor.getDay();
      const daysToFri = (5 - dow + 7) % 7;
      cursor.setDate(cursor.getDate() + daysToFri);

      while (cursor <= lastOfMonth) {
        // Check if this Friday falls on a bi-weekly cadence from anchor
        const diffDays = daysBetween(anchor, cursor);
        if (diffDays >= 0 && diffDays % 14 === 0) {
          dates.push(new Date(cursor));
        }
        cursor.setDate(cursor.getDate() + 7);
      }

      // If no bi-weekly Friday lands in the month, include every-other Friday
      if (dates.length === 0) {
        const fallback = new Date(firstOfMonth);
        const dow2 = fallback.getDay();
        const toFri = (5 - dow2 + 7) % 7;
        fallback.setDate(fallback.getDate() + toFri);
        while (fallback <= lastOfMonth) {
          dates.push(new Date(fallback));
          fallback.setDate(fallback.getDate() + 14);
        }
      }
      break;
    }
    case 'WEEKLY': {
      // Every Friday in the month
      const firstOfMonth = new Date(year, month, 1);
      const lastOfMonth = new Date(year, month + 1, 0);
      const cursor = new Date(firstOfMonth);
      const dow = cursor.getDay();
      const daysToFri = (5 - dow + 7) % 7;
      cursor.setDate(cursor.getDate() + daysToFri);
      while (cursor <= lastOfMonth) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 7);
      }
      break;
    }
    default:
      break;
  }

  return dates;
}

// ---------------------------------------------------------------------------
// Compliance deadlines
// ---------------------------------------------------------------------------

function getComplianceDeadlines(
  year: number,
  month: number,
  country: string,
): Deadline[] {
  const deadlines: Deadline[] = [];

  if (country === 'IN') {
    // TDS remittance: 7th of next month (shown in current month view when applicable)
    const tds7 = new Date(year, month + 1, 7);
    if (tds7.getMonth() === month + 1 || (month === 11 && tds7.getMonth() === 0)) {
      // Show the upcoming TDS deadline at the bottom
    }
    // Within this month:
    // If this month contains the 7th, mark TDS remittance for previous month's salary
    deadlines.push({
      date: nearestWorkingDay(year, month, 7),
      label: 'TDS Remittance Due',
      type: 'tax',
    });
    // PF remittance: 15th
    deadlines.push({
      date: nearestWorkingDay(year, month, 15),
      label: 'PF Remittance Due',
      type: 'compliance',
    });
    // ESI remittance: 15th
    deadlines.push({
      date: nearestWorkingDay(year, month, 15),
      label: 'ESI Remittance Due',
      type: 'compliance',
    });
    // Quarterly TDS return (Form 24Q): months 6 (Jul 31), 9 (Oct 31), 12 (Jan 31), 3 (May 31)
    // Q1 Apr-Jun: due Jul 31, Q2 Jul-Sep: due Oct 31, Q3 Oct-Dec: due Jan 31, Q4 Jan-Mar: due May 31
    const quarterEndMonths: Record<number, { dueMonth: number; dueDay: number; label: string }> = {
      6: { dueMonth: 6, dueDay: 31, label: 'Form 24Q (Q1) Due' },    // July
      9: { dueMonth: 9, dueDay: 31, label: 'Form 24Q (Q2) Due' },    // October
      0: { dueMonth: 0, dueDay: 31, label: 'Form 24Q (Q3) Due' },    // January
      4: { dueMonth: 4, dueDay: 31, label: 'Form 24Q (Q4) Due' },    // May
    };
    const qEntry = quarterEndMonths[month];
    if (qEntry) {
      deadlines.push({
        date: new Date(year, qEntry.dueMonth, qEntry.dueDay),
        label: qEntry.label,
        type: 'filing',
      });
    }
  } else if (country === 'US') {
    // Federal/state tax deposit: typically within 3 business days after payroll
    // We approximate as the 15th of each month
    deadlines.push({
      date: nearestWorkingDay(year, month, 15),
      label: 'Federal Tax Deposit',
      type: 'tax',
    });
    // Quarterly Form 941: Apr 30, Jul 31, Oct 31, Jan 31
    const form941: Record<number, { dueMonth: number; dueDay: number; label: string }> = {
      3: { dueMonth: 3, dueDay: 30, label: 'Form 941 (Q1) Due' },
      6: { dueMonth: 6, dueDay: 31, label: 'Form 941 (Q2) Due' },
      9: { dueMonth: 9, dueDay: 31, label: 'Form 941 (Q3) Due' },
      0: { dueMonth: 0, dueDay: 31, label: 'Form 941 (Q4) Due' },
    };
    const f941 = form941[month];
    if (f941) {
      deadlines.push({
        date: new Date(year, f941.dueMonth, f941.dueDay),
        label: f941.label,
        type: 'filing',
      });
    }
    // Annual W-2/W-3: Jan 31
    if (month === 0) {
      deadlines.push({
        date: new Date(year, 0, 31),
        label: 'W-2/W-3 Filing Deadline',
        type: 'filing',
      });
    }
  }

  // Filter deadlines to only those that fall within this month
  return deadlines.filter(
    (dl) => dl.date.getFullYear() === year && dl.date.getMonth() === month,
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PayrollCalendar({
  companyCountry,
  payFrequency,
  batches,
}: PayrollCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = useCallback(
    () => setCurrentDate(new Date(year, month - 1, 1)),
    [year, month],
  );
  const nextMonth = useCallback(
    () => setCurrentDate(new Date(year, month + 1, 1)),
    [year, month],
  );
  const goToToday = useCallback(() => setCurrentDate(new Date()), []);

  const monthLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // ---- Derived data -------------------------------------------------------

  const payDates = useMemo(
    () => getPayDatesForMonth(year, month, payFrequency),
    [year, month, payFrequency],
  );

  const deadlines = useMemo(
    () => getComplianceDeadlines(year, month, companyCountry),
    [year, month, companyCountry],
  );

  const batchForMonth = useMemo(
    () =>
      batches.find((b) => b.month === month + 1 && b.year === year) ?? null,
    [batches, month, year],
  );

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Find next upcoming pay date (from today forward, across visible + future months)
  const nextPayDate = useMemo(() => {
    // Check current month first
    const upcoming = payDates.filter((d) => d >= today);
    if (upcoming.length > 0) return upcoming[0];
    // Check next month
    const nextMonthDates = getPayDatesForMonth(
      month === 11 ? year + 1 : year,
      month === 11 ? 0 : month + 1,
      payFrequency,
    );
    const upcomingNext = nextMonthDates.filter((d) => d >= today);
    return upcomingNext.length > 0 ? upcomingNext[0] : null;
  }, [payDates, today, year, month, payFrequency]);

  const daysUntilPay = useMemo(() => {
    if (!nextPayDate) return null;
    return daysBetween(today, nextPayDate);
  }, [nextPayDate, today]);

  // ---- Calendar grid build ------------------------------------------------

  const calendarDays = useMemo(() => {
    const result: CalendarDay[] = [];
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startDow = firstOfMonth.getDay(); // 0=Sun

    // Helper: compute dots for a given date
    const dotsFor = (date: Date, inMonth: boolean): DotType[] => {
      if (!inMonth) return [];
      const dots: DotType[] = [];

      // Pay date?
      if (payDates.some((pd) => sameDay(pd, date))) {
        dots.push('pay');
      }

      // Batch status?
      if (batchForMonth) {
        const status = batchForMonth.status;
        if (status === 'PENDING' || status === 'PROCESSING') {
          // Mark pay dates as pending
          if (payDates.some((pd) => sameDay(pd, date))) {
            dots.push('pending');
          }
        } else if (status === 'COMPLETED' || status === 'PAID') {
          if (payDates.some((pd) => sameDay(pd, date))) {
            dots.push('completed');
          }
        }
      }

      // Overdue compliance deadline?
      const isOverdue = deadlines.some(
        (dl) => sameDay(dl.date, date) && date < today,
      );
      if (isOverdue) {
        dots.push('overdue');
      }

      return dots;
    };

    // Previous month fill
    for (let i = startDow - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      result.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dots: [],
      });
    }

    // Current month
    for (let day = 1; day <= lastOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      result.push({
        date,
        isCurrentMonth: true,
        isToday: sameDay(date, today),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dots: dotsFor(date, true),
      });
    }

    // Next month fill to complete 6 rows
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      result.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        dots: [],
      });
    }

    return result;
  }, [year, month, payDates, deadlines, batchForMonth, today]);

  // ---- Status helpers -----------------------------------------------------

  const batchStatusLabel = useMemo(() => {
    if (!batchForMonth) return 'Not Started';
    switch (batchForMonth.status) {
      case 'PENDING':
      case 'PROCESSING':
        return 'In Progress';
      case 'COMPLETED':
      case 'PAID':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Not Started';
    }
  }, [batchForMonth]);

  const batchStatusColor = useMemo(() => {
    if (!batchForMonth) return 'text-muted-foreground';
    switch (batchForMonth.status) {
      case 'PENDING':
      case 'PROCESSING':
        return 'text-amber-600 dark:text-amber-400';
      case 'COMPLETED':
      case 'PAID':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'FAILED':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  }, [batchForMonth]);

  // ---- Dot color mapping --------------------------------------------------

  const dotColor: Record<DotType, string> = {
    pay: 'bg-emerald-500 dark:bg-emerald-400',
    pending: 'bg-amber-500 dark:bg-amber-400',
    overdue: 'bg-red-500 dark:bg-red-400',
    completed: 'bg-blue-500 dark:bg-blue-400',
  };

  // ---- Deadline type icon -------------------------------------------------

  function deadlineIcon(type: Deadline['type']) {
    switch (type) {
      case 'tax':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />;
      case 'compliance':
        return <Clock className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />;
      case 'filing':
        return <Calendar className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400 flex-shrink-0" />;
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {/* Quick Stats Banner */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">
            Status:
          </span>
          <span className={`text-xs font-semibold ${batchStatusColor}`}>
            {batchStatusLabel}
          </span>
        </div>
        {daysUntilPay !== null && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-xs text-muted-foreground">
              {daysUntilPay === 0
                ? 'Pay day today'
                : daysUntilPay === 1
                  ? '1 day to pay date'
                  : `${daysUntilPay} days to pay date`}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Calendar Section */}
        <div className="flex-1 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs px-2 py-1 text-primary hover:bg-primary/10 rounded transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-0 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
              <div
                key={`${label}-${i}`}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0">
            {calendarDays.map((day, i) => (
              <div
                key={i}
                className={`relative flex flex-col items-center py-1 text-xs transition-colors ${
                  !day.isCurrentMonth
                    ? 'text-muted-foreground/30'
                    : day.isWeekend
                      ? 'text-muted-foreground'
                      : 'text-foreground'
                } ${day.isToday ? 'font-bold' : ''}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                    day.isToday ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  {day.date.getDate()}
                </span>

                {/* Dots row */}
                {day.dots.length > 0 && (
                  <span className="flex items-center gap-0.5 mt-0.5">
                    {day.dots.map((dot, j) => (
                      <span
                        key={j}
                        className={`h-1.5 w-1.5 rounded-full ${dotColor[dot]}`}
                      />
                    ))}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              Pay Date
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
              Pending
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
              Overdue
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
              Completed
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines Sidebar */}
        <div className="border-t lg:border-t-0 lg:border-l border-border lg:w-56 p-4">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
            Deadlines
          </h4>

          {deadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No deadlines this month.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {deadlines.map((dl, i) => {
                const isPast = dl.date < today;
                return (
                  <li key={i} className="flex items-start gap-2">
                    {deadlineIcon(dl.type)}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium leading-tight ${
                          isPast
                            ? 'text-red-600 dark:text-red-400 line-through'
                            : 'text-foreground'
                        }`}
                      >
                        {dl.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatShortDate(dl.date)}
                        {isPast && ' (overdue)'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Country indicator */}
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-[11px] text-muted-foreground">
              {companyCountry === 'IN' ? 'India' : 'United States'} compliance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
