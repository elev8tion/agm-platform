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
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"
    DEAD = "dead"  # Moved to dead letter queue


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
    command = Column(String, nullable=True)  # Command name (research, write, etc.)

    # Priority and progress
    priority = Column(Float, default=5.0, index=True)  # 1-10, higher = more urgent
    progress = Column(Float, default=0)  # 0-100 percentage

    # Execution tracking
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Error handling
    error_message = Column(Text)
    retry_count = Column(Float, default=0)
    max_retries = Column(Float, default=3)

    # Cost tracking
    tokens_used = Column(Float, default=0)
    cost = Column(Float, default=0.0)

    # Metadata
    user_id = Column(String, nullable=True, index=True)  # For user association

    # Queue management (Document 10)
    scheduled_at = Column(DateTime, nullable=True)  # For delayed jobs
    deadline = Column(DateTime, nullable=True)  # Job must complete by this time
    depends_on_job_id = Column(String(36), nullable=True, index=True)  # Dependency
    worker_id = Column(String, nullable=True)  # Which worker is processing
    heartbeat_at = Column(DateTime, nullable=True)  # Last heartbeat
    queue_time_seconds = Column(Float, nullable=True)  # Time in queue
    execution_time_seconds = Column(Float, nullable=True)  # Execution duration
    last_error = Column(String, nullable=True)  # Last error message

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
