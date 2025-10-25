"""
Pydantic response schemas for all agent endpoints
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class AgentResponseBase(BaseModel):
    """Base response for all agent commands"""
    success: bool = Field(..., description="Whether operation succeeded")
    message: str = Field(..., description="Human-readable message")
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Job status: queued, running, completed, failed")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Job creation timestamp")


class ResearchResponse(AgentResponseBase):
    """Response model for research command"""
    outline: Optional[List[str]] = Field(None, description="Content outline")
    keywords: Optional[List[str]] = Field(None, description="Recommended keywords")
    sources: Optional[List[str]] = Field(None, description="Research sources")


class WriteResponse(AgentResponseBase):
    """Response model for write command"""
    content: Optional[str] = Field(None, description="Generated content")
    word_count: Optional[int] = Field(None, description="Final word count")
    seo_score: Optional[float] = Field(None, description="SEO optimization score")


class OptimizeResponse(AgentResponseBase):
    """Response model for optimize command"""
    recommendations: Optional[List[str]] = Field(None, description="Optimization recommendations")
    current_score: Optional[float] = Field(None, description="Current SEO score")
    potential_score: Optional[float] = Field(None, description="Potential score after optimization")


class ReviewResponse(AgentResponseBase):
    """Response model for review command"""
    summary: Optional[str] = Field(None, description="Performance summary")
    metrics: Optional[Dict[str, Any]] = Field(None, description="Performance metrics")
    insights: Optional[List[str]] = Field(None, description="Key insights")


class EmailResponse(AgentResponseBase):
    """Response model for email creation"""
    subject: Optional[str] = Field(None, description="Email subject line")
    body: Optional[str] = Field(None, description="Email body content")
    preview_text: Optional[str] = Field(None, description="Preview text")


class SeriesResponse(AgentResponseBase):
    """Response model for email series creation"""
    emails: Optional[List[Dict[str, str]]] = Field(None, description="Series emails")
    schedule: Optional[List[str]] = Field(None, description="Recommended send schedule")


class CMOResponse(AgentResponseBase):
    """Response model for CMO commands"""
    analysis: Optional[str] = Field(None, description="Strategic analysis")
    recommendations: Optional[List[str]] = Field(None, description="Strategic recommendations")
    action_items: Optional[List[str]] = Field(None, description="Actionable next steps")
