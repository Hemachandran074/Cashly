import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDaysInMonth,
  getWeekdayOfFirstDay,
  getMonthName,
  formatYearMonth,
} from '../../utils/date.ts';
import { useTransactionStore } from '../transactions/transactionStore.ts';

test('calendar date calculations strictly adhere to Monday-first convention', () => {
  // October 2026
  assert.equal(getDaysInMonth(2026, 9), 31);
  assert.equal(getMonthName(9), 'October');
  // 2026-10-01 is a Thursday -> index 3 in Monday-first (M=0, T=1, W=2, TH=3)
  assert.equal(getWeekdayOfFirstDay(2026, 9), 3);

  // April 2026
  assert.equal(getDaysInMonth(2026, 3), 30);
  assert.equal(getMonthName(3), 'April');
  // 2026-04-01 is Wednesday -> index 2 in Monday-first
  assert.equal(getWeekdayOfFirstDay(2026, 3), 2);
});

test('transaction ledger correctly filters by date, month, and all-time history', () => {
  const transactions = useTransactionStore.getState().transactions;

  // 1. Filter by specific date: 2026-10-09 (matching calendar reference)
  const oct9Items = transactions.filter((t) => t.local_date === '2026-10-09');
  assert.ok(oct9Items.length >= 6);

  const oct9ExpensesPaise = oct9Items
    .filter((t) => t.direction === 'DEBIT')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // ₹2,000.00 = 200,000 paise
  assert.equal(oct9ExpensesPaise, 200000);

  // 2. Filter by month: 2026-10
  const octMonthItems = transactions.filter((t) => t.local_date.startsWith('2026-10'));
  assert.ok(octMonthItems.length >= 6);

  // 3. Earliest transaction history date
  const sortedByDate = [...transactions].sort((a, b) =>
    a.local_date.localeCompare(b.local_date)
  );
  assert.equal(sortedByDate[0].local_date, '2026-04-07');
});

test('calendar day transaction mapping accurately identifies days with expenses', () => {
  const transactions = useTransactionStore.getState().transactions;
  const dateMap = new Map();

  for (const tx of transactions) {
    const list = dateMap.get(tx.local_date) || [];
    list.push(tx);
    dateMap.set(tx.local_date, list);
  }

  // 2026-10-09 has expenses
  const oct9List = dateMap.get('2026-10-09');
  assert.ok(oct9List);
  assert.ok(oct9List.some((t) => t.direction === 'DEBIT'));

  // 2026-04-07 and 2026-04-08 have transactions
  assert.ok(dateMap.get('2026-04-07'));
  assert.ok(dateMap.get('2026-04-08'));

  // Dates with no transactions return undefined
  assert.equal(dateMap.get('2026-01-01'), undefined);
});

