"""
Pydantic schemas for agent requests and responses
"""
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime


# Request Models
class ResearchRequest(BaseModel):
    """Request for SEO research"""
    topic: str = Field(..., min_length=3, max_length=500)
    target_audience: Optional[str] = None
    depth: Optional[str] = Field("medium", pattern="^(shallow|medium|deep)$")

    model_config = {
        "json_schema_extra": {
            "example": {
                "topic": "AI marketing automation trends 2025",
                "target_audience": "Marketing managers at SaaS companies",
                "depth": "deep"
            }
        }
    }


class WriteRequest(BaseModel):
    """Request for SEO content writing"""
    brief: str = Field(..., min_length=10, max_length=2000)
    keyword: Optional[str] = None
    word_count: Optional[int] = Field(1500, ge=500, le=5000)
    tone: Optional[str] = Field("professional")
    include_faqs: Optional[bool] = Field(True)

    model_config = {
        "json_schema_extra": {
            "example": {
                "brief": "Write comprehensive guide on AI marketing tools",
                "keyword": "AI marketing automation",
                "word_count": 2000,
                "tone": "professional",
                "include_faqs": True
            }
        }
    }


class CreateEmailRequest(BaseModel):
    """Request for email creation"""
    brief: str = Field(..., min_length=10, max_length=1000)
    subject_line: Optional[str] = None
    tone: Optional[str] = Field("friendly")
    include_cta: Optional[bool] = Field(True)


class CreateSeriesRequest(BaseModel):
    """Request for email series creation"""
    brief: str = Field(..., min_length=10, max_length=1000)
    num_emails: Optional[int] = Field(5, ge=2, le=10)
    frequency: Optional[str] = Field("daily")
    goal: Optional[str] = Field("conversion")


# Response Models
class AgentResponseBase(BaseModel):
    """Base response for agent operations"""
    success: bool
    message: str
    job_id: str
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class JobResponse(BaseModel):
    """Response for job status"""
    id: int
    agent_type: str
    status: str
    progress: int = 0
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    tokens_used: float = 0
    cost: float = 0.0
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class JobListResponse(BaseModel):
    """Response for job list"""
    jobs: List[JobResponse]
    total: int
    limit: int
    offset: int
