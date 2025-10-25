"""
Content Asset model
Represents content created by AI agents
"""
from sqlalchemy import Column, String, Text, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class ContentType(str, enum.Enum):
    """Content type enum"""

    BLOG = "blog"
    EMAIL = "email"
    SOCIAL = "social"
    VIDEO_SCRIPT = "video_script"
    AD_COPY = "ad_copy"
    LANDING_PAGE = "landing_page"


class ContentStatus(str, enum.Enum):
    """Content status enum"""

    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ContentAsset(BaseModel):
    """
    Content asset entity

    Represents content created by AI agents (blog posts, emails, etc.)
    """

    __tablename__ = "content_assets"

    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    content_type = Column(
        SQLEnum(ContentType),
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(ContentStatus),
        nullable=False,
        default=ContentStatus.DRAFT,
        index=True,
    )

    # Metadata (SEO, keywords, etc.) - using content_metadata to avoid SQLAlchemy reserved name
    content_metadata = Column(JSON, default={})

    # Foreign keys (SQLite uses String UUIDs)
    campaign_id = Column(
        String(36),
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    agent_job_id = Column(
        String(36),
        ForeignKey("agent_jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    campaign = relationship("Campaign", back_populates="content_assets")
    agent_job = relationship("AgentJob", back_populates="content_assets")

    def __repr__(self):
        return f"<ContentAsset(id={self.id}, title='{self.title}', type={self.content_type})>"
