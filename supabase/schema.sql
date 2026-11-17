-- ==============================================================================
-- Cashly Supabase Database Schema
-- Production Migration & Table Definitions
-- 
-- Key Invariants:
-- 1. All monetary values stored as 64-bit integer paise (1 INR = 100 paise).
-- 2. Row Level Security (RLS) enabled on all tables (auth.uid() = user_id).
-- 3. Temporal accuracy: UTC occurred_at + tz_offset_minutes + local_date (YYYY-MM-DD).
-- 4. Automatic profile provisioning on auth.users sign-up.
-- 5. Realtime sync enabled on transactions, accounts, and exchanges.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUM TYPES (Idempotent Creation)
DO $$ BEGIN
  CREATE TYPE transaction_direction AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_kind AS ENUM ('EXPENSE', 'INCOME', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'EXCHANGE_LEG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_source AS ENUM ('SMS', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('NEEDS_REVIEW', 'CONFIRMED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('BANK', 'UPI', 'CASH', 'WALLET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE category_kind AS ENUM ('EXPENSE', 'INCOME');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE person_kind AS ENUM ('PERSON', 'MERCHANT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE exchange_direction AS ENUM ('DIGITAL_TO_CASH', 'CASH_TO_DIGITAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLE DEFINITIONS

-- Table 1: Profiles (User settings, theme, tracking date)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tracking_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  sms_permission_status TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
  theme_mode TEXT NOT NULL DEFAULT 'system',
  home_card_style TEXT NOT NULL DEFAULT 'white',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: Accounts (Bank accounts, cash in hand, digital wallets)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type account_type NOT NULL DEFAULT 'BANK',
  opening_balance_paise BIGINT NOT NULL DEFAULT 0,
  description TEXT,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: Categories (Expense & Income categories)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system defaults
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'tag',
  kind category_kind NOT NULL DEFAULT 'EXPENSE',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 4: People (Counterparties, friends, merchants)
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind person_kind NOT NULL DEFAULT 'PERSON',
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 5: Exchanges (Neutral Digital <-> Cash swaps)
CREATE TABLE IF NOT EXISTS exchanges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  direction exchange_direction NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  digital_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  cash_account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  occurred_at TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 6: Transactions (Core ledger entries)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  direction transaction_direction NOT NULL,
  kind transaction_kind NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  occurred_at TIMESTAMPTZ NOT NULL,
  tz_offset_minutes INTEGER NOT NULL DEFAULT 330, -- +05:30 IST
  local_date DATE NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'UPI',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  merchant_name TEXT,
  reference_id TEXT,
  note TEXT,
  source transaction_source NOT NULL DEFAULT 'MANUAL',
  status transaction_status NOT NULL DEFAULT 'CONFIRMED',
  exchange_id UUID REFERENCES exchanges(id) ON DELETE CASCADE,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Table 7: SMS Inbox (Raw / Parsed Financial SMS metadata)
CREATE TABLE IF NOT EXISTS sms_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  parsed_json JSONB,
  received_at TIMESTAMPTZ NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 8: Learned Merchant Rules (Auto-categorization)
CREATE TABLE IF NOT EXISTS merchant_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 9: Monthly Summaries (Cached monthly rollups)
CREATE TABLE IF NOT EXISTS monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL, -- Format: YYYY-MM
  credit_paise BIGINT NOT NULL DEFAULT 0,
  debit_paise BIGINT NOT NULL DEFAULT 0,
  expense_paise BIGINT NOT NULL DEFAULT 0,
  exchange_paise BIGINT NOT NULL DEFAULT 0,
  net_paise BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_year_month UNIQUE (user_id, year_month)
);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, local_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_user_status ON transactions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_tx_user_account ON transactions (user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_tx_dedupe ON transactions (user_id, dedupe_key);
CREATE INDEX IF NOT EXISTS idx_tx_exchange ON transactions (exchange_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_people_user ON people (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);

-- 6. AUTOMATED UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON accounts;
CREATE TRIGGER trigger_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
CREATE TRIGGER trigger_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_people_updated_at ON people;
CREATE TRIGGER trigger_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_exchanges_updated_at ON exchanges;
CREATE TRIGGER trigger_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
CREATE TRIGGER trigger_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_merchant_rules_updated_at ON merchant_rules;
CREATE TRIGGER trigger_merchant_rules_updated_at BEFORE UPDATE ON merchant_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_monthly_summaries_updated_at ON monthly_summaries;
CREATE TRIGGER trigger_monthly_summaries_updated_at BEFORE UPDATE ON monthly_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. AUTOMATED USER PROFILE CREATION HOOK
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, tracking_start_date)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    CURRENT_DATE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_inbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;

-- 9. RLS POLICIES (Drop + Re-create for idempotency)
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
CREATE POLICY "Users can manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can manage own accounts" ON accounts;
CREATE POLICY "Users can manage own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read system or own categories" ON categories;
CREATE POLICY "Users can read system or own categories" ON categories
  FOR SELECT USING (is_system = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
CREATE POLICY "Users can manage own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own people" ON people;
CREATE POLICY "Users can manage own people" ON people
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own exchanges" ON exchanges;
CREATE POLICY "Users can manage own exchanges" ON exchanges
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own transactions" ON transactions;
CREATE POLICY "Users can manage own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sms_inbox" ON sms_inbox;
CREATE POLICY "Users can manage own sms_inbox" ON sms_inbox
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own merchant_rules" ON merchant_rules;
CREATE POLICY "Users can manage own merchant_rules" ON merchant_rules
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own monthly_summaries" ON monthly_summaries;
CREATE POLICY "Users can manage own monthly_summaries" ON monthly_summaries
  FOR ALL USING (auth.uid() = user_id);

-- 10. SEED DEFAULT SYSTEM CATEGORIES
INSERT INTO categories (name, icon, kind, is_system) VALUES
  ('Food & Dining', 'utensils', 'EXPENSE', TRUE),
  ('Groceries', 'shopping-cart', 'EXPENSE', TRUE),
  ('Transport', 'car', 'EXPENSE', TRUE),
  ('Shopping', 'shopping-bag', 'EXPENSE', TRUE),
  ('Bills & Utilities', 'file-text', 'EXPENSE', TRUE),
  ('Health & Medical', 'heart-pulse', 'EXPENSE', TRUE),
  ('Entertainment', 'film', 'EXPENSE', TRUE),
  ('Rent & Housing', 'home', 'EXPENSE', TRUE),
  ('Education', 'book-open', 'EXPENSE', TRUE),
  ('Travel', 'plane', 'EXPENSE', TRUE),
  ('Salary', 'briefcase', 'INCOME', TRUE),
  ('Repayment', 'arrow-left-right', 'INCOME', TRUE),
  ('Investments', 'trending-up', 'INCOME', TRUE),
  ('Other Expense', 'tag', 'EXPENSE', TRUE),
  ('Other Income', 'plus-circle', 'INCOME', TRUE)
ON CONFLICT DO NOTHING;

-- 11. REALTIME REPLICATION (For instant sync with Expo app)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles, accounts, categories, transactions, exchanges;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

