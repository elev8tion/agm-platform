# Phase 2 Backend: Agent Endpoints

## Overview

This document provides complete implementation of FastAPI endpoints for all OpenAI Agents, porting the existing Python agents from the `market-ai` project to REST API endpoints with proper request/response validation, error handling, and OpenAI Agents SDK integration.

**Outcomes:**
- FastAPI routes for SEO Writer, Email Marketer, and CMO agents
- Pydantic models matching TypeScript interfaces
- OpenAI Agents SDK Runner.run() integration
- Comprehensive error handling and logging
- OpenAPI schema generation for frontend consumption

## Prerequisites

- Phase 1 completed (database, auth, project structure)
- Python 3.13+ installed
- OpenAI API key configured
- Vector Store created and ID set in environment
- Dependencies installed:
  ```bash
  pip install fastapi openai-agents pydantic sqlalchemy python-dotenv loguru
  ```

## Architecture

```
api/
├── routes/
│   ├── __init__.py
│   ├── seo_routes.py          # SEO Writer endpoints
│   ├── email_routes.py        # Email Marketer endpoints
│   └── cmo_routes.py          # CMO orchestrator endpoints
├── schemas/
│   ├── __init__.py
│   ├── agent_requests.py      # Request models
│   └── agent_responses.py     # Response models
└── dependencies.py            # Shared dependencies

agents/
├── __init__.py
├── seo_writer.py              # Ported from market-ai
├── email_marketer.py          # Ported from market-ai
├── cmo_agent.py              # Ported from market-ai
└── base.py                    # Base agent class

services/
├── __init__.py
└── agent_service.py           # Agent execution orchestration
```

## Step-by-Step Implementation

### Step 1: Create Base Agent Class

First, create a base class that all agents inherit from:

```python
# agents/base.py
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from openai import OpenAI
from loguru import logger
import os


class BaseAgent(ABC):
    """Base class for all OpenAI Agents"""

    def __init__(self, model: str = None, vector_store_id: str = None):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = model or os.getenv("DEFAULT_MODEL", "gpt-4o-mini")
        self.vector_store_id = vector_store_id or os.getenv("VECTOR_STORE_ID")

        if not self.vector_store_id:
            logger.warning(f"{self.__class__.__name__}: No vector store ID configured")

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the agent's primary function"""
        pass

    def get_tools(self) -> list:
        """Override to return agent-specific tools"""
        return []

    def get_system_prompt(self) -> str:
        """Override to return agent-specific system prompt"""
        return ""
```

### Step 2: Create Pydantic Request/Response Schemas

```python
# api/schemas/agent_requests.py
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from datetime import datetime


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
```

```python
# api/schemas/agent_responses.py
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
```

### Step 3: Create Agent Service Layer

```python
# services/agent_service.py
from typing import Dict, Any, Optional
from loguru import logger
from datetime import datetime
import asyncio

from agents.seo_writer import SEOWriter
from agents.email_marketer import EmailMarketer
from agents.cmo_agent import CMOAgent
from db.session import get_db
from db.models import AgentJob, User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class AgentService:
    """Service layer for agent execution and job management"""

    def __init__(self):
        self.seo_writer = SEOWriter()
        self.email_marketer = EmailMarketer()
        self.cmo_agent = CMOAgent()

    async def create_job(
        self,
        db: AsyncSession,
        user_id: int,
        agent_type: str,
        command: str,
        parameters: Dict[str, Any]
    ) -> AgentJob:
        """Create a new agent job"""
        job = AgentJob(
            user_id=user_id,
            agent_type=agent_type,
            command=command,
            parameters=parameters,
            status="queued",
            progress=0
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"Created job {job.id} for user {user_id}: {agent_type}/{command}")
        return job

    async def execute_seo_research(
        self,
        db: AsyncSession,
        job: AgentJob,
        topic: str,
        target_audience: Optional[str] = None,
        depth: str = "medium"
    ) -> Dict[str, Any]:
        """Execute SEO research command"""
        try:
            # Update job status
            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            # Execute agent
            result = await self.seo_writer.research(
                topic=topic,
                target_audience=target_audience,
                depth=depth
            )

            # Update job with results
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.result = result
            await db.commit()

            return result

        except Exception as e:
            logger.error(f"SEO research failed for job {job.id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            raise

    async def execute_seo_write(
        self,
        db: AsyncSession,
        job: AgentJob,
        brief: str,
        keyword: Optional[str] = None,
        word_count: int = 1500,
        tone: str = "professional",
        include_faqs: bool = True
    ) -> Dict[str, Any]:
        """Execute SEO write command"""
        try:
            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            result = await self.seo_writer.write(
                brief=brief,
                keyword=keyword,
                word_count=word_count,
                tone=tone,
                include_faqs=include_faqs,
                job_id=job.id  # For progress updates
            )

            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.result = result
            await db.commit()

            return result

        except Exception as e:
            logger.error(f"SEO write failed for job {job.id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            raise

    async def execute_seo_optimize(
        self,
        db: AsyncSession,
        job: AgentJob,
        url: str,
        target_keyword: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute SEO optimize command"""
        try:
            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            result = await self.seo_writer.optimize(
                url=url,
                target_keyword=target_keyword
            )

            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.result = result
            await db.commit()

            return result

        except Exception as e:
            logger.error(f"SEO optimize failed for job {job.id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            raise

    async def execute_email_create(
        self,
        db: AsyncSession,
        job: AgentJob,
        brief: str,
        subject_line: Optional[str] = None,
        tone: str = "friendly",
        include_cta: bool = True
    ) -> Dict[str, Any]:
        """Execute email creation command"""
        try:
            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            result = await self.email_marketer.create_email(
                brief=brief,
                subject_line=subject_line,
                tone=tone,
                include_cta=include_cta
            )

            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.result = result
            await db.commit()

            return result

        except Exception as e:
            logger.error(f"Email creation failed for job {job.id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            raise

    async def execute_email_series(
        self,
        db: AsyncSession,
        job: AgentJob,
        brief: str,
        num_emails: int = 5,
        frequency: str = "daily",
        goal: str = "conversion"
    ) -> Dict[str, Any]:
        """Execute email series creation command"""
        try:
            job.status = "running"
            job.started_at = datetime.utcnow()
            await db.commit()

            result = await self.email_marketer.create_series(
                brief=brief,
                num_emails=num_emails,
                frequency=frequency,
                goal=goal,
                job_id=job.id
            )

            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress = 100
            job.result = result
            await db.commit()

            return result

        except Exception as e:
            logger.error(f"Email series creation failed for job {job.id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()
            raise


# Singleton instance
agent_service = AgentService()
```

