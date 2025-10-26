"""
Budget Entry model
Tracks API costs and spending
"""
from sqlalchemy import Column, String, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class ResourceType(str, enum.Enum):
    """Resource type enum"""

    OPENAI_API = "openai_api"
    WEB_SEARCH = "web_search"
    FILE_SEARCH = "file_search"
    IMAGE_GENERATION = "image_generation"
    EMBEDDING = "embedding"


class BudgetEntry(BaseModel):
    """
    Budget entry entity

    Tracks individual API costs and resource usage
    """

    __tablename__ = "budget_entries"

    resource_type = Column(
        SQLEnum(ResourceType),
        nullable=False,
        index=True,
    )

    # Cost details
    cost = Column(Float, nullable=False)
    tokens_used = Column(Float, default=0)
    model_used = Column(String(100))

    # Token breakdown for chat completions
    prompt_tokens = Column(Float, default=0)
    completion_tokens = Column(Float, default=0)

    # Search usage
    web_search_calls = Column(Float, default=0)
    file_search_calls = Column(Float, default=0)

    # Context
    description = Column(String(500))
    user_id = Column(String(36), index=True, nullable=True)  # For user association

    # Foreign keys (SQLite uses String UUIDs)
    agent_job_id = Column(
        String(36),
        ForeignKey("agent_jobs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Relationships
    agent_job = relationship("AgentJob", back_populates="budget_entries")

    def __repr__(self):
        return f"<BudgetEntry(id={self.id}, type={self.resource_type}, cost=${self.cost:.4f})>"
