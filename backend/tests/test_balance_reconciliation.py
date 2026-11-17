import pytest
from datetime import datetime, date
from app.services.balance_calculator import compute_account_balance, compute_analytics_summary
from app.schemas.transaction import TransactionCreate

def test_account_balance_reconciliation():
    """
    Test rule: current balance = opening_balance + sum(confirmed credits) - sum(confirmed debits)
    """
    opening_balance = 500000  # ₹5,000.00
    transactions = [
        {"status": "CONFIRMED", "direction": "CREDIT", "amount_paise": 250000, "deleted_at": None}, # +₹2,500
        {"status": "CONFIRMED", "direction": "DEBIT", "amount_paise": 120000, "deleted_at": None},  # -₹1,200
        {"status": "NEEDS_REVIEW", "direction": "DEBIT", "amount_paise": 50000, "deleted_at": None}, # Pending, ignored
        {"status": "CONFIRMED", "direction": "DEBIT", "amount_paise": 30000, "deleted_at": "2026-11-01T00:00:00"}, # Deleted, ignored
    ]

    balance = compute_account_balance(opening_balance, transactions)
    # Expected: 500000 + 250000 - 120000 = 630000 (₹6,300.00)
    assert balance == 630000

def test_pending_transactions_never_affect_balances():
    """
    Test rule: NEEDS_REVIEW transactions must never affect balance.
    """
    opening_balance = 100000
    transactions = [
        {"status": "NEEDS_REVIEW", "direction": "DEBIT", "amount_paise": 50000, "deleted_at": None},
        {"status": "NEEDS_REVIEW", "direction": "CREDIT", "amount_paise": 80000, "deleted_at": None},
    ]

    balance = compute_account_balance(opening_balance, transactions)
    assert balance == opening_balance

def test_exchanges_are_neutral_in_cash_flow():
    """
    Test rule: digital <-> cash exchanges shift account balances,
    but are strictly excluded from monthly income and monthly expenses.
    """
    accounts = [
        {"id": "acc-bank", "opening_balance_paise": 1000000, "archived": False}, # ₹10,000
        {"id": "acc-cash", "opening_balance_paise": 200000, "archived": False},  # ₹2,000
    ]

    # Swap ₹500 digital for ₹500 cash
    transactions = [
        # Regular income
        {"status": "CONFIRMED", "direction": "CREDIT", "kind": "INCOME", "amount_paise": 500000, "deleted_at": None}, # ₹5,000
        # Regular expense
        {"status": "CONFIRMED", "direction": "DEBIT", "kind": "EXPENSE", "amount_paise": 150000, "deleted_at": None},  # ₹1,500
        # Exchange legs (₹500 swap)
        {"status": "CONFIRMED", "direction": "DEBIT", "kind": "EXCHANGE_LEG", "amount_paise": 50000, "deleted_at": None},
        {"status": "CONFIRMED", "direction": "CREDIT", "kind": "EXCHANGE_LEG", "amount_paise": 50000, "deleted_at": None},
    ]

    summary = compute_analytics_summary(accounts, transactions)

    # Monthly income should be only ₹5,000 (500000 paise)
    assert summary["monthly_income_paise"] == 500000
    # Monthly expense should be only ₹1,500 (150000 paise)
    assert summary["monthly_expense_paise"] == 150000
    # Net cash flow = 500000 - 150000 = 350000
    assert summary["monthly_net_paise"] == 350000
    # Money exchanged should record the swap: 50000 paise (₹500)
    assert summary["money_exchanged_paise"] == 50000
    # Total balance = 1000000 + 200000 + 500000 - 150000 - 50000 + 50000 = 1550000
    assert summary["total_balance_paise"] == 1550000

def test_transaction_schema_local_date_derivation():
    """
    Test that local_date is automatically derived if omitted.
    """
    tx = TransactionCreate(
        account_id="11111111-1111-1111-1111-111111111111",
        direction="DEBIT",
        kind="EXPENSE",
        amount_paise=15000,
        occurred_at=datetime(2026, 11, 2, 14, 30),
    )
    assert tx.local_date == date(2026, 11, 2)
    assert tx.amount_paise == 15000

