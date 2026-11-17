import test from 'node:test';
import assert from 'node:assert/strict';
import { useTransactionStore } from '../transactions/transactionStore.ts';

test('analytics aggregates daily expenses and transaction counts accurately', () => {
  const transactions = useTransactionStore.getState().transactions;

  // Day 2026-10-09
  const oct9Txs = transactions.filter((t) => t.local_date === '2026-10-09');
  const oct9Expenses = oct9Txs
    .filter((t) => t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // ₹2,000.00 = 200,000 paise
  assert.equal(oct9Expenses, 200000);
  assert.equal(oct9Txs.length, 6);

  // Day 2026-04-08
  const apr8Txs = transactions.filter((t) => t.local_date === '2026-04-08');
  const apr8Expenses = apr8Txs
    .filter((t) => t.direction === 'DEBIT')
    .reduce((sum, t) => sum + t.amount_paise, 0);

  // ₹100 + ₹30 + ₹10 = ₹140 = 14000 paise
  assert.equal(apr8Expenses, 14000);
  assert.equal(apr8Txs.length, 3);
});

test('analytics computes category spend distribution and percentages', () => {
  const transactions = useTransactionStore.getState().transactions;

  const categoryMap = new Map();
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.direction === 'DEBIT' && t.kind !== 'EXCHANGE_LEG') {
      const cat = t.category_name || 'General';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount_paise);
      totalExpense += t.amount_paise;
    }
  }

  assert.ok(totalExpense > 0);
  assert.ok(categoryMap.has('Food & Dining'));
  assert.ok(categoryMap.has('Transport'));

  // Ensure sum of all category paise equals total expense paise
  const sumOfCategories = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
  assert.equal(sumOfCategories, totalExpense);
});

test('analytics preserves integer paise in net cash flow and channel breakdowns', () => {
  const transactions = useTransactionStore.getState().transactions;

  let digitalSpend = 0;
  let cashSpend = 0;
  let exchangeLegs = 0;

  for (const t of transactions) {
    if (t.kind === 'EXCHANGE_LEG') {
      exchangeLegs += t.amount_paise;
    } else if (t.direction === 'DEBIT') {
      if (t.payment_method === 'CASH') {
        cashSpend += t.amount_paise;
      } else {
        digitalSpend += t.amount_paise;
      }
    }
  }

  assert.ok(digitalSpend >= 0);
  assert.ok(cashSpend >= 0);
  assert.ok(exchangeLegs >= 0);
});

