from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.services.balance_calculator import compute_account_balance

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountResponse])
async def list_accounts(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns user accounts with their calculated current balance.
    """
    client = get_supabase_client()
    
    # 1. Fetch accounts
    accounts_res = client.table("accounts").select("*").eq("user_id", current_user.id).execute()
    accounts = accounts_res.data or []

    # 2. Fetch confirmed transactions to compute live balances
    tx_res = client.table("transactions") \
        .select("account_id, direction, amount_paise, status, deleted_at") \
        .eq("user_id", current_user.id) \
        .eq("status", "CONFIRMED") \
        .is_("deleted_at", "null") \
        .execute()
    
    txs = tx_res.data or []
    
    # Group transactions by account
    tx_by_account = {}
    for tx in txs:
        acc_id = tx["account_id"]
        tx_by_account.setdefault(acc_id, []).append(tx)

    result = []
    for acc in accounts:
        acc_txs = tx_by_account.get(acc["id"], [])
        current_balance = compute_account_balance(acc["opening_balance_paise"], acc_txs)
        acc["current_balance_paise"] = current_balance
        result.append(acc)

    return result

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    payload: AccountCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Creates a new account with opening balance.
    """
    client = get_supabase_client()
    data = payload.model_dump()
    data["user_id"] = current_user.id

    res = client.table("accounts").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create account")
    
    created = res.data[0]
    created["current_balance_paise"] = created["opening_balance_paise"]
    return created

