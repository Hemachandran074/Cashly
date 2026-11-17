from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.core.security import get_current_user, CurrentUser
from app.core.supabase_client import get_supabase_client
from app.schemas.category import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
async def list_categories(current_user: CurrentUser = Depends(get_current_user)):
    """
    Returns system categories and custom user categories.
    """
    client = get_supabase_client()
    res = client.table("categories") \
        .select("*") \
        .or_(f"is_system.eq.true,user_id.eq.{current_user.id}") \
        .order("name") \
        .execute()
    return res.data or []

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Creates a user-defined category.
    """
    client = get_supabase_client()
    data = payload.model_dump()
    data["user_id"] = current_user.id
    data["is_system"] = False

    res = client.table("categories").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create category")
    return res.data[0]

