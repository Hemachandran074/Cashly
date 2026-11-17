# System Patterns — Architecture & Domain Rules

## 1. High-Level Architecture
```
┌──────────────────────── Android device ────────────────────────┐
│ React Native (TS) UI ── Zustand (UI state)                     │
│        │                 React Query (server state / cache)    │
│        ├── Local store: SQLite + SQLCipher (encrypted, offline)│
│        └── Kotlin native module (later): SMS receiver,         │
│            permission handling, background parsing queue       │
└───────────────┬────────────────────────────────────────────────┘
                │ HTTPS (JWT from Supabase Auth)
┌───────────────▼────────────────┐      ┌─────────────────────────┐
│ FastAPI (Python)               │─────▶│ Supabase (user-owned)   │
│ REST, validation, business     │      │ Auth + PostgreSQL + RLS │
│ logic, sync, analytics queries │      └─────────────────────────┘
└────────────────────────────────┘
```
- **Supabase Auth** handles email + password; FastAPI verifies the Supabase JWT on every request.
- **Postgres Row Level Security** on every table: `user_id = auth.uid()`.
- **Local-first sync:** writes go to local SQLite first, then sync to the backend; server is the durable system of record.

## 2. Domain Model (core tables)
| Table | Purpose | Key fields |
|---|---|---|
| `profiles` | User profile and settings | `id`, `name`, `tracking_start_date`, `timezone`, `onboarding_done`, `sms_permission_status` |
| `accounts` | Bank, UPI-linked, cash, wallet | `id`, `name`, `type`, `opening_balance`, `description`, `archived` |
| `categories` | Expense/income categories | `id`, `name`, `icon`, `kind`, `is_system` |
| `people` | People / merchants | `id`, `name`, `kind` (person / merchant), `aliases[]` |
| `transactions` | Confirmed + pending ledger entries | see §3 |
| `exchanges` | Linked digital↔cash exchange | `id`, `person_id`, `direction`, `amount`, `digital_account_id`, `cash_account_id`, `occurred_at`, `note` |
| `sms_inbox` | Parsed SMS metadata (raw text optional/local only) | `id`, `sender`, `body_hash`, `parsed_json`, `received_at`, `transaction_id`, `status` |
| `merchant_rules` | Learned merchant → category / person mapping | `pattern`, `category_id`, `person_id` |
| `monthly_summaries` | Optional cache, rebuildable from transactions | `year_month`, `credit`, `debit`, `expense`, `exchange`, `net` |

## 3. Transaction Shape
```
id, user_id, account_id,
direction: CREDIT | DEBIT,
kind: EXPENSE | INCOME | TRANSFER_SENT | TRANSFER_RECEIVED | EXCHANGE_LEG,
amount_paise (integer),
occurred_at (timestamptz, UTC), tz_offset_minutes, local_date (date, user's tz at the time),
payment_method: CASH | UPI | BANK_TRANSFER | OTHER,
category_id?, person_id?, merchant_name?,
reference_id?, note?,
source: SMS | MANUAL,
status: NEEDS_REVIEW | CONFIRMED,
exchange_id? (links the two legs),
dedupe_key, created_at, updated_at, deleted_at?
```

## 4. Critical Rules (do not violate)
1. **Money is stored as integer paise**, never floats. Display with ₹ and Indian grouping (₹1,23,456.00).
2. **Opening balance is not income.** It lives on `accounts.opening_balance` only.
3. **Current balance (per account)** = `opening_balance + Σ CONFIRMED credits − Σ CONFIRMED debits` for transactions on/after the tracking start date. `NEEDS_REVIEW` never affects balances.
4. **Exchanges:** one `exchanges` row owns two linked `EXCHANGE_LEG` transactions (digital leg + cash leg, opposite directions). They move balances between accounts but are **excluded from income, expense, credit and debit analytics** and reported separately as "Money exchanged".
5. **UPI-linked accounts** reference the underlying bank account to avoid duplicating a balance.
6. **Dedupe** key priority: (a) bank/UPI reference ID + amount; (b) else hash of `amount + direction + normalized counterparty + 5-minute time bucket`; (c) same SMS body hash. Duplicates attach to the existing transaction instead of creating a new one.
7. **Tracking start date:** SMS older than the start date is never auto-imported; it can be surfaced only as an explicit user-confirmed import.
8. **Soft delete** (`deleted_at`) so analytics recompute correctly and sync stays consistent. Edit/delete triggers recompute of monthly and all-time figures.
9. **Time/timezone:** persist UTC instant plus `tz_offset_minutes` and `local_date`; group by `local_date` for day/month/year so month boundaries are right in the phone's timezone. Weeks start on Monday (configurable later).
10. **Pending transactions are never auto-confirmed.**

## 5. SMS Parsing Pipeline
```
Paste (now) / SMS receiver (later)
  → sender + keyword filter (financial only; discard the rest immediately)
  → regex/pattern parsers per bank & UPI format (HDFC, SBI, ICICI, Axis, Kotak, GPay/PhonePe/Paytm alerts, generic fallback)
  → extract: amount, CREDIT/DEBIT, date-time, counterparty, reference ID, account hint (last-4)
  → confidence score (low → ask user to confirm type)
  → dedupe check
  → create PENDING transaction (+ apply merchant_rules suggestions)
  → review UI
```
- Parser is a pure, unit-tested module with a fixture library of sample SMS formats (synthetic, no real personal data).
- Raw SMS text stays on-device; only parsed fields sync, and only with consent.

## 6. People Ledger Logic
- Per person: `given` = Σ debits with `kind = TRANSFER_SENT`; `received` = Σ credits with `kind = TRANSFER_RECEIVED`.
- Outstanding = `given − received` (positive = they owe me, negative = I owe them), excluding exchanges and regular expenses.
- Four visible buckets: *I owe*, *Owed to me*, *Completed exchanges*, *Regular payments & expenses*.

## 7. Frontend Patterns
- **Feature-sliced folders**: `features/{auth,onboarding,transactions,review,exchange,people,analytics,calendar,settings}`.
- **React Query** for server data (query keys scoped by `userId` + period); **Zustand** for UI state (filters, selected date, onboarding draft).
- **Repository layer** hides local-vs-remote storage from UI.
- **Design tokens** (colors, radii, spacing, typography) in one theme module; no hardcoded values in components.
- **Reusable primitives:** `BalanceCard`, `PillNav`, `TransactionRow`, `AmountText`, `CalendarGrid`, `CategoryChip`, `PersonPicker`, `EmptyState`.
- Reanimated / LayoutAnimation for transitions; accessibility labels on all controls.

## 8. Backend Patterns (FastAPI)
- Routers: `auth`, `accounts`, `transactions`, `exchanges`, `people`, `categories`, `analytics`, `sync`, `sms`.
- Pydantic v2 schemas; service layer holds business rules; repository layer talks to Supabase Postgres.
- Analytics via SQL aggregates/views on `local_date` and `kind`; summaries rebuildable at any time.
- Idempotent sync endpoints using client-generated UUIDs and `updated_at` conflict resolution (last-write-wins, per record).
- Consistent error model, request logging without financial payloads.

## 9. Security Patterns
- Supabase RLS on every table; service-role key only on the backend, never in the app.
- SQLCipher key generated on device and kept in Android Keystore (via secure storage).
- No SMS body or financial data in logs or analytics; no third-party SDK receives financial data.
- Permissions requested only after an explanation screen; denial falls back to paste/manual entry.
- User-facing data controls: export, delete all data, revoke SMS permission.
