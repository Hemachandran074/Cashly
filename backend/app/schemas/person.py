from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime
from uuid import UUID

PersonKind = Literal['PERSON', 'MERCHANT']

class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    kind: PersonKind = 'PERSON'
    aliases: List[str] = Field(default_factory=list)

class PersonCreate(PersonBase):
    pass

class PersonResponse(PersonBase):
    id: UUID
    user_id: UUID
    total_given_paise: int = 0
    total_received_paise: int = 0
    outstanding_paise: int = 0
    last_transaction_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
