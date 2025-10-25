"""
Base model with common fields
All models inherit from this
"""
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
import uuid


Base = declarative_base()


class BaseModel(Base):
    """
    Abstract base model with common fields
    - id: String UUID primary key (SQLite compatible)
    - created_at: Timestamp when record was created
    - updated_at: Timestamp when record was last updated
    """

    __abstract__ = True

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
