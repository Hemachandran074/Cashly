# Product Context — Why this exists and how it should feel

## 1. Problem
Most people in India pay through UPI, bank transfers and cash, and constantly swap between them (e.g., sending ₹500 on Google Pay to a friend who hands over ₹500 cash). Bank apps show raw debits and credits but not *why* or *with whom*, and cash is invisible. Generic expense trackers double count these cash/digital swaps, so the user never trusts the totals.

## 2. Who it is for
Individual smartphone users in India who handle a mix of UPI, bank and cash money, lend and borrow informally with friends and family, and want a trustworthy picture of their finances with minimal effort.

## 3. What the product must solve
- Capture transactions with almost no typing (SMS → review → confirm).
- Treat **people** as first-class: who gave me money, who did I pay, who owes whom.
- Treat **digital ↔ cash exchanges** as neutral movements, not income or spending.
- Keep a **permanent, time-navigable history** (month, year, calendar, all-time).
- Keep money data **private** — local-first, user-owned Supabase project, no silent uploads.

## 4. User Journey
1. **Onboard** — understand the app, add accounts and opening balances, optionally allow SMS, choose a tracking start date, review, finish.
2. **Capture** — paste a bank/UPI SMS (auto-read later) or tap Sent / Received / Money Exchange on the home card.
3. **Review** — a Pending Transaction appears with parsed amount, type, date, merchant and reference ID already filled in.
4. **Classify** — pick category (one tap), confirm or add the person, optional note.
5. **Confirm** — transaction moves from *Needs Review* to *Confirmed* and balances update.
6. **Understand** — dashboard, analytics, calendar and people ledger reflect the new data.

## 5. UX Principles
- **Fewest taps to confirm.** Smart defaults, remembered merchant → category and merchant → person mappings.
- **Never surprise the user.** Nothing is auto-confirmed; permissions are explained before being requested; every onboarding step is skippable.
- **Calm and premium.** Black-and-white, generous spacing, large clear numbers, restrained motion.
- **Mobile-first**, not a scaled-down desktop layout; works across screen sizes.
- **Honest empty states** instead of blank screens or fake data.
- **Color semantics:** green = money in, red = money out, neutral for exchanges.

## 6. Screen Inventory
| Area | Screens / components |
|---|---|
| Auth | Sign up, sign in (email + password) |
| Onboarding | Welcome → Opening balances → SMS permission → Tracking start date → Review → Dashboard |
| Home | Black balance card (name, current balance, income/expense, Sent / Received / Money Exchange), pending banner, recent transactions |
| Transactions | History list, search + filters, detail sheet, add/edit form, delete |
| Review | Pending transaction review card/sheet, paste-SMS input |
| Analytics | Credit/debit/net, category chart, cash vs digital, period filters, month/year comparison, All-Time view |
| Calendar | Black calendar, day markers (credit / debit / both), day or month list, monthly expense total, jump to first transaction |
| People | People list, per-person ledger (given, received, outstanding, history) |
| Settings | Profile, accounts, SMS permission, categories, data controls (export / delete), preferences |

## 7. Design Language (from user references, no sample data to be hardcoded)
- Top **black rounded card**; large balance typography; income/expense side-by-side with arrows; three action buttons at the bottom.
- **Floating black pill** bottom navigation, white outline icons, white rounded background on the active item.
- **Black rounded calendar container**, prev/next month arrows, year shown separately, 7-column grid, white circle on selected date, subtle marker on days with transactions, month expense total below.
- Typography: **Delight** primary, **Lora** secondary for accents / numerals if suitable.
- Consistent radii, spacing, icon style across all screens.

## 8. Privacy Promise (shown to the user in-app)
We only look at transaction-related messages, never act on your money, never confirm anything for you, and never send your messages or financial data anywhere without asking.
