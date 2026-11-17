/**
 * Domain Models for Cashly Personal Money & Expense Tracker
 * Invariant: All money values are strictly integer paise (1 INR = 100 paise).
 */

export type TransactionDirection = 'CREDIT' | 'DEBIT';

export type TransactionKind =
  | 'EXPENSE'
  | 'INCOME'
  | 'TRANSFER_SENT'
  | 'TRANSFER_RECEIVED'
  | 'EXCHANGE_LEG';

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export type TransactionSource = 'SMS' | 'MANUAL';

export type TransactionStatus = 'NEEDS_REVIEW' | 'CONFIRMED';

export type AccountType = 'BANK' | 'UPI' | 'CASH' | 'WALLET';

export type CategoryKind = 'EXPENSE' | 'INCOME';

export type PersonKind = 'PERSON' | 'MERCHANT';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  direction: TransactionDirection;
  kind: TransactionKind;
  amount_paise: number; // Integer paise
  occurred_at: string; // ISO 8601 UTC string
  tz_offset_minutes: number;
  local_date: string; // YYYY-MM-DD in user's timezone at occurred_at
  payment_method: PaymentMethod;
  category_id?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  person_id?: string | null;
  counterparty_name?: string | null;
  reference_id?: string | null;
  note?: string | null;
  source: TransactionSource;
  status: TransactionStatus;
  exchange_id?: string | null;
  dedupe_key?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  opening_balance_paise: number;
  current_balance_paise: number;
  description?: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  kind: CategoryKind;
  is_system: boolean;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  kind: PersonKind;
  aliases: string[];
  total_given_paise: number;
  total_received_paise: number;
  outstanding_paise: number; // positive = owed to user, negative = user owes
  last_transaction_at?: string | null;
}

export interface Exchange {
  id: string;
  user_id: string;
  person_id?: string | null;
  direction: 'DIGITAL_TO_CASH' | 'CASH_TO_DIGITAL';
  amount_paise: number;
  digital_account_id: string;
  cash_account_id: string;
  occurred_at: string;
  note?: string | null;
  created_at: string;
}

export interface BalanceSummary {
  total_balance_paise: number;
  monthly_income_paise: number;
  monthly_expense_paise: number;
  monthly_net_paise: number;
  pending_count: number;
}

