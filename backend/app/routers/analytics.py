from fastapi import APIRouter, Depends
from typing import Optional
from datetime import date
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.analytics import AnalyticsOverviewResponse, BalanceSummaryResponse, CategorySpendItem
from app.services.balance_calculator import compute_analytics_summary

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_overview(
    current_user: CurrentUser = Depends(get_current_user),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
):
    """
    Returns total balance, monthly income/expense/net, money exchanged,
    and category-wise spending distribution.
    """
    client = get_supabase_client()

    # 1. Fetch user accounts
    acc_res = client.table("accounts").select("*").eq("user_id", current_user.id).execute()
    accounts = acc_res.data or []

    # 2. Fetch transactions
    query = client.table("transactions") \
        .select("*, categories(id, name, icon)") \
        .eq("user_id", current_user.id) \
        .is_("deleted_at", "null")

    if start_date:
        query = query.gte("local_date", str(start_date))
    if end_date:
        query = query.lte("local_date", str(end_date))

    tx_res = query.execute()
    transactions = tx_res.data or []

    # 3. Calculate summary metrics
    summary_dict = compute_analytics_summary(accounts, transactions)
    summary = BalanceSummaryResponse(**summary_dict)

    # 4. Calculate category breakdown for expenses
    category_totals = {}
    total_expense = 0

    for tx in transactions:
        if tx.get("status") != "CONFIRMED":
            continue
        if tx.get("direction") == "DEBIT" and tx.get("kind") in ("EXPENSE", "TRANSFER_SENT"):
            cat = tx.get("categories") or {}
            cat_id = cat.get("id") or "uncategorized"
            cat_name = cat.get("name") or "Other"
            cat_icon = cat.get("icon") or "tag"
            amount = tx.get("amount_paise", 0)

            total_expense += amount
            if cat_id not in category_totals:
                category_totals[cat_id] = {
                    "category_id": cat_id,
                    "category_name": cat_name,
                    "category_icon": cat_icon,
                    "amount_paise": 0,
                }
            category_totals[cat_id]["amount_paise"] += amount

    category_items = []
    for cat_data in category_totals.values():
        pct = (cat_data["amount_paise"] / total_expense * 100) if total_expense > 0 else 0
        category_items.append(
            CategorySpendItem(
                category_id=cat_data["category_id"],
                category_name=cat_data["category_name"],
                category_icon=cat_data["category_icon"],
                amount_paise=cat_data["amount_paise"],
                percentage=round(pct, 2),
            )
        )

    # Sort categories by spend descending
    category_items.sort(key=lambda x: x.amount_paise, reverse=True)

    return AnalyticsOverviewResponse(
        summary=summary,
        category_distribution=category_items,
    )

