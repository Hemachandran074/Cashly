# Cashly — Personal Money & Expense Tracker

A mobile-first personal money and expense tracking application (Android-first, React Native + TypeScript + FastAPI + Supabase) that detects financial transactions from SMS (UPI, bank transfers, debit/credit alerts), lets the user review and confirm them, and supports fast manual entry.

## Architecture

- **`mobile/`**: React Native (Expo + TypeScript + Expo Router)
  - Clean black & white design system
  - Hero `BalanceCard` & Floating `PillNav`
  - Strict integer paise arithmetic (`1 INR = 100 paise`)
  - Indian numbering formatting (`₹1,23,456.00`)
- **`backend/`**: FastAPI (Python 3.12)
  - REST endpoints, Supabase JWT verification
  - Analytics rollups & business validation
- **`supabase/`**: PostgreSQL migrations & seed data
  - Full Row-Level Security (RLS) policies on every table
  - Domain models for accounts, people, categories, exchanges, and transactions

## Getting Started

### 1. Mobile
```bash
cd mobile
npm install
npm start
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Unit Tests
```bash
npm run test --prefix mobile
```

