from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from datetime import datetime
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.exchange import ExchangeCreate, ExchangeResponse

router = APIRouter(prefix="/exchanges", tags=["Exchanges"])

@router.post("", response_model=ExchangeResponse, status_code=status.HTTP_201_CREATED)
async def create_exchange(
    payload: ExchangeCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Creates a single exchange with two linked opposite transaction legs:
    - digital account leg (DEBIT/CREDIT)
    - cash account leg (CREDIT/DEBIT)
    Neither leg is counted as income or expense in cash flow analytics.
    """
    client = get_supabase_client()
    exchange_data = payload.model_dump(mode="json")
    exchange_data["user_id"] = current_user.id

    # 1. Create exchange master row
    exc_res = client.table("exchanges").insert(exchange_data).execute()
    if not exc_res.data:
        raise HTTPException(status_code=400, detail="Failed to record exchange")

    exchange = exc_res.data[0]
    exchange_id = exchange["id"]
    amount = payload.amount_paise
    occurred_at_str = payload.occurred_at.isoformat()
    local_date_str = payload.occurred_at.date().isoformat()

    # 2. Determine leg directions
    if payload.direction == "DIGITAL_TO_CASH":
        digital_dir = "DEBIT"
        cash_dir = "CREDIT"
    else:
        digital_dir = "CREDIT"
        cash_dir = "DEBIT"

    # 3. Create the two linked legs
    digital_leg = {
        "user_id": current_user.id,
        "account_id": str(payload.digital_account_id),
        "direction": digital_dir,
        "kind": "EXCHANGE_LEG",
        "amount_paise": amount,
        "occurred_at": occurred_at_str,
        "local_date": local_date_str,
        "payment_method": "UPI",
        "person_id": str(payload.person_id) if payload.person_id else None,
        "note": f"Exchange: {payload.note or ''}".strip(),
        "source": "MANUAL",
        "status": "CONFIRMED",
        "exchange_id": exchange_id,
    }

    cash_leg = {
        "user_id": current_user.id,
        "account_id": str(payload.cash_account_id),
        "direction": cash_dir,
        "kind": "EXCHANGE_LEG",
        "amount_paise": amount,
        "occurred_at": occurred_at_str,
        "local_date": local_date_str,
        "payment_method": "CASH",
        "person_id": str(payload.person_id) if payload.person_id else None,
        "note": f"Exchange: {payload.note or ''}".strip(),
        "source": "MANUAL",
        "status": "CONFIRMED",
        "exchange_id": exchange_id,
    }

    client.table("transactions").insert([digital_leg, cash_leg]).execute()
    return exchange

