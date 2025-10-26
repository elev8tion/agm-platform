"""
Budget Limit model
Tracks budget limits and warnings
"""
from sqlalchemy import Column, String, Float, Boolean
from models.base import BaseModel


class BudgetLimit(BaseModel):
    """
    Budget limit entity

    Defines spending limits per user
    """

    __tablename__ = "budget_limits"

    # User association
    user_id = Column(String(36), unique=True, index=True, nullable=False)

    # Limits
    daily_limit_usd = Column(Float, nullable=True)
    monthly_limit_usd = Column(Float, nullable=True)
    total_limit_usd = Column(Float, nullable=True)

    # Warnings
    warning_threshold_percent = Column(Float, default=80.0)  # Warn at 80%

    # Status
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<BudgetLimit(id={self.id}, user_id={self.user_id}, daily=${self.daily_limit_usd})>"
