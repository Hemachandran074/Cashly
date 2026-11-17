from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

CategoryKind = Literal['EXPENSE', 'INCOME']

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = Field('tag', max_length=50)
    kind: CategoryKind = 'EXPENSE'

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: UUID
    user_id: Optional[UUID] = None
    is_system: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
