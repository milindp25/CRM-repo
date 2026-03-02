/**
 * Consistent date formatting across the application.
 *
 * Returns dates like "01 Mar 2026" or "01 Mar 2026, 10:30 AM".
 */
export function formatDate(
  date: string | Date,
  opts?: { time?: boolean },
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  };

  if (opts?.time) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return d.toLocaleDateString('en-IN', options);
}
