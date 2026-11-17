import { create } from 'zustand';
import type { Transaction } from '../../types/domain.ts';
import { supabase, isSupabaseConfigured } from '../../api/supabase.ts';
import { useAuthStore } from '../auth/authStore.ts';
import { getLocalDateString } from '../../utils/date.ts';

export interface CreateTransactionInput {
  accountId?: string;
  direction: 'CREDIT' | 'DEBIT';
  kind: 'EXPENSE' | 'INCOME' | 'EXCHANGE_LEG';
  amountPaise: number;
  categoryName?: string;
  counterpartyName: string;
  paymentMethod?: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
  note?: string;
  occurredAt?: string;
  source?: 'SMS' | 'MANUAL';
}

export interface PendingFinancialNotification {
  id: string;
  sender: string;
  rawText: string;
  amountPaise: number;
  direction: 'CREDIT' | 'DEBIT';
  counterpartyName: string;
  suggestedCategory: string;
  accountId?: string;
  paymentMethod: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
  referenceId?: string;
  receivedAt: string;
}

export interface TransactionState {
  transactions: Transaction[];
  pendingNotifications: PendingFinancialNotification[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTransactions: () => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    updates: Partial<{
      counterparty_name: string;
      category_name: string;
      amount_paise: number;
      direction: 'CREDIT' | 'DEBIT';
      kind: 'EXPENSE' | 'INCOME' | 'EXCHANGE_LEG';
      payment_method: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'OTHER';
      note: string;
    }>
  ) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  confirmPendingNotification: (
    id: string,
    chosenCategory: string,
    accountId?: string
  ) => Promise<Transaction | null>;
  dismissPendingNotification: (id: string) => void;
  addPendingNotification: (
    notification: Omit<PendingFinancialNotification, 'id' | 'receivedAt'>
  ) => void;
}

// Initial seed transactions matching the exact reference screenshot
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 10000, // ₹100
    occurred_at: '2026-04-07T13:05:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-04-07',
    payment_method: 'UPI',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Kumaraguru Mess',
    source: 'MANUAL',
    status: 'CONFIRMED',
    created_at: '2026-04-07T13:05:00Z',
    updated_at: '2026-04-07T13:05:00Z',
  },
  {
    id: 'tx-2',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 10000, // ₹100
    occurred_at: '2026-04-08T16:45:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-04-08',
    payment_method: 'UPI',
    category_id: 'cat-transport',
    category_name: 'Transport',
    counterparty_name: 'Petrol',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-04-08T16:45:00Z',
    updated_at: '2026-04-08T16:45:00Z',
  },
  {
    id: 'tx-3',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 3000, // ₹30
    occurred_at: '2026-04-08T17:30:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-04-08',
    payment_method: 'UPI',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Snacks',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-04-08T17:30:00Z',
    updated_at: '2026-04-08T17:30:00Z',
  },
  {
    id: 'tx-4',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 1000, // ₹10
    occurred_at: '2026-04-08T18:00:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-04-08',
    payment_method: 'CASH',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Tea',
    source: 'MANUAL',
    status: 'CONFIRMED',
    created_at: '2026-04-08T18:00:00Z',
    updated_at: '2026-04-08T18:00:00Z',
  },
  // Reference items for October 2026 (matching Calendar design mockup with Total Expense ₹2,000)
  {
    id: 'tx-oct-1',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 50000, // ₹500
    occurred_at: '2026-10-09T13:05:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'UPI',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Kumaraguru Mess',
    source: 'MANUAL',
    status: 'CONFIRMED',
    created_at: '2026-10-09T13:05:00Z',
    updated_at: '2026-10-09T13:05:00Z',
  },
  {
    id: 'tx-oct-2',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 50000, // ₹500
    occurred_at: '2026-10-09T16:45:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'UPI',
    category_id: 'cat-transport',
    category_name: 'Transport',
    counterparty_name: 'Petrol',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-10-09T16:45:00Z',
    updated_at: '2026-10-09T16:45:00Z',
  },
  {
    id: 'tx-oct-3',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 20000, // ₹200
    occurred_at: '2026-10-09T17:30:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'UPI',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Snacks',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-10-09T17:30:00Z',
    updated_at: '2026-10-09T17:30:00Z',
  },
  {
    id: 'tx-oct-4',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 10000, // ₹100
    occurred_at: '2026-10-09T18:00:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'CASH',
    category_id: 'cat-food',
    category_name: 'Food & Dining',
    counterparty_name: 'Tea',
    source: 'MANUAL',
    status: 'CONFIRMED',
    created_at: '2026-10-09T18:00:00Z',
    updated_at: '2026-10-09T18:00:00Z',
  },
  {
    id: 'tx-oct-5',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 40000, // ₹400
    occurred_at: '2026-10-09T18:45:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'UPI',
    category_id: 'cat-shopping',
    category_name: 'Shopping',
    counterparty_name: 'Department Store',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-10-09T18:45:00Z',
    updated_at: '2026-10-09T18:45:00Z',
  },
  {
    id: 'tx-oct-6',
    user_id: 'user-1',
    account_id: 'acc-1',
    direction: 'DEBIT',
    kind: 'EXPENSE',
    amount_paise: 30000, // ₹300
    occurred_at: '2026-10-09T19:30:00Z',
    tz_offset_minutes: 330,
    local_date: '2026-10-09',
    payment_method: 'UPI',
    category_id: 'cat-groceries',
    category_name: 'Groceries',
    counterparty_name: 'Fresh Supermarket',
    source: 'SMS',
    status: 'CONFIRMED',
    created_at: '2026-10-09T19:30:00Z',
    updated_at: '2026-10-09T19:30:00Z',
  },
];

