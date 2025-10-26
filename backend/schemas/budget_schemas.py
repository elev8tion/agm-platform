"""
Budget Request and Response Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict


class SetBudgetLimitRequest(BaseModel):
    """Request model for setting budget limits"""
    daily_limit_usd: Optional[float] = Field(None, ge=0, description="Daily spending limit in USD")
    monthly_limit_usd: Optional[float] = Field(None, ge=0, description="Monthly spending limit in USD")
    total_limit_usd: Optional[float] = Field(None, ge=0, description="Total lifetime limit in USD")
    warning_threshold_percent: float = Field(80.0, ge=1, le=100, description="Warning threshold percentage")


class UsageSummaryResponse(BaseModel):
    """Response model for usage summary"""
    total_calls: int
    total_cost_usd: float
    total_tokens: float
    total_web_searches: float
    total_file_searches: float
    period: str = "all"


class BudgetStatusResponse(BaseModel):
    """Response model for budget status"""
    within_budget: bool
    violations: list[str] = []
    usage: Dict[str, float]
    limits: Dict[str, Optional[float]]
    message: Optional[str] = None


class BudgetLimitResponse(BaseModel):
    """Response model for budget limits"""
    daily_limit_usd: Optional[float]
    monthly_limit_usd: Optional[float]
    total_limit_usd: Optional[float]
    warning_threshold_percent: float
