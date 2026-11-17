from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.person import PersonCreate, PersonResponse

router = APIRouter(prefix="/people", tags=["People"])

@router.get("", response_model=List[PersonResponse])
async def list_people(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns people list along with computed ledger summary (given, received, outstanding).
    """
    client = get_supabase_client()
    people_res = client.table("people").select("*").eq("user_id", current_user.id).execute()
    people = people_res.data or []

    # Fetch confirmed transactions linked to people
    tx_res = client.table("transactions") \
        .select("person_id, direction, kind, amount_paise, occurred_at") \
        .eq("user_id", current_user.id) \
        .eq("status", "CONFIRMED") \
        .is_("deleted_at", "null") \
        .not_.is_("person_id", "null") \
        .execute()
    
    txs = tx_res.data or []

    # Map transactions per person
    person_stats = {}
    for tx in txs:
        p_id = tx["person_id"]
        stats = person_stats.setdefault(p_id, {
            "total_given_paise": 0,
            "total_received_paise": 0,
            "last_transaction_at": None,
        })

        kind = tx.get("kind")
        direction = tx.get("direction")
        amount = tx.get("amount_paise", 0)

        # Money given to person
        if direction == "DEBIT" and kind == "TRANSFER_SENT":
            stats["total_given_paise"] += amount
        # Money received from person
        elif direction == "CREDIT" and kind == "TRANSFER_RECEIVED":
            stats["total_received_paise"] += amount

        occurred_at = tx.get("occurred_at")
        if not stats["last_transaction_at"] or occurred_at > stats["last_transaction_at"]:
            stats["last_transaction_at"] = occurred_at

    result = []
    for p in people:
        stats = person_stats.get(p["id"], {
            "total_given_paise": 0,
            "total_received_paise": 0,
            "last_transaction_at": None,
        })
        given = stats["total_given_paise"]
        received = stats["total_received_paise"]
        
        p["total_given_paise"] = given
        p["total_received_paise"] = received
        p["outstanding_paise"] = given - received
        p["last_transaction_at"] = stats["last_transaction_at"]
        result.append(p)

    return result

@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    payload: PersonCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Creates a new counterparty (person or merchant).
    """
    client = get_supabase_client()
    data = payload.model_dump()
    data["user_id"] = current_user.id

    res = client.table("people").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create person")
    return res.data[0]

