import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTotalOpeningBalance,
  resolveEffectiveStartDate,
  clampStep,
} from './onboardingLogic.ts';
import { getLocalDateString } from '../../utils/date.ts';

test('clampStep strictly confines onboarding steps between 1 and 5', () => {
  assert.equal(clampStep(1, -1), 1);
  assert.equal(clampStep(1, 1), 2);
  assert.equal(clampStep(2, 1), 3);
  assert.equal(clampStep(4, 1), 5);
  assert.equal(clampStep(5, 1), 5);
  assert.equal(clampStep(5, -1), 4);
});

test('calculateTotalOpeningBalance sums integer paise without floating point error', () => {
  const accounts = [
    { id: '1', name: 'HDFC Bank', type: 'BANK', opening_balance_paise: 2500000 }, // ₹25,000.00
    { id: '2', name: 'Cash in Wallet', type: 'CASH', opening_balance_paise: 350050 }, // ₹3,500.50
    { id: '3', name: 'ICICI Bank', type: 'BANK', opening_balance_paise: 1250000 }, // ₹12,500.00
  ];

  const total = calculateTotalOpeningBalance(accounts);
  assert.equal(total, 4100050); // ₹41,000.50 exactly
});

test('calculateTotalOpeningBalance handles zero and empty lists safely', () => {
  assert.equal(calculateTotalOpeningBalance([]), 0);
  assert.equal(
    calculateTotalOpeningBalance([
      { id: '1', name: 'Primary', type: 'BANK', opening_balance_paise: 0 },
    ]),
    0
  );
});

test('resolveEffectiveStartDate resolves TODAY, FIRST_OF_MONTH, and CUSTOM dates accurately', () => {
  const reference = new Date(2026, 10, 2); // 2026-11-02

  // 1. TODAY
  assert.equal(
    resolveEffectiveStartDate('TODAY', undefined, reference),
    '2026-11-02'
  );

  // 2. FIRST_OF_MONTH
  assert.equal(
    resolveEffectiveStartDate('FIRST_OF_MONTH', undefined, reference),
    '2026-11-01'
  );

  // 3. CUSTOM
  assert.equal(
    resolveEffectiveStartDate('CUSTOM', '2026-08-15', reference),
    '2026-08-15'
  );
});
