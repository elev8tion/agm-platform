"""
Agent Job model
Tracks AI agent task execution
"""
from sqlalchemy import Column, String, Text, Float, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class AgentType(str, enum.Enum):
    """Agent type enum"""

    SEO_WRITER = "seo_writer"
    EMAIL_MARKETER = "email_marketer"
    SOCIAL_MEDIA = "social_media"
    ANALYST = "analyst"
    OPTIMIZER = "optimizer"


class JobStatus(str, enum.Enum):
    """Job status enum"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentJob(BaseModel):
    """
    Agent job entity

    Tracks execution of AI agent tasks with inputs, outputs, and costs
    """

    __tablename__ = "agent_jobs"

    agent_type = Column(
        SQLEnum(AgentType),
        nullable=False,
        index=True,
    )

    status = Column(
        SQLEnum(JobStatus),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )

    # Job data
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)

    # Execution tracking
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Error handling
    error_message = Column(Text)
    retry_count = Column(Float, default=0)

    # Cost tracking
    tokens_used = Column(Float, default=0)
    cost = Column(Float, default=0.0)

    # Relationships
    content_assets = relationship(
        "ContentAsset",
        back_populates="agent_job",
        cascade="all, delete-orphan",
    )

    budget_entries = relationship(
        "BudgetEntry",
        back_populates="agent_job",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<AgentJob(id={self.id}, type={self.agent_type}, status={self.status})>"

    @property
    def duration_seconds(self) -> float | None:
        """Calculate job duration in seconds"""
        if not self.started_at or not self.completed_at:
            return None
        delta = self.completed_at - self.started_at
        return delta.total_seconds()
