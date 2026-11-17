"""
Balance Calculation and Reconciliation Service
Domain Invariants:
1. Money is strictly integer paise (1 INR = 100 paise).
2. Current Balance = opening_balance + sum(confirmed credits) - sum(confirmed debits)
3. NEEDS_REVIEW (pending) items never alter account balances.
4. EXCHANGE_LEG movements shift balances between accounts but are strictly excluded
   from income, expense, and net cash flow analytics.
"""

from typing import List, Dict, Any

def compute_account_balance(
    opening_balance_paise: int,
    transactions: List[Dict[str, Any]]
) -> int:
    """
    Computes current balance for a single account from confirmed transactions.
    """
    current_balance = opening_balance_paise
    for tx in transactions:
        # Pending transactions must NEVER affect balances
        if tx.get("status") != "CONFIRMED":
            continue
        # Soft-deleted transactions must be ignored
        if tx.get("deleted_at") is not None:
            continue

        direction = tx.get("direction")
        amount = tx.get("amount_paise", 0)

        if direction == "CREDIT":
            current_balance += amount
        elif direction == "DEBIT":
            current_balance -= amount

    return current_balance

def compute_analytics_summary(
    accounts: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]]
) -> Dict[str, int]:
    """
    Computes global totals across all accounts:
    - total_balance_paise
    - monthly_income_paise
    - monthly_expense_paise
    - monthly_net_paise
    - money_exchanged_paise
    - pending_count
    """
    total_balance = 0
    monthly_income = 0
    monthly_expense = 0
    money_exchanged = 0
    pending_count = 0

    # 1. Opening balance contributions
    for acc in accounts:
        if not acc.get("archived", False):
            total_balance += acc.get("opening_balance_paise", 0)

    # 2. Transaction aggregations
    for tx in transactions:
        if tx.get("deleted_at") is not None:
            continue

        status = tx.get("status")
        if status == "NEEDS_REVIEW":
            pending_count += 1
            continue  # Do not include pending in financial metrics

        direction = tx.get("direction")
        kind = tx.get("kind")
        amount = tx.get("amount_paise", 0)

        # Update total account balance
        if direction == "CREDIT":
            total_balance += amount
        elif direction == "DEBIT":
            total_balance -= amount

        # Exchanges are neutral swaps: tracked separately, never counted in income/expense
        if kind == "EXCHANGE_LEG":
            # Count each exchange once (e.g. from credit leg or direction)
            if direction == "CREDIT":
                money_exchanged += amount
            continue

        # Cash flow categorization
        if direction == "CREDIT" and kind in ("INCOME", "TRANSFER_RECEIVED"):
            monthly_income += amount
        elif direction == "DEBIT" and kind in ("EXPENSE", "TRANSFER_SENT"):
            monthly_expense += amount

    monthly_net = monthly_income - monthly_expense

    return {
        "total_balance_paise": total_balance,
        "monthly_income_paise": monthly_income,
        "monthly_expense_paise": monthly_expense,
        "monthly_net_paise": monthly_net,
        "money_exchanged_paise": money_exchanged,
        "pending_count": pending_count,
    }

