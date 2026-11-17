import test from 'node:test';
import assert from 'node:assert/strict';
import { useTransactionStore } from './transactionStore.ts';

test('notification stack initializes with seed notifications', () => {
  const store = useTransactionStore.getState();
  assert.ok(Array.isArray(store.pendingNotifications));
  assert.ok(store.pendingNotifications.length >= 3);

  const swiggyNotif = store.pendingNotifications.find((n) =>
    n.counterpartyName.toLowerCase().includes('swiggy')
  );
  assert.ok(swiggyNotif);
  assert.equal(swiggyNotif.amountPaise, 48000);
  assert.equal(swiggyNotif.direction, 'DEBIT');
});

test('confirmPendingNotification converts notification to ledger transaction with chosen category', async () => {
  const store = useTransactionStore.getState();
  const targetNotif = store.pendingNotifications[0];
  const initialNotifCount = store.pendingNotifications.length;
  const initialTxCount = store.transactions.length;

  const confirmedTx = await store.confirmPendingNotification(
    targetNotif.id,
    'Dining Out',
    'acc-1'
  );

  assert.ok(confirmedTx);
  assert.equal(confirmedTx.category_name, 'Dining Out');
  assert.equal(confirmedTx.amount_paise, targetNotif.amountPaise);
  assert.equal(confirmedTx.direction, targetNotif.direction);

  const updatedStore = useTransactionStore.getState();
  assert.equal(updatedStore.pendingNotifications.length, initialNotifCount - 1);
  assert.equal(updatedStore.transactions.length, initialTxCount + 1);
  assert.ok(updatedStore.transactions.some((t) => t.id === confirmedTx.id));
  assert.ok(!updatedStore.pendingNotifications.some((n) => n.id === targetNotif.id));
});

test('dismissPendingNotification removes notification without modifying ledger', () => {
  const store = useTransactionStore.getState();
  assert.ok(store.pendingNotifications.length > 0);
  const target = store.pendingNotifications[0];
  const initialNotifCount = store.pendingNotifications.length;
  const initialTxCount = store.transactions.length;

  store.dismissPendingNotification(target.id);

  const updatedStore = useTransactionStore.getState();
  assert.equal(updatedStore.pendingNotifications.length, initialNotifCount - 1);
  assert.equal(updatedStore.transactions.length, initialTxCount);
  assert.ok(!updatedStore.pendingNotifications.some((n) => n.id === target.id));
});

test('addPendingNotification pushes new alerts to top of notification stack', () => {
  const store = useTransactionStore.getState();
  const initialCount = store.pendingNotifications.length;

  store.addPendingNotification({
    sender: 'HDFC-BANK',
    rawText: 'Rs 999.00 debited for Netflix Subscription on 12-Apr-2026.',
    amountPaise: 99900,
    direction: 'DEBIT',
    counterpartyName: 'Netflix India',
    suggestedCategory: 'Entertainment',
    paymentMethod: 'UPI',
  });

  const updated = useTransactionStore.getState().pendingNotifications;
  assert.equal(updated.length, initialCount + 1);
  assert.equal(updated[0].counterpartyName, 'Netflix India');
  assert.equal(updated[0].amountPaise, 99900);
  assert.ok(updated[0].id.startsWith('notif-'));
});
