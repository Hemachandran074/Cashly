# Project Brief — Personal Money & Expense Tracker

> Foundation document. All other Memory Bank files derive from this one. If this changes, review the other five.

## 1. Project Summary
A mobile-first personal money and expense tracking app (Android-first, React Native + TypeScript) that detects financial transactions from SMS (UPI, bank transfers, debit/credit alerts), lets the user review and confirm them, and also supports fast manual entry. It tracks regular expenses and income, money exchanged with people, and digital-to-cash exchanges.

## 2. Core Objective
Give users a reliable picture of **where their money goes, where it comes from, who they exchange money with, and how their finances change over time.**

## 3. Primary Workflow (everything is optimized for this)
`SMS Detection → Transaction Review → Category Selection → Person Identification → Confirmation → Financial Analytics`

Confirmation must be quick and need as little manual input as possible.

## 4. Scope — Must-Have Capabilities
1. **SMS transaction detection** — amount, credit/debit, date/time, merchant/person, reference ID. Creates a *Pending Transaction* (never auto-confirmed). De-duplicates multiple SMS about the same payment.
2. **Manual entry** — amount, credit/debit, date/time, category, person, payment method (Cash / UPI / Bank Transfer / Other), description. Edit and delete supported.
3. **Credit & debit tracking** — prompts for "who gave / who received" when unknown.
4. **Digital-to-Cash Exchange** — a single *linked* exchange (digital leg + cash leg), both directions, never counted as spending or income.
5. **People ledger** — per person: total given, total received, outstanding (owe / owed), history, last transaction date.
6. **Dashboard & analytics** — balance movement, credit, debit, net cash flow, monthly expenses, category spend, cash vs digital, recent and pending transactions; daily/weekly/monthly/yearly filters.
7. **Transaction management** — search, category / type / method / date filters, details, edit, delete, statuses *Needs Review* and *Confirmed*.
8. **Monthly records & history** — permanent history, monthly summaries, month/year comparison, calendar modal (credit/debit/both markers, date drill-down, month view, jump to first transaction), All-Time view.
9. **Onboarding** — welcome, opening balances (multiple accounts), SMS permission (skippable), tracking start date, review, first dashboard.
10. **Privacy & security** — explained permissions, only financial SMS processed, never initiate payments, no SMS/financial data sent externally without explicit consent, user controls their records.

## 5. Key Constraints & Decisions (confirmed by the user)
| Topic | Decision |
|---|---|
| SMS detection (now) | **Paste SMS now, auto-read SMS later** (auto-read needs an installed Android build, not Expo Go) |
| Authentication | **Email + password** |
| Data storage | **User's own Supabase project** |
| Currency / timezone | **Indian Rupee (₹)**, **phone's timezone** |
| Fonts | **Delight** (primary), **Lora** (secondary) |
| Platform | Android-first; no automatic SMS reading promised on iOS (manual entry / paste there) |

## 6. Tech Stack (as specified)
React Native + TypeScript · Kotlin (native Android SMS receiver) · Python + FastAPI · Supabase (PostgreSQL) · SQLite + SQLCipher (local, encrypted) · React Query + Zustand (+ Redis, see `techContext.md`).

## 7. Design Direction (summary)
Clean, minimal, black-and-white, spacious. Large black rounded balance card, floating black pill bottom navigation (Home · Analytics · Calendar · Settings), black rounded calendar with white selected-date circle. Red = debit, green = credit. Screenshots are **style references only** — no hardcoded names, dates, amounts or calendar values; everything comes from real data.

## 8. Out of Scope
- Initiating payments or transfers of any kind
- Auto-confirming detected transactions
- Reading non-financial SMS
- Automatic SMS reading on iOS
- Multi-currency (₹ only for now)

## 9. Success Criteria
- A new user can finish onboarding and confirm a first pasted-SMS transaction in under 3 minutes.
- Balances reconcile: `opening balance + confirmed credits − confirmed debits` per account, with exchanges not double counted.
- Editing or deleting any transaction immediately updates monthly and all-time analytics.
- History is permanent and navigable by month, year and calendar date, with correct month/year boundaries in the phone's timezone.
- No raw SMS or financial data leaves the device/Supabase project without explicit consent.
