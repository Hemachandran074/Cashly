from pydantic import BaseModel, Field, model_validator, ConfigDict
from typing import Optional, Literal
from datetime import datetime, date
from uuid import UUID

TransactionDirection = Literal['CREDIT', 'DEBIT']
TransactionKind = Literal['EXPENSE', 'INCOME', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'EXCHANGE_LEG']
PaymentMethod = Literal['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']
TransactionSource = Literal['SMS', 'MANUAL']
TransactionStatus = Literal['NEEDS_REVIEW', 'CONFIRMED']

class TransactionBase(BaseModel):
    account_id: UUID
    direction: TransactionDirection
    kind: TransactionKind
    amount_paise: int = Field(..., ge=0, description="Amount in integer paise (1 INR = 100 paise)")
    occurred_at: datetime
    tz_offset_minutes: int = 330
    local_date: Optional[date] = None
    payment_method: PaymentMethod = 'UPI'
    category_id: Optional[UUID] = None
    person_id: Optional[UUID] = None
    merchant_name: Optional[str] = None
    reference_id: Optional[str] = None
    note: Optional[str] = None
    source: TransactionSource = 'MANUAL'
    status: TransactionStatus = 'CONFIRMED'
    exchange_id: Optional[UUID] = None

    @model_validator(mode='after')
    def compute_local_date(self):
        if self.local_date is None:
            self.local_date = self.occurred_at.date()
        return self

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[UUID] = None
    direction: Optional[TransactionDirection] = None
    kind: Optional[TransactionKind] = None
    amount_paise: Optional[int] = Field(None, ge=0)
    occurred_at: Optional[datetime] = None
    tz_offset_minutes: Optional[int] = None
    local_date: Optional[date] = None
    payment_method: Optional[PaymentMethod] = None
    category_id: Optional[UUID] = None
    person_id: Optional[UUID] = None
    merchant_name: Optional[str] = None
    reference_id: Optional[str] = None
    note: Optional[str] = None
    status: Optional[TransactionStatus] = None

class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    dedupe_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
