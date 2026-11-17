/**
 * Date and Timezone Utilities for Cashly
 * Rule: Grouping and calendar boundaries must strictly respect the phone's local date/time.
 */

/**
 * Returns YYYY-MM-DD for a given date in local device timezone.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current device timezone offset in minutes.
 * E.g., for IST (UTC+5:30), returns 330.
 */
export function getDeviceTzOffsetMinutes(): number {
  // getTimezoneOffset() returns difference in minutes from UTC to local,
  // so for IST (UTC+5:30) it returns -330. We negate it to match UTC offset standard (+330).
  return -new Date().getTimezoneOffset();
}

/**
 * Formats a local date (YYYY-MM-DD) or ISO string into a human-friendly format.
 * E.g. "02 Nov 2026" or "Nov 02"
 */
export function formatFriendlyDate(
  dateInput: string | Date,
  options?: { includeYear?: boolean }
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  if (options?.includeYear) {
    return `${day} ${month} ${year}`;
  }

  // If same year as current, omit year unless explicitly requested
  const currentYear = new Date().getFullYear();
  if (year !== currentYear) {
    return `${day} ${month} ${year}`;
  }

  return `${day} ${month}`;
}

/**
 * Formats time in 12-hour AM/PM format (e.g. "02:35 PM").
 */
export function formatTime12h(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM

  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Relative date descriptor: "Today", "Yesterday", or formatted date.
 */
export function formatRelativeDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const todayStr = getLocalDateString(new Date());
  const inputStr = getLocalDateString(date);

  if (inputStr === todayStr) {
    return 'Today';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (inputStr === yesterdayStr) {
    return 'Yesterday';
  }

  return formatFriendlyDate(date);
}

/**
 * Given "2026-11", returns "November 2026".
 */
export function formatMonthYearHeader(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${monthNames[monthIndex] || ''} ${yearStr}`;
}

/**
 * Returns the number of days in a given month (monthIndex is 0-indexed: 0 = Jan, 11 = Dec).
 */
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Returns the weekday of the first day of the month where Monday = 0, ..., Sunday = 6.
 * (M, T, W, TH, F, S, SU)
 */
export function getWeekdayOfFirstDay(year: number, monthIndex: number): number {
  const day = new Date(year, monthIndex, 1).getDay();
  // In JS, 0 is Sunday, 1 is Monday.
  // Converting to Monday = 0:
  return (day + 6) % 7;
}

/**
 * Returns full month name (0-indexed: 0 = January, 9 = October).
 */
export function getMonthName(monthIndex: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[monthIndex] || '';
}

/**
 * Formats year and 0-indexed month into "YYYY-MM".
 */
export function formatYearMonth(year: number, monthIndex: number): string {
  return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
}

/**
 * Parses "YYYY-MM" into { year: number, monthIndex: number }.
 */
export function parseYearMonth(yearMonth: string): { year: number; monthIndex: number } {
  const [yearStr, monthStr] = yearMonth.split('-');
  return {
    year: parseInt(yearStr, 10),
    monthIndex: parseInt(monthStr, 10) - 1,
  };
}


