import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getLocalDateString,
  formatFriendlyDate,
  formatTime12h,
  formatRelativeDate,
  formatMonthYearHeader,
  getDaysInMonth,
  getWeekdayOfFirstDay,
  getMonthName,
  formatYearMonth,
  parseYearMonth,
} from './date.ts';

test('getLocalDateString returns YYYY-MM-DD format', () => {
  const d = new Date(2026, 10, 2); // Note: month index 10 is November
  assert.equal(getLocalDateString(d), '2026-11-02');

  const d2 = new Date(2026, 0, 9); // Jan 9
  assert.equal(getLocalDateString(d2), '2026-01-09');
});

test('formatFriendlyDate formats date strings correctly', () => {
  const dateStr = '2026-11-02T12:00:00Z';
  const formatted = formatFriendlyDate(dateStr, { includeYear: true });
  assert.match(formatted, /02 Nov 2026/);
});

test('formatTime12h produces correct AM/PM time representation', () => {
  const dMorning = new Date(2026, 10, 2, 9, 5);
  assert.equal(formatTime12h(dMorning), '09:05 AM');

  const dAfternoon = new Date(2026, 10, 2, 14, 30);
  assert.equal(formatTime12h(dAfternoon), '02:30 PM');

  const dMidnight = new Date(2026, 10, 2, 0, 15);
  assert.equal(formatTime12h(dMidnight), '12:15 AM');

  const dNoon = new Date(2026, 10, 2, 12, 0);
  assert.equal(formatTime12h(dNoon), '12:00 PM');
});

test('formatRelativeDate returns Today for current date', () => {
  const now = new Date();
  assert.equal(formatRelativeDate(now), 'Today');

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  assert.equal(formatRelativeDate(yesterday), 'Yesterday');
});

test('formatMonthYearHeader returns readable month and year', () => {
  assert.equal(formatMonthYearHeader('2026-11'), 'November 2026');
  assert.equal(formatMonthYearHeader('2025-01'), 'January 2025');
});

test('calendar helpers compute days, weekdays, and formats accurately', () => {
  // Days in month
  assert.equal(getDaysInMonth(2026, 9), 31); // October (month 9) has 31 days
  assert.equal(getDaysInMonth(2026, 10), 30); // November (month 10) has 30 days
  assert.equal(getDaysInMonth(2024, 1), 29); // Feb 2024 (leap year) has 29 days
  assert.equal(getDaysInMonth(2025, 1), 28); // Feb 2025 has 28 days

  // Weekday with Monday = 0
  // 2026-10-01 is Thursday -> index 3
  assert.equal(getWeekdayOfFirstDay(2026, 9), 3);
  // 2026-11-01 is Sunday -> index 6
  assert.equal(getWeekdayOfFirstDay(2026, 10), 6);
  // 2026-06-01 is Monday -> index 0
  assert.equal(getWeekdayOfFirstDay(2026, 5), 0);

  // Month names
  assert.equal(getMonthName(9), 'October');
  assert.equal(getMonthName(3), 'April');
  assert.equal(getMonthName(10), 'November');

  // Format and parse YearMonth
  assert.equal(formatYearMonth(2026, 9), '2026-10');
  const parsed = parseYearMonth('2026-10');
  assert.equal(parsed.year, 2026);
  assert.equal(parsed.monthIndex, 9);
});


