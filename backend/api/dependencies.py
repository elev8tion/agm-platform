"""
Shared API Dependencies
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated, Optional
import jwt
import os

from config.database import get_db
# from models.user import User  # TODO: Import when User model is created


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None
) -> Optional[dict]:
    """
    Decode JWT token and return current user

    TODO: This is a placeholder until User model is implemented in Phase 1
    For now, returns None to allow development without authentication
    """
    if not credentials:
        # Allow unauthenticated access for development
        return None

    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET", "dev-secret-key"),
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        # TODO: Query User model when it exists
        # result = await db.execute(
        #     select(User).where(User.id == int(user_id))
        # )
        # user = result.scalar_one_or_none()
        #
        # if not user:
        #     raise HTTPException(
        #         status_code=status.HTTP_401_UNAUTHORIZED,
        #         detail="User not found"
        #     )
        #
        # return user

        # For now, return mock user dict
        return {"id": user_id, "email": "dev@example.com"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
