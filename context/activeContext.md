# Active Context — Current Focus & Next Steps

> Update this file at the start and end of every working session.

**Last updated:** 2026-11-02
**Current phase:** Phase 6 (Dashboard & Analytics), Phase 7 (Calendar & History), & Phase 8 (Settings) complete
**Next phase:** Phase 4 — Native/SMS parsing & deeper Review workflows

## 1. What Just Happened
- Built intuitive, minimalistic Analytics Dashboard with interactive Day Expenses & Transactions Chart and Category Donut Pie Chart:
  1. [`CategoryPieChart`](file:///c:/chandru/Cashly/mobile/src/features/analytics/CategoryPieChart.tsx):
     - Interactive SVG donut pie chart showing category expense segments using Cashly's high-contrast monochromatic/zinc palette.
     - Live center readout displaying selected category name, rupee amount, and percentage (or total expenditure by default).
     - Interactive legend with color indicators and percentage share.
  2. [`DayExpensesChart`](file:///c:/chandru/Cashly/mobile/src/features/analytics/DayExpensesChart.tsx):
     - Interactive day-by-day vertical bars with rounded pills scaled proportionally to expenses.
     - Tapping any day highlights that bar in solid white, reveals exact spending, and displays transaction volume in a floating inspection banner.
     - Horizontal reference threshold lines and dual weekday/date labels.
     - Peak day and active days count insights.
  3. [`AnalyticsScreen`](file:///c:/chandru/Cashly/mobile/src/features/analytics/AnalyticsScreen.tsx):
     - Hero flow card displaying Total Expenses, Total Inflow, and Net Cash Flow (with positive/negative savings indicators).
     - Period switchers: `7 Days`, `30 Days`, and `All-Time`.
     - Spending by Category pie chart and list with horizontal proportion bars.
     - Payment Channels card breaking down digital (UPI/Bank) vs. physical cash liquidity vs. neutral ATM money exchanges.
     - Period average transaction size and total record volume.
  3. Mounted Analytics Tab ([`analytics.tsx`](file:///c:/chandru/Cashly/mobile/app/(tabs)/analytics.tsx)).
  4. Unit tests ([`analytics.test.mjs`](file:///c:/chandru/Cashly/mobile/src/features/analytics/analytics.test.mjs)):
     - 28/28 mobile tests passing, 4/4 backend tests passing.
  1. [`CalendarScreen`](file:///c:/chandru/Cashly/mobile/src/features/calendar/CalendarScreen.tsx):
     - Black rounded Calendar Card with `< Month >` navigation on left and Year on right.
     - 7-column grid adhering to Monday-first convention (`M T W TH F S SU`).
     - Selected day in solid white circle with contrasting bold black number (matching day `9` in the reference image).
     - Visual red and green dot indicators for days with expense and income transactions.
     - Card footer displaying `Total Expense: ₹X` (e.g. ₹2000 for Oct 9) with a quick "+ Log" button.
     - Filter modes: `Day` (selected date), `Month` (active month), and `All` (All-time history since first logged in).
     - Quick jump pills: "First Logged Date" and "Today".
     - Transaction list below card showing categorized expenses with vector Lucide icons, friendly timestamp, and red amounts.
     - Interactive Edit/Delete modal on tapping any transaction row.
     - Quick add transaction modal for logging directly on any selected date.
  2. Date & Calendar utilities ([`date.ts`](file:///c:/chandru/Cashly/mobile/src/utils/date.ts)):
     - Added `getDaysInMonth`, `getWeekdayOfFirstDay` (Monday = 0), `getMonthName`, `formatYearMonth`, and `parseYearMonth`.
  3. Mounted Calendar Tab ([`calendar.tsx`](file:///c:/chandru/Cashly/mobile/app/(tabs)/calendar.tsx)).
  4. Unit tests ([`calendar.test.mjs`](file:///c:/chandru/Cashly/mobile/src/features/calendar/calendar.test.mjs)):
     - 25/25 mobile tests passing, 4/4 backend tests passing.
  1. [`SettingsScreen`](file:///c:/chandru/Cashly/mobile/src/features/settings/SettingsScreen.tsx):
     - Profile Name editing modal (syncs to auth and profile store).
     - Appearance Toggle: Balance Card Style (White card / Vice-Versa vs. Black card).
     - Accounts & Balances: Add new bank/cash/wallet accounts, edit name and opening baseline, or delete.
     - Financial Timeline: Edit tracking start date.
     - SMS Detection: Auto-read vs. Paste mode toggle.
     - Custom Categories: Add custom expense or income categories.
     - Data Export: Complete JSON backup download & share (includes profile, settings, accounts, categories, and transactions).
     - Sign Out confirmation dialog.
  2. [`settingsStore`](file:///c:/chandru/Cashly/mobile/src/features/settings/settingsStore.ts):
     - Central state with Supabase sync and offline-safe fallbacks.
  3. [`transactionStore`](file:///c:/chandru/Cashly/mobile/src/features/transactions/transactionStore.ts):
     - Stores live transactions with integer paise math.
     - Supports adding, updating, and deleting transactions.
  4. Live Home Screen Reflection ([`index.tsx`](file:///c:/chandru/Cashly/mobile/app/(tabs)/index.tsx)):
     - Name updates immediately reflect on the BalanceCard.
     - White / Black card style toggle immediately applies to the BalanceCard.
     - Account baseline edits immediately recalculate the current balance.
     - "Sended", "Received", and "⇄" buttons open interactive modals to record new expenses, income, or neutral digital ↔ cash exchanges.
     - Tapping any transaction in the list opens an edit/delete modal with instant recalculation of balance, income, and expenses.
  5. Mounted Settings Tab ([`settings.tsx`](file:///c:/chandru/Cashly/mobile/app/(tabs)/settings.tsx)).
  6. Added comprehensive unit tests in [`settings.test.mjs`](file:///c:/chandru/Cashly/mobile/src/features/settings/settings.test.mjs) (21/21 passing in mobile, 4/4 passing in backend).

## 2. Current Focus
Begin Phase 4: Transactions (Manual entry modal/form, SMS parser module with bank/UPI regex fixtures, Paste-SMS screen, Dedupe logic, and Pending review sheet).

## 3. Immediate Next Steps
1. Build pure TypeScript SMS parser module in `mobile/src/sms/parser.ts` supporting HDFC, SBI, ICICI, Axis, Kotak, and GPay/PhonePe/Paytm formats.
2. Build unit test fixture library for SMS parsing.
3. Build Paste-SMS screen and Pending Review sheet.
4. Implement manual transaction creation/edit modal.

## 4. Open Questions (need user input)
1. **Supabase credentials** — user to create/share project URL and anon key (via `.env`, never in chat history beyond what is needed).
2. **Delight font** — please provide the font files or confirm the exact family/source.
3. **Reference screenshots** — they did not reach me; re-upload the Home Dashboard and Calendar images for closer visual fidelity.
4. **Redis** — optional/deferred (React Query as the active cache)? Confirm.
5. **Weekly filter** — week starts Monday or Sunday?
6. **Default categories** — start with: Food & Snacks, Transport, Groceries, Shopping, Bills, Health, Entertainment, Rent, Education, Travel, Salary, Repayment, Other. Edit as needed.

## 5. Active Decisions
- Money stored as integer paise; UTC + offset + local date for time.
- Exchanges are linked two-leg records excluded from income/expense analytics.
- Local persistence behind a repository interface so SQLCipher can replace expo-sqlite in the dev-build phase.
- Pending transactions never affect balances until confirmed.

## 6. Risks & Watch-List
- Native SMS and SQLCipher need an Expo dev build (not Expo Go) — schedule that phase explicitly.
- Google Play restricted-permission policy for SMS affects public release.
- Bank SMS formats vary widely; parser needs a growing fixture library and a safe "uncertain → ask user" path.
- Balance double counting (UPI vs underlying bank, exchanges) is the top correctness risk; cover with unit tests first.

## 7. Session Notes
- 2026-11-02: Memory Bank initialised. Awaiting review before Phase 1.
