from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

AccountType = Literal['BANK', 'UPI', 'CASH', 'WALLET']

class AccountBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    opening_balance_paise: int = Field(0, description="Opening balance stored as integer paise")
    description: Optional[str] = None
    archived: bool = False

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    opening_balance_paise: Optional[int] = None
    description: Optional[str] = None
    archived: Optional[bool] = None

class AccountResponse(AccountBase):
    id: UUID
    user_id: UUID
    current_balance_paise: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