### Step 4: Implement SEO Routes

```python
# api/routes/seo_routes.py
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import ResearchRequest, WriteRequest, OptimizeRequest, ReviewRequest
from api.schemas.agent_responses import ResearchResponse, WriteResponse, OptimizeResponse, ReviewResponse
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user
from services.agent_service import agent_service
from loguru import logger


router = APIRouter(prefix="/api/agents/seo", tags=["SEO Agent"])


@router.post("/research", response_model=ResearchResponse, status_code=status.HTTP_202_ACCEPTED)
async def research_topic(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Research a topic and generate content outline

    This endpoint queues a research job that:
    - Performs web search for the topic
    - Analyzes top-ranking content
    - Generates comprehensive outline
    - Identifies target keywords

    Returns immediately with job_id. Use WebSocket or polling to get results.
    """
    try:
        # Create job
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="seo_writer",
            command="research",
            parameters=request.model_dump()
        )

        # Queue background task
        background_tasks.add_task(
            agent_service.execute_seo_research,
            db=db,
            job=job,
            topic=request.topic,
            target_audience=request.target_audience,
            depth=request.depth
        )

        return ResearchResponse(
            success=True,
            message=f"Research job queued for topic: {request.topic}",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue research job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue research job: {str(e)}"
        )


@router.post("/write", response_model=WriteResponse, status_code=status.HTTP_202_ACCEPTED)
async def write_content(
    request: WriteRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Write SEO-optimized content

    This endpoint queues a content writing job that:
    - Generates draft with GPT-4o-mini (cost optimization)
    - Polishes with GPT-4o (quality enhancement)
    - Optimizes for target keyword
    - Includes meta description, FAQs, internal links

    Long-running task (8-12 minutes). Returns job_id immediately.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="seo_writer",
            command="write",
            parameters=request.model_dump()
        )

        background_tasks.add_task(
            agent_service.execute_seo_write,
            db=db,
            job=job,
            brief=request.brief,
            keyword=request.keyword,
            word_count=request.word_count,
            tone=request.tone,
            include_faqs=request.include_faqs
        )

        return WriteResponse(
            success=True,
            message=f"Content writing job queued. Estimated time: 8-12 minutes",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue write job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue write job: {str(e)}"
        )


@router.post("/optimize", response_model=OptimizeResponse, status_code=status.HTTP_202_ACCEPTED)
async def optimize_content(
    request: OptimizeRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Analyze and optimize existing content

    This endpoint:
    - Fetches content from URL
    - Analyzes SEO factors
    - Provides optimization recommendations
    - Suggests improvements for rankings
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="seo_writer",
            command="optimize",
            parameters=request.model_dump()
        )

        background_tasks.add_task(
            agent_service.execute_seo_optimize,
            db=db,
            job=job,
            url=str(request.url),
            target_keyword=request.target_keyword
        )

        return OptimizeResponse(
            success=True,
            message=f"Content optimization job queued for: {request.url}",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue optimize job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue optimize job: {str(e)}"
        )


@router.post("/review", response_model=ReviewResponse, status_code=status.HTTP_202_ACCEPTED)
async def review_performance(
    request: ReviewRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Review content performance

    Analyzes:
    - Google Analytics data
    - Google Search Console metrics
    - Content engagement
    - Ranking changes
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="seo_writer",
            command="review",
            parameters=request.model_dump()
        )

        # Note: Review implementation depends on GA/GSC integration
        # Placeholder for now - will be implemented with tools

        return ReviewResponse(
            success=True,
            message=f"Performance review job queued for {request.period_days} days",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue review job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue review job: {str(e)}"
        )
```

