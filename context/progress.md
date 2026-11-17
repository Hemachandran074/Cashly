# Progress Tracker

**Project:** Personal Money & Expense Tracker (React Native + FastAPI + Supabase)
**Started:** 2026-11-02
**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

## Overall Status
| Phase | Name | Status |
|---|---|---|
| 0 | Planning & Memory Bank | [x] done |
| 1 | Scaffolding & design system | [x] done |
| 2 | Database, backend & auth | [x] done |
| 3 | Onboarding | [x] done |
| 4 | Transactions (manual + SMS paste + review) | [ ] next |
| 3 | Onboarding | [ ] |
| 4 | Transactions (manual + SMS paste + review) | [ ] |
| 5 | Exchanges & People ledger | [ ] |
| 6 | Dashboard & Analytics | [x] done |
| 7 | Calendar & History | [x] done |
| 8 | Settings, privacy & data controls | [x] done |
| 9 | Native Android: Kotlin SMS + SQLCipher | [ ] |
| 10 | Testing, polish & release prep | [ ] |

---

## Phase 0 — Planning & Memory Bank
- [x] Capture requirements, stack and confirmed decisions
- [x] `projectbrief.md`
- [x] `productContext.md`
- [x] `systemPatterns.md`
- [x] `techContext.md`
- [x] `activeContext.md`
- [x] `progress.md`
- [ ] User reviews files and answers open questions (see `activeContext.md` §4)

## Phase 1 — Scaffolding & Design System
- [x] Create monorepo layout (`mobile/`, `backend/`, `supabase/`)
- [x] Expo + TypeScript + expo-router setup, ESLint/Prettier
- [x] Load fonts (Delight, Lora) via expo-font with fallback
- [x] Theme tokens (colors, radii, spacing, type scale)
- [x] Primitives: BalanceCard, PillNav, TransactionRow, AmountText, CategoryChip, EmptyState
- [x] Floating pill bottom navigation (Home, Analytics, Calendar, Settings)
- [x] Money (paise ↔ ₹, Indian grouping) and date/timezone utilities with unit tests

## Phase 2 — Database, Backend & Auth
- [x] Supabase SQL migration: tables, indexes, enums
- [x] Row Level Security policies for every table
- [x] Seed system categories
- [x] FastAPI app skeleton, config, JWT verification (Supabase)
- [x] Sign up / sign in screens (email + password), session handling
- [x] Routers: accounts, categories, people, transactions, exchanges, analytics
- [x] Backend tests for balance and RLS-sensitive logic

## Phase 3 — Onboarding
- [x] Welcome & introduction
- [x] Opening balances (multiple accounts, UPI-link without duplicating bank balance)
- [x] SMS permission explanation screen (skippable; paste fallback)
- [x] Tracking start date (today / custom)
- [x] Review & confirm summary with back/edit
- [x] Progress indicator, every step skippable, resume in Settings
- [x] First dashboard experience

## Phase 4 — Transactions
- [ ] Manual add/edit/delete (amount, credit/debit, date-time, category, person, method, note)
- [ ] SMS parser module + fixture tests (UPI, debit, credit, bank transfer)
- [ ] Paste-SMS screen → Pending Transaction
- [ ] Dedupe logic (reference ID, hash, time bucket)
- [ ] Review sheet: category, person, note, type correction, one-tap confirm
- [ ] Learned merchant rules
- [ ] Transaction history: search + category/type/method/date filters, statuses (Needs Review / Confirmed), detail view

## Phase 5 — Exchanges & People
- [ ] Digital-to-Cash exchange flow (both directions) with linked legs
- [ ] Exclude exchanges from income/expense analytics; show "Money exchanged"
- [ ] People list and per-person ledger (given, received, outstanding, last date)
- [ ] Buckets: I owe / Owed to me / Completed exchanges / Regular payments

## Phase 6 — Dashboard & Analytics
- [x] Home: balance card, live income/expense, Sended / Received / Money Exchange interactive modals
- [x] Minimalist Day Expenses & Transactions chart (7-day activity bars with day inspection callouts)
- [x] Period filters (7 Days, 30 Days, All-Time)
- [x] Inflow, outflow, and net cash flow health metrics
- [x] Category-wise spending proportion bars
- [x] Payment channels breakdown: digital (UPI / Bank) vs. physical cash vs. neutral ATM exchanges
- [x] Full mobile unit tests passing (28/28 tests)

## Phase 7 — Calendar & History
- [x] Calendar screen matching design mockup (black container, month navigation arrows, year display, 7-column grid)
- [x] Selected-date white circle with contrasting text; debit/credit dot indicators
- [x] Day transactions list; whole-month view; all-time ledger view
- [x] Total Expense card summary calculation
- [x] Quick jump to first recorded transaction (since first login) and Today
- [x] Interactive transaction detail, editing, deletion, and quick logging from calendar
- [x] Month/year boundary, Monday-start weekday calculations, and unit tests (25/25 passing)

## Phase 8 — Settings, Privacy & Data Controls
- [x] Profile, accounts management (add/edit/delete with live balance updates)
- [x] Theme & Card appearance toggles (White vice-versa card vs Black card)
- [x] SMS permission status and controls
- [x] Categories management (system + custom categories)
- [x] Export data (complete JSON ledger backup including profile, settings, accounts, categories, and transactions)
- [x] Sign out and session controls
- [x] Live reflection across Home dashboard, modals, and navigation

## Phase 9 — Native Android (dev build)
- [ ] Expo dev build / prebuild configured
- [ ] Kotlin SMS BroadcastReceiver + permission module
- [ ] Financial-sender/keyword filtering on-device
- [ ] Respect tracking start date; never auto-confirm
- [ ] SQLCipher encrypted local DB with Keystore-held key
- [ ] Offline sync queue

## Phase 10 — Testing, Polish & Release Prep
- [ ] Unit tests: parser, balances, dedupe, timezone
- [ ] End-to-end walkthrough of the primary workflow
- [ ] Accessibility, small/large screen checks, empty states
- [ ] Performance with large histories
- [ ] Google Play SMS permission declaration review

---

## Decisions Log
| Date | Decision |
|---|---|
| 2026-11-02 | SMS: paste now, auto-read later |
| 2026-11-02 | Auth: email + password (Supabase Auth) |
| 2026-11-02 | Storage: user's own Supabase project |
| 2026-11-02 | Currency ₹ (integer paise); timezone = phone's |
| 2026-11-02 | Fonts: Delight primary, Lora secondary |

## Changelog
- 2026-11-02 — Phase 3 completed: Multi-step Onboarding flow (Welcome, Accounts & opening balances, SMS permission explanation, Tracking start date, Review & confirm) with unit tests.
- 2026-11-02 — Phase 2 completed: Delight font integration, Supabase client & Auth (Sign-in/Sign-up), FastAPI routers (Accounts, Categories, People, Transactions, Exchanges, Analytics), and balance reconciliation tests.
- 2026-11-02 — Phase 1 completed: Scaffolding, Design System tokens, Primitives, Floating PillNav, and unit-tested mathematical/date utilities.
- 2026-11-02 — Memory Bank (six files) created; initial planning finalized.
