import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFinancialSms } from './smsParser.ts';

test('parseFinancialSms parses HDFC UPI debit SMS accurately', () => {
  const sms =
    'HDFC Bank: Rs 1,500.00 debited from A/c **4321 on 03-11-26 to VPA swiggy@icici (UPI Ref 631245678901). Avl Bal: Rs 42,350.50.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.direction, 'DEBIT');
  assert.equal(result.amountPaise, 150000);
  assert.equal(result.amountRupees, 1500);
  assert.equal(result.localDate, '2026-11-03');
  assert.equal(result.counterpartyName, 'Swiggy');
  assert.equal(result.categoryName, 'Food & Dining');
  assert.equal(result.accountRef, 'A/c **4321');
  assert.equal(result.balancePaise, 4235050);
});

test('parseFinancialSms parses SBI credit SMS with salary and time accurately', () => {
  const sms =
    'Dear SBI User, your A/c ending 5678 is credited by INR 25,000.00 on 01Nov26 at 11:30 AM by UPI/CR/630987/Salary. Avl Bal: INR 65,400.00.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.direction, 'CREDIT');
  assert.equal(result.amountPaise, 2500000);
  assert.equal(result.amountRupees, 25000);
  assert.equal(result.localDate, '2026-11-01');
  assert.equal(result.timeStr, '11:30 AM');
  assert.equal(result.categoryName, 'Salary');
  assert.equal(result.accountRef, 'A/c 5678');
  assert.equal(result.balancePaise, 6540000);
});

test('parseFinancialSms parses ICICI debit with Kumaraguru Mess and PM time', () => {
  const sms =
    'Acct XX123 debited with INR 85.50 on 03-Nov-26 at 04:45 PM. Info: UPI*Kumaraguru Mess*5678. Avl Bal: INR 12,400.00.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.direction, 'DEBIT');
  assert.equal(result.amountPaise, 8550);
  assert.equal(result.amountRupees, 85.5);
  assert.equal(result.localDate, '2026-11-03');
  assert.equal(result.timeStr, '04:45 PM');
  assert.equal(result.counterpartyName, 'Kumaraguru Mess');
  assert.equal(result.categoryName, 'Food & Dining');
});

test('parseFinancialSms categorizes petrol expense under Transport', () => {
  const sms =
    'INR 500.00 spent on Axis Bank Card ending 9876 on 02-11-26 at BHARAT PETROLEUM. Avail limit: INR 45000.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.direction, 'DEBIT');
  assert.equal(result.amountPaise, 50000);
  assert.equal(result.categoryName, 'Transport');
  assert.equal(result.counterpartyName, 'Bharat Petroleum');
});

test('parseFinancialSms ignores login OTP message as security code', () => {
  const sms =
    'Your OTP for login to Cashly is 918234. It is valid for 5 mins. Do not share this OTP with anyone.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SECURITY_OTP_IGNORED');
  assert.ok(result.ignoreReason);
  assert.equal(result.amountPaise, undefined);
});

test('parseFinancialSms ignores transaction approval OTP despite containing amount', () => {
  const sms =
    '482910 is your secret OTP for transaction of INR 1,299.00 at Flipkart on HDFC Bank Card ending 1234. Valid for 10 minutes. Never share OTP with anyone.';

  const result = parseFinancialSms(sms);

  // Crucial invariant: Authorization challenge is NOT a completed transaction
  assert.equal(result.status, 'SECURITY_OTP_IGNORED');
  assert.ok(result.ignoreReason);
  assert.equal(result.amountPaise, undefined);
});

test('parseFinancialSms ignores telecom data quota alerts as non-financial', () => {
  const sms =
    'Your daily 1.5 GB high-speed data quota is 100% exhausted. Recharge now to continue browsing at high speeds.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'NON_FINANCIAL_IGNORED');
  assert.ok(result.ignoreReason);
});

test('parseFinancialSms ignores promotional discounts as non-financial', () => {
  const sms =
    'Flat 50% OFF on all gourmet pizzas today! Use code PIZZA50 on Swiggy. Valid till midnight.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'NON_FINANCIAL_IGNORED');
});

test('parseFinancialSms ignores casual chat messages without financial verbs', () => {
  const sms =
    'Hey Chandru, shall we meet tomorrow at 4 PM for the project review?';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'NON_FINANCIAL_IGNORED');
});

test('parseFinancialSms distinguishes transaction amount from balance', () => {
  const sms =
    'A/c *1234 debited by Rs 100 on 08-Apr-2026. Bal: Rs 45000.';

  const result = parseFinancialSms(sms);

  assert.equal(result.status, 'SUCCESS');
  assert.equal(result.amountPaise, 10000); // ₹100, not ₹45,000
  assert.equal(result.balancePaise, 4500000);
});

