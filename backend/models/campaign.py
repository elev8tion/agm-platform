"""
Campaign model
Represents marketing campaigns
"""
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class CampaignStatus(str, enum.Enum):
    """Campaign status enum"""

    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Campaign(BaseModel):
    """
    Marketing campaign entity

    Tracks campaigns with budgets, dates, and performance metrics
    """

    __tablename__ = "campaigns"

    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000))
    status = Column(
        SQLEnum(CampaignStatus),
        nullable=False,
        default=CampaignStatus.DRAFT,
        index=True,
    )

    # Budget and spend
    budget = Column(Float, nullable=False, default=0.0)
    spend = Column(Float, nullable=False, default=0.0)

    # Dates
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)

    # Performance metrics (updated by analytics)
    impressions = Column(Float, default=0.0)
    clicks = Column(Float, default=0.0)
    conversions = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)  # Return on investment

    # Relationships
    content_assets = relationship(
        "ContentAsset",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Campaign(id={self.id}, name='{self.name}', status={self.status})>"

    @property
    def budget_remaining(self) -> float:
        """Calculate remaining budget"""
        return self.budget - self.spend

    @property
    def budget_used_percentage(self) -> float:
        """Calculate percentage of budget used"""
        if self.budget == 0:
            return 0.0
        return (self.spend / self.budget) * 100
