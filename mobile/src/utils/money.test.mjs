import test from 'node:test';
import assert from 'node:assert/strict';
import {
  paiseToRupees,
  rupeesToPaise,
  parseRupeesInput,
  formatIndianGrouping,
  formatIndianRupees,
  formatSignedPaise,
} from './money.ts';

test('paiseToRupees converts integer paise to decimal rupees', () => {
  assert.equal(paiseToRupees(0), 0);
  assert.equal(paiseToRupees(100), 1);
  assert.equal(paiseToRupees(12550), 125.5);
  assert.equal(paiseToRupees(99999), 999.99);
  assert.equal(paiseToRupees(1), 0.01);
});

test('rupeesToPaise converts decimal/integer rupees safely to integer paise', () => {
  assert.equal(rupeesToPaise(0), 0);
  assert.equal(rupeesToPaise(1), 100);
  assert.equal(rupeesToPaise(125.5), 12550);
  assert.equal(rupeesToPaise(999.99), 99999);
  // Tests floating point edge cases
  assert.equal(rupeesToPaise(19.99), 1999);
  assert.equal(rupeesToPaise(14.2), 1420);
});

test('parseRupeesInput handles formatted and raw inputs', () => {
  assert.equal(parseRupeesInput('500'), 50000);
  assert.equal(parseRupeesInput('1,250.50'), 125050);
  assert.equal(parseRupeesInput('₹ 4,500'), 450000);
  assert.equal(parseRupeesInput(''), 0);
  assert.equal(parseRupeesInput('invalid'), 0);
});

test('formatIndianGrouping formats numbers according to Indian grouping conventions', () => {
  assert.equal(formatIndianGrouping('0'), '0');
  assert.equal(formatIndianGrouping('50'), '50');
  assert.equal(formatIndianGrouping('500'), '500');
  assert.equal(formatIndianGrouping('1000'), '1,000');
  assert.equal(formatIndianGrouping('12345'), '12,345');
  assert.equal(formatIndianGrouping('123456'), '1,23,456');
  assert.equal(formatIndianGrouping('1234567'), '12,34,567');
  assert.equal(formatIndianGrouping('10000000'), '1,00,00,000'); // 1 crore
});

test('formatIndianRupees handles formatting options', () => {
  // Default: with symbol and paise
  assert.equal(formatIndianRupees(12345600), '₹1,23,456.00');
  assert.equal(formatIndianRupees(50000), '₹500.00');
  assert.equal(formatIndianRupees(0), '₹0.00');

  // Without paise
  assert.equal(formatIndianRupees(12345600, { showPaise: false }), '₹1,23,456');
  assert.equal(formatIndianRupees(0, { showPaise: false }), '₹0');

  // Negative amounts
  assert.equal(formatIndianRupees(-50000), '-₹500.00');
  assert.equal(formatIndianRupees(-12345600, { showPaise: false }), '-₹1,23,456');

  // Without symbol
  assert.equal(formatIndianRupees(125050, { showSymbol: false }), '1,250.50');
});

test('formatSignedPaise applies + and - signs correctly', () => {
  assert.equal(formatSignedPaise(50000, 'CREDIT'), '+₹500.00');
  assert.equal(formatSignedPaise(50000, 'DEBIT'), '-₹500.00');
  assert.equal(formatSignedPaise(125000, 'CREDIT', { showPaise: false }), '+₹1,250');
  assert.equal(formatSignedPaise(125000, 'DEBIT', { showPaise: false }), '-₹1,250');
});

