from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt.exceptions import PyJWTError
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

security_scheme = HTTPBearer(auto_error=False)

class CurrentUser(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = "authenticated"

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
) -> CurrentUser:
    """
    Extracts and verifies Supabase JWT token from Authorization header.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        if settings.SUPABASE_JWT_SECRET:
            # Verify signature with Supabase JWT Secret
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Unverified claim extraction for local development when secret is not configured
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing user subject ('sub')",
            )

        return CurrentUser(
            id=user_id,
            email=payload.get("email"),
            role=payload.get("role", "authenticated"),
        )
    except PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
