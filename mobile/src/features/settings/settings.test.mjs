import test from 'node:test';
import assert from 'node:assert/strict';
import { useSettingsStore } from './settingsStore.ts';
import { useTransactionStore } from '../transactions/transactionStore.ts';

test('settingsStore manages user name updates correctly', async () => {
  const store = useSettingsStore.getState();
  assert.equal(typeof store.name, 'string');

  const success = await store.updateName('Chandrasekar');
  assert.equal(success, true);
  assert.equal(useSettingsStore.getState().name, 'Chandrasekar');

  // Ignored for empty strings
  const emptyRes = await store.updateName('   ');
  assert.equal(emptyRes, false);
  assert.equal(useSettingsStore.getState().name, 'Chandrasekar');
});

test('settingsStore toggles card style preference and manages theme mode', () => {
  const store = useSettingsStore.getState();
  store.setHomeCardStyle('black');
  assert.equal(useSettingsStore.getState().homeCardStyle, 'black');

  store.setHomeCardStyle('white');
  assert.equal(useSettingsStore.getState().homeCardStyle, 'white');

  store.setThemeMode('light');
  assert.equal(useSettingsStore.getState().themeMode, 'light');
  assert.equal(useSettingsStore.getState().homeCardStyle, 'black');

  store.setThemeMode('dark');
  assert.equal(useSettingsStore.getState().themeMode, 'dark');
  assert.equal(useSettingsStore.getState().homeCardStyle, 'white');
});

test('settingsStore supports adding, updating, and deleting accounts', async () => {
  const store = useSettingsStore.getState();
  const initialCount = store.accounts.length;

  // Add account
  await store.addAccount({
    name: 'Emergency Fund',
    type: 'BANK',
    opening_balance_paise: 2500000, // ₹25,000.00
  });

  const updatedAccounts = useSettingsStore.getState().accounts;
  assert.equal(updatedAccounts.length, initialCount + 1);
  const added = updatedAccounts.find((a) => a.name === 'Emergency Fund');
  assert.ok(added);
  assert.equal(added.opening_balance_paise, 2500000);

  // Update account
  await store.updateAccount(added.id, {
    name: 'Emergency Savings High Yield',
    opening_balance_paise: 3000000,
  });

  const edited = useSettingsStore.getState().accounts.find((a) => a.id === added.id);
  assert.equal(edited?.name, 'Emergency Savings High Yield');
  assert.equal(edited?.opening_balance_paise, 3000000);

  // Delete account
  await store.deleteAccount(added.id);
  const remaining = useSettingsStore.getState().accounts.find((a) => a.id === added.id);
  assert.equal(remaining, undefined);
});

test('settingsStore adds custom categories correctly', async () => {
  const store = useSettingsStore.getState();
  await store.addCustomCategory('Gym & Fitness', 'dumbbell', 'EXPENSE');

  const categories = useSettingsStore.getState().customCategories;
  const added = categories.find((c) => c.name === 'Gym & Fitness');
  assert.ok(added);
  assert.equal(added.kind, 'EXPENSE');
});

test('settingsStore exports comprehensive JSON ledger backup', () => {
  const store = useSettingsStore.getState();
  const raw = store.exportDataJson();
  assert.equal(typeof raw, 'string');

  const parsed = JSON.parse(raw);
  assert.ok(parsed.exported_at);
  assert.ok(parsed.user);
  assert.ok(parsed.settings);
  assert.ok(Array.isArray(parsed.accounts));
  assert.ok(Array.isArray(parsed.custom_categories));
  assert.ok(Array.isArray(parsed.transactions));
});

test('transactionStore adds, updates, and deletes transactions with integer paise math', async () => {
  const txStore = useTransactionStore.getState();
  const initialCount = txStore.transactions.length;

  // 1. Add transaction
  const created = await txStore.addTransaction({
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amountPaise: 45000, // ₹450.00
    counterpartyName: 'Books & Stationery',
    categoryName: 'Education',
  });

  assert.equal(created.amount_paise, 45000);
  assert.equal(created.counterparty_name, 'Books & Stationery');
  assert.equal(useTransactionStore.getState().transactions.length, initialCount + 1);

  // 2. Update transaction
  await txStore.updateTransaction(created.id, {
    counterparty_name: 'Kindle E-Books',
    amount_paise: 39900, // ₹399.00
  });

  const updated = useTransactionStore.getState().transactions.find((t) => t.id === created.id);
  assert.equal(updated?.counterparty_name, 'Kindle E-Books');
  assert.equal(updated?.amount_paise, 39900);

  // 3. Delete transaction
  await txStore.deleteTransaction(created.id);
  assert.equal(useTransactionStore.getState().transactions.length, initialCount);
});

