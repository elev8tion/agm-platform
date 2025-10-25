"""
Pydantic request schemas for all agent endpoints
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List


class ResearchRequest(BaseModel):
    """Request model for SEO research command"""
    topic: str = Field(..., min_length=3, max_length=500, description="Research topic")
    target_audience: Optional[str] = Field(None, description="Target audience for content")
    depth: Optional[str] = Field("medium", description="Research depth: shallow, medium, deep")

    class Config:
        json_schema_extra = {
            "example": {
                "topic": "AI marketing automation trends 2025",
                "target_audience": "Marketing managers at SaaS companies",
                "depth": "deep"
            }
        }


class WriteRequest(BaseModel):
    """Request model for SEO content writing command"""
    brief: str = Field(..., min_length=10, max_length=2000, description="Content brief")
    keyword: Optional[str] = Field(None, description="Primary keyword to target")
    word_count: Optional[int] = Field(1500, ge=500, le=5000, description="Target word count")
    tone: Optional[str] = Field("professional", description="Content tone")
    include_faqs: Optional[bool] = Field(True, description="Include FAQ section")

    class Config:
        json_schema_extra = {
            "example": {
                "brief": "Write comprehensive guide on AI marketing tools",
                "keyword": "AI marketing automation",
                "word_count": 2000,
                "tone": "professional",
                "include_faqs": True
            }
        }


class OptimizeRequest(BaseModel):
    """Request model for content optimization command"""
    url: HttpUrl = Field(..., description="URL of content to optimize")
    target_keyword: Optional[str] = Field(None, description="Keyword to optimize for")

    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://example.com/blog/marketing-guide",
                "target_keyword": "marketing automation"
            }
        }


class ReviewRequest(BaseModel):
    """Request model for performance review command"""
    period_days: Optional[int] = Field(30, ge=1, le=365, description="Review period in days")
    content_type: Optional[str] = Field(None, description="Filter by content type")

    class Config:
        json_schema_extra = {
            "example": {
                "period_days": 90,
                "content_type": "blog"
            }
        }


class CreateEmailRequest(BaseModel):
    """Request model for single email creation"""
    brief: str = Field(..., min_length=10, max_length=1000, description="Email brief")
    subject_line: Optional[str] = Field(None, description="Email subject line")
    tone: Optional[str] = Field("friendly", description="Email tone")
    include_cta: Optional[bool] = Field(True, description="Include call-to-action")

    class Config:
        json_schema_extra = {
            "example": {
                "brief": "Announce new AI features in our platform",
                "subject_line": "🚀 New AI Features Just Dropped",
                "tone": "excited",
                "include_cta": True
            }
        }


class CreateSeriesRequest(BaseModel):
    """Request model for email series creation"""
    brief: str = Field(..., min_length=10, max_length=1000, description="Series brief")
    num_emails: Optional[int] = Field(5, ge=2, le=10, description="Number of emails in series")
    frequency: Optional[str] = Field("daily", description="Email frequency: daily, weekly, biweekly")
    goal: Optional[str] = Field("conversion", description="Series goal: conversion, education, engagement")

    class Config:
        json_schema_extra = {
            "example": {
                "brief": "Onboarding series for new AI platform users",
                "num_emails": 5,
                "frequency": "daily",
                "goal": "education"
            }
        }


class CMOAnalyzeRequest(BaseModel):
    """Request model for CMO strategic analysis"""
    focus_area: str = Field(..., description="Marketing area to analyze")
    timeframe: Optional[str] = Field("quarter", description="Analysis timeframe")
    include_competitors: Optional[bool] = Field(False, description="Include competitor analysis")

    class Config:
        json_schema_extra = {
            "example": {
                "focus_area": "content marketing ROI",
                "timeframe": "quarter",
                "include_competitors": True
            }
        }


class CMOReviewRequest(BaseModel):
    """Request model for CMO strategic review"""
    metrics: Optional[List[str]] = Field(None, description="Specific metrics to review")
    period_days: Optional[int] = Field(90, ge=1, le=365, description="Review period")

    class Config:
        json_schema_extra = {
            "example": {
                "metrics": ["traffic", "conversions", "engagement"],
                "period_days": 90
            }
        }