### Step 5: Implement Email Routes

```python
# api/routes/email_routes.py
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import CreateEmailRequest, CreateSeriesRequest
from api.schemas.agent_responses import EmailResponse, SeriesResponse
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user
from services.agent_service import agent_service
from loguru import logger


router = APIRouter(prefix="/api/agents/email", tags=["Email Marketing Agent"])


@router.post("/create", response_model=EmailResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_email(
    request: CreateEmailRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Create a single marketing email

    Generates:
    - Compelling subject line
    - Engaging email body
    - Clear call-to-action
    - Preview text

    Uses brand voice from Vector Store context.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="email_marketer",
            command="create",
            parameters=request.model_dump()
        )

        background_tasks.add_task(
            agent_service.execute_email_create,
            db=db,
            job=job,
            brief=request.brief,
            subject_line=request.subject_line,
            tone=request.tone,
            include_cta=request.include_cta
        )

        return EmailResponse(
            success=True,
            message="Email creation job queued",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue email creation job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue email creation job: {str(e)}"
        )


@router.post("/series", response_model=SeriesResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_series(
    request: CreateSeriesRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Create email series/sequence

    Generates multi-email sequence with:
    - Cohesive narrative arc
    - Progressive value delivery
    - Consistent branding
    - Strategic CTAs

    Perfect for onboarding, nurture campaigns, product launches.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="email_marketer",
            command="series",
            parameters=request.model_dump()
        )

        background_tasks.add_task(
            agent_service.execute_email_series,
            db=db,
            job=job,
            brief=request.brief,
            num_emails=request.num_emails,
            frequency=request.frequency,
            goal=request.goal
        )

        return SeriesResponse(
            success=True,
            message=f"Email series job queued ({request.num_emails} emails)",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue series creation job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue series creation job: {str(e)}"
        )
```

### Step 6: Implement CMO Routes

```python
# api/routes/cmo_routes.py
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import CMOAnalyzeRequest, CMOReviewRequest
from api.schemas.agent_responses import CMOResponse
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user
from services.agent_service import agent_service
from loguru import logger


router = APIRouter(prefix="/api/agents/cmo", tags=["CMO Agent"])


@router.post("/analyze", response_model=CMOResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_strategy(
    request: CMOAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Strategic marketing analysis

    CMO-level insights on:
    - Channel performance
    - Budget allocation
    - Campaign effectiveness
    - Market opportunities

    Orchestrates SEO Writer and Email Marketer for comprehensive view.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="cmo",
            command="analyze",
            parameters=request.model_dump()
        )

        # CMO agent implementation will be in next phase
        # For now, return placeholder

        return CMOResponse(
            success=True,
            message=f"Strategic analysis queued for: {request.focus_area}",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue CMO analysis job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue CMO analysis job: {str(e)}"
        )


@router.post("/review", response_model=CMOResponse, status_code=status.HTTP_202_ACCEPTED)
async def strategic_review(
    request: CMOReviewRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Comprehensive marketing review

    Executive summary of:
    - Overall marketing performance
    - ROI by channel
    - Strategic recommendations
    - Action items
    """
    try:
        job = await agent_service.create_job(
            db=db,
            user_id=current_user.id,
            agent_type="cmo",
            command="review",
            parameters=request.model_dump()
        )

        return CMOResponse(
            success=True,
            message=f"Strategic review queued for {request.period_days} days",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue CMO review job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue CMO review job: {str(e)}"
        )
```

### Step 7: Create Shared Dependencies

```python
# api/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated
import jwt
import os

from db.session import get_db
from db.models import User


security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Decode JWT token and return current user
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )

        result = await db.execute(
            select(User).where(User.id == int(user_id))
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
```

### Step 8: Register Routes in Main App

