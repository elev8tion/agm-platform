"""
Budget Management Routes
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional
from datetime import datetime, timedelta

from schemas.budget_schemas import (
    SetBudgetLimitRequest,
    UsageSummaryResponse,
    BudgetStatusResponse,
    BudgetLimitResponse
)
from config.database import get_db
from api.dependencies import get_current_user
from services.budget_service import budget_service
from loguru import logger


router = APIRouter(prefix="/api/budget", tags=["Budget"])


@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None,
    period: str = Query("month", enum=["day", "week", "month", "all"])
):
    """
    Get usage summary for current user

    Returns cost and token usage for specified period.
    """
    user_id = current_user.get("id") if current_user else "dev-user"
    now = datetime.utcnow()

    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None

    summary = await budget_service.get_usage_summary(
        db=db,
        user_id=user_id,
        start_date=start_date
    )

    return UsageSummaryResponse(**summary, period=period)


@router.get("/status", response_model=BudgetStatusResponse)
async def get_budget_status(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """
    Check budget status for current user

    Returns whether user is within limits and current usage.
    """
    user_id = current_user.get("id") if current_user else "dev-user"

    status = await budget_service.check_budget_limit(
        db=db,
        user_id=user_id
    )

    return BudgetStatusResponse(**status)


@router.post("/limits", response_model=BudgetLimitResponse)
async def set_budget_limits(
    request: SetBudgetLimitRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """
    Set budget limits for current user

    Allows user to set their own spending limits.
    """
    user_id = current_user.get("id") if current_user else "dev-user"

    limit = await budget_service.set_budget_limit(
        db=db,
        user_id=user_id,
        daily_limit=request.daily_limit_usd,
        monthly_limit=request.monthly_limit_usd,
        total_limit=request.total_limit_usd,
        warning_threshold=request.warning_threshold_percent
    )

    return BudgetLimitResponse(
        daily_limit_usd=limit.daily_limit_usd,
        monthly_limit_usd=limit.monthly_limit_usd,
        total_limit_usd=limit.total_limit_usd,
        warning_threshold_percent=limit.warning_threshold_percent
    )


@router.get("/limits", response_model=BudgetLimitResponse)
async def get_budget_limits(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """Get current budget limits"""
    user_id = current_user.get("id") if current_user else "dev-user"

    from sqlalchemy import select
    from models.budget_limit import BudgetLimit

    result = await db.execute(
        select(BudgetLimit).where(BudgetLimit.user_id == user_id)
    )
    limit = result.scalar_one_or_none()

    if not limit:
        return BudgetLimitResponse(
            daily_limit_usd=None,
            monthly_limit_usd=None,
            total_limit_usd=None,
            warning_threshold_percent=80.0
        )

    return BudgetLimitResponse(
        daily_limit_usd=limit.daily_limit_usd,
        monthly_limit_usd=limit.monthly_limit_usd,
        total_limit_usd=limit.total_limit_usd,
        warning_threshold_percent=limit.warning_threshold_percent
    )