export const INITIAL_PENDING_NOTIFICATIONS: PendingFinancialNotification[] = [
  {
    id: 'notif-seed-1',
    sender: 'HDFC-BANK',
    rawText: 'Rs 480.00 debited from A/C XX4092 on 10-Apr-2026 via UPI to Swiggy. UPI Ref: 610293847291.',
    amountPaise: 48000,
    direction: 'DEBIT',
    counterpartyName: 'Swiggy',
    suggestedCategory: 'Food & Dining',
    accountId: 'acc-1',
    paymentMethod: 'UPI',
    referenceId: 'UPI-610293847291',
    receivedAt: '2026-04-10T14:20:00Z',
  },
  {
    id: 'notif-seed-2',
    sender: 'SBI-UPI',
    rawText: 'Dear UPI user A/C 9812 debited by Rs 1,500.00 on 10-Apr-2026 transfer to Bharat Petroleum ref no 610293817492.',
    amountPaise: 150000,
    direction: 'DEBIT',
    counterpartyName: 'Bharat Petroleum',
    suggestedCategory: 'Transport',
    accountId: 'acc-1',
    paymentMethod: 'UPI',
    referenceId: 'UPI-610293817492',
    receivedAt: '2026-04-10T11:15:00Z',
  },
  {
    id: 'notif-seed-3',
    sender: 'ICICI-BANK',
    rawText: 'Account XX1902 credited with INR 25,000.00 on 09-Apr-2026 towards Freelance Payout. Info: NEFT-N10029384.',
    amountPaise: 2500000,
    direction: 'CREDIT',
    counterpartyName: 'Freelance Payout',
    suggestedCategory: 'Salary',
    accountId: 'acc-1',
    paymentMethod: 'BANK_TRANSFER',
    referenceId: 'NEFT-N10029384',
    receivedAt: '2026-04-09T18:00:00Z',
  },
];

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: INITIAL_TRANSACTIONS,
  pendingNotifications: INITIAL_PENDING_NOTIFICATIONS,
  isLoading: false,
  error: null,

  loadTransactions: async () => {
    const user = useAuthStore.getState().user;
    if (!isSupabaseConfigured || !user?.id) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      if (data && data.length > 0) {
        set({ transactions: data as Transaction[], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err?.message, isLoading: false });
    }
  },

  addTransaction: async (input: CreateTransactionInput) => {
    const user = useAuthStore.getState().user;
    const nowIso = input.occurredAt || new Date().toISOString();
    const localDate = getLocalDateString(new Date(nowIso));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: user?.id || 'user-1',
      account_id: input.accountId || 'acc-1',
      direction: input.direction,
      kind: input.kind,
      amount_paise: Math.round(input.amountPaise),
      occurred_at: nowIso,
      tz_offset_minutes: 330,
      local_date: localDate,
      payment_method: input.paymentMethod || 'UPI',
      category_name: input.categoryName || 'General',
      counterparty_name: input.counterpartyName.trim(),
      note: input.note || null,
      source: 'MANUAL',
      status: 'CONFIRMED',
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Prepend new transaction to state immediately
    set((state) => ({
      transactions: [newTx, ...state.transactions],
    }));

    if (isSupabaseConfigured && user?.id) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            user_id: user.id,
            account_id: newTx.account_id,
            direction: newTx.direction,
            kind: newTx.kind,
            amount_paise: newTx.amount_paise,
            occurred_at: newTx.occurred_at,
            tz_offset_minutes: newTx.tz_offset_minutes,
            local_date: newTx.local_date,
            payment_method: newTx.payment_method,
            category_name: newTx.category_name,
            counterparty_name: newTx.counterparty_name,
            note: newTx.note,
            source: 'MANUAL',
            status: 'CONFIRMED',
          })
          .select()
          .single();

        if (data) {
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === newTx.id ? (data as Transaction) : t
            ),
          }));
          return data as Transaction;
        }
      } catch (err) {
        console.warn('Supabase addTransaction error:', err);
      }
    }

    return newTx;
  },

  updateTransaction: async (id: string, updates) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              ...updates,
              updated_at: new Date().toISOString(),
            }
          : tx
      ),
    }));

    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase
          .from('transactions')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateTransaction error:', err);
      }
    }
    return true;
  },

  deleteTransaction: async (id: string) => {
    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.id !== id),
    }));

    const user = useAuthStore.getState().user;
    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteTransaction error:', err);
      }
    }
    return true;
  },

  confirmPendingNotification: async (
    id: string,
    chosenCategory: string,
    accountId?: string
  ) => {
    const notif = get().pendingNotifications.find((n) => n.id === id);
    if (!notif) return null;

    const addedTx = await get().addTransaction({
      accountId: accountId || notif.accountId || 'acc-1',
      direction: notif.direction,
      kind: notif.direction === 'CREDIT' ? 'INCOME' : 'EXPENSE',
      amountPaise: notif.amountPaise,
      counterpartyName: notif.counterpartyName,
      categoryName: chosenCategory,
      paymentMethod: notif.paymentMethod,
      note: notif.referenceId ? `Ref: ${notif.referenceId}` : undefined,
      occurredAt: notif.receivedAt,
      source: 'SMS',
    });

    set((state) => ({
      pendingNotifications: state.pendingNotifications.filter((n) => n.id !== id),
    }));

    return addedTx;
  },

  dismissPendingNotification: (id: string) => {
    set((state) => ({
      pendingNotifications: state.pendingNotifications.filter((n) => n.id !== id),
    }));
  },

  addPendingNotification: (notification) => {
    const nowIso = new Date().toISOString();
    const newNotif: PendingFinancialNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      receivedAt: nowIso,
    };
    set((state) => ({
      pendingNotifications: [newNotif, ...state.pendingNotifications],
    }));
  },
}));