```python
# main.py (updated)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from db.session import engine, Base
from api.routes import seo_routes, email_routes, cmo_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Agentic Marketing Dashboard API",
    description="AI Marketing Employees powered by OpenAI Agents",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration for Netlify frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        os.getenv("FRONTEND_URL", "https://your-netlify-site.netlify.app")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register agent routes
app.include_router(seo_routes.router)
app.include_router(email_routes.router)
app.include_router(cmo_routes.router)


@app.get("/")
async def root():
    return {
        "message": "Agentic Marketing Dashboard API",
        "version": "2.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Database Integration

All agent jobs are persisted in the `agent_jobs` table (created in Phase 1):

```sql
-- Query job status
SELECT id, status, progress, created_at, started_at, completed_at
FROM agent_jobs
WHERE user_id = :user_id
ORDER BY created_at DESC
LIMIT 20;

-- Get job result
SELECT result, error_message
FROM agent_jobs
WHERE id = :job_id AND user_id = :user_id;

-- Clean up old completed jobs (7+ days old)
DELETE FROM agent_jobs
WHERE status IN ('completed', 'failed')
  AND completed_at < NOW() - INTERVAL '7 days';
```

## Testing

### 1. Test Research Endpoint

```bash
# Get auth token first
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.access_token')

# Queue research job
curl -X POST http://localhost:8000/api/agents/seo/research \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI marketing automation trends 2025",
    "target_audience": "Marketing managers",
    "depth": "deep"
  }' | jq
```

### 2. Test Write Endpoint

```bash
curl -X POST http://localhost:8000/api/agents/seo/write \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Write comprehensive guide on AI marketing",
    "keyword": "AI marketing automation",
    "word_count": 2000,
    "tone": "professional",
    "include_faqs": true
  }' | jq
```

### 3. Test Email Creation

```bash
curl -X POST http://localhost:8000/api/agents/email/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Announce new AI features",
    "subject_line": "🚀 New AI Features",
    "tone": "excited",
    "include_cta": true
  }' | jq
```

### 4. Check Job Status

```bash
# Replace {job_id} with actual ID from response
curl http://localhost:8000/api/jobs/{job_id}/status \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Troubleshooting

### Issue: "Invalid authentication token"

**Solution:** Ensure JWT_SECRET is set in environment:
```bash
export JWT_SECRET="your-secret-key-here"
```

### Issue: "No vector store ID configured"

**Solution:** Create OpenAI Vector Store and set ID:
```bash
export VECTOR_STORE_ID="vs_xxxxxxxxxxxxx"
```

### Issue: Background task not executing

**Solution:** Check logs for errors:
```bash
tail -f logs/app.log | grep ERROR
```

Ensure database connection is working:
```bash
python -c "from db.session import engine; print('DB OK')"
```

### Issue: OpenAI API rate limits

**Solution:** Implement exponential backoff in agents:
```python
from openai import RateLimitError
import asyncio

try:
    result = await client.chat.completions.create(...)
except RateLimitError:
    await asyncio.sleep(60)  # Wait 1 minute
    # Retry logic
```

## Performance Considerations

### 1. Database Connection Pooling

Configure in `db/session.py`:
```python
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,        # Max connections
    max_overflow=40,     # Extra connections if needed
    pool_pre_ping=True   # Verify connections before use
)
```

### 2. Async Job Execution

All agent methods should be async:
```python
async def execute_seo_research(...):
    # Use asyncio.gather for parallel operations
    results = await asyncio.gather(
        self.web_search(topic),
        self.analyze_competitors(topic),
        self.generate_outline(topic)
    )
```

### 3. Response Caching

Cache common research results:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
async def cached_web_search(query: str):
    # Expensive operation
    pass
```

### 4. Request Validation

Use Pydantic validators:
```python
from pydantic import validator

class WriteRequest(BaseModel):
    brief: str

    @validator('brief')
    def validate_brief(cls, v):
        if len(v.split()) < 10:
            raise ValueError('Brief must be at least 10 words')
        return v
```

## Next Steps

Phase 2 foundation is complete. Next documents:

1. **07_BACKGROUND_TASKS.md** - Job queue and task execution
2. **08_WEBSOCKET_SETUP.md** - Real-time progress streaming
3. **09_BUDGET_SYSTEM.md** - Cost tracking and enforcement
4. **10_JOB_QUEUE.md** - Advanced queue management

**Integration Points:**
- Background tasks will execute jobs created by these endpoints
- WebSockets will stream progress updates during execution
- Budget system will track costs per API call
- Job queue will manage concurrent executions

**Testing Checklist:**
- [ ] All endpoints return 202 Accepted
- [ ] Jobs created in database
- [ ] Background tasks execute
- [ ] Errors logged properly
- [ ] OpenAPI docs generated (`/docs`)
- [ ] CORS allows Netlify origin
