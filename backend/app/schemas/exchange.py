from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

ExchangeDirection = Literal['DIGITAL_TO_CASH', 'CASH_TO_DIGITAL']

class ExchangeCreate(BaseModel):
    digital_account_id: UUID
    cash_account_id: UUID
    direction: ExchangeDirection
    amount_paise: int = Field(..., gt=0, description="Amount exchanged in integer paise")
    person_id: Optional[UUID] = None
    occurred_at: datetime
    note: Optional[str] = None

class ExchangeResponse(ExchangeCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
