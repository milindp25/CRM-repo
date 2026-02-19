'use client';

/**
 * Calendar Widget Component
 * Mini calendar with leave/attendance indicators for the dashboard
 */

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasLeave: boolean;
  leaveType?: string;
  isPresent: boolean;
  isAbsent: boolean;
  isWeekend: boolean;
}

interface LeaveEvent {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
}

interface CalendarWidgetProps {
  compact?: boolean;
}

export function CalendarWidget({ compact = false }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaves, setLeaves] = useState<LeaveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchMonthData();
  }, [year, month]);

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const [leavesRes] = await Promise.allSettled([
        apiClient.getLeave({ startDate, endDate }),
      ]);

      if (leavesRes.status === 'fulfilled') {
        setLeaves(leavesRes.value.data || []);
      }
    } catch {
      // Silently handle errors in widget
    } finally {
      setLoading(false);
    }
  };

  const days = useMemo(() => {
    const result: CalendarDay[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the day of week for the first day (0=Sun)
    const startDow = firstDay.getDay();

    // Fill in previous month days
    for (let i = startDow - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      result.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasLeave: false,
        isPresent: false,
        isAbsent: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // Fill in current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      // Check if any leave covers this date
      const leaveForDay = leaves.find((leave) => {
        if (leave.status !== 'APPROVED' && leave.status !== 'PENDING') return false;
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return date >= start && date <= end;
      });

      result.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        hasLeave: !!leaveForDay,
        leaveType: leaveForDay?.leaveType,
        isPresent: false,
        isAbsent: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    // Fill remaining cells to make full weeks
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      result.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        hasLeave: false,
        isPresent: false,
        isAbsent: false,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }

    return result;
  }, [year, month, leaves]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const leaveTypeColors: Record<string, string> = {
    CASUAL: 'bg-blue-400 dark:bg-blue-500',
    SICK: 'bg-red-400 dark:bg-red-500',
    EARNED: 'bg-green-400 dark:bg-green-500',
    PRIVILEGE: 'bg-purple-400 dark:bg-purple-500',
    MATERNITY: 'bg-pink-400 dark:bg-pink-500',
    PATERNITY: 'bg-indigo-400 dark:bg-indigo-500',
    COMPENSATORY: 'bg-orange-400 dark:bg-orange-500',
    LOSS_OF_PAY: 'bg-gray-400 dark:bg-gray-500',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="text-xs px-2 py-1 text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-muted rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, i) => (
            <div
              key={i}
              className={`relative text-center py-1.5 text-xs transition-colors ${
                !day.isCurrentMonth
                  ? 'text-muted-foreground/40'
                  : day.isWeekend
                  ? 'text-muted-foreground'
                  : 'text-foreground'
              } ${day.isToday ? 'font-bold' : ''}`}
            >
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                  day.isToday
                    ? 'bg-primary text-primary-foreground'
                    : ''
                }`}
              >
                {day.date.getDate()}
              </span>
              {day.hasLeave && day.isCurrentMonth && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    leaveTypeColors[day.leaveType || ''] || 'bg-blue-400'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Casual
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Sick
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Earned
          </div>
        </div>
      )}
    </div>
  );
}
