from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse,
    TransactionStatus,
    TransactionDirection,
    TransactionKind,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
async def list_transactions(
    current_user: CurrentUser = Depends(get_current_user),
    account_id: Optional[UUID] = None,
    status: Optional[TransactionStatus] = None,
    direction: Optional[TransactionDirection] = None,
    kind: Optional[TransactionKind] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """
    List user transactions with optional filters, sorted newest first.
    """
    client = get_supabase_client()
    query = client.table("transactions") \
        .select("*") \
        .eq("user_id", current_user.id) \
        .is_("deleted_at", "null")

    if account_id:
        query = query.eq("account_id", str(account_id))
    if status:
        query = query.eq("status", status)
    if direction:
        query = query.eq("direction", direction)
    if kind:
        query = query.eq("kind", kind)
    if start_date:
        query = query.gte("local_date", str(start_date))
    if end_date:
        query = query.lte("local_date", str(end_date))

    res = query.order("occurred_at", desc=True).range(offset, offset + limit - 1).execute()
    return res.data or []

@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Creates a new manual or parsed transaction.
    """
    client = get_supabase_client()
    data = payload.model_dump(mode="json")
    data["user_id"] = current_user.id

    res = client.table("transactions").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create transaction")
    return res.data[0]

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    client = get_supabase_client()
    res = client.table("transactions") \
        .select("*") \
        .eq("id", str(transaction_id)) \
        .eq("user_id", current_user.id) \
        .is_("deleted_at", "null") \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return res.data[0]

@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID,
    payload: TransactionUpdate,
    current_user: CurrentUser = Depends(get_current_user)
):
    client = get_supabase_client()
    update_data = payload.model_dump(exclude_unset=True, mode="json")
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.utcnow().isoformat()
    res = client.table("transactions") \
        .update(update_data) \
        .eq("id", str(transaction_id)) \
        .eq("user_id", current_user.id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Transaction not found or update failed")
    return res.data[0]

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Soft-deletes a transaction by setting deleted_at timestamp.
    """
    client = get_supabase_client()
    res = client.table("transactions") \
        .update({"deleted_at": datetime.utcnow().isoformat()}) \
        .eq("id", str(transaction_id)) \
        .eq("user_id", current_user.id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return None

@router.post("/{transaction_id}/confirm", response_model=TransactionResponse)
async def confirm_transaction(
    transaction_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Confirms a pending (NEEDS_REVIEW) transaction so it becomes active in balance and analytics.
    """
    client = get_supabase_client()
    res = client.table("transactions") \
        .update({
            "status": "CONFIRMED",
            "updated_at": datetime.utcnow().isoformat(),
        }) \
        .eq("id", str(transaction_id)) \
        .eq("user_id", current_user.id) \
        .execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return res.data[0]

