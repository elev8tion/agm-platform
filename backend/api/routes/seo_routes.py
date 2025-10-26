"""
SEO Writer API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import ResearchRequest, WriteRequest, OptimizeRequest, ReviewRequest
from api.schemas.agent_responses import ResearchResponse, WriteResponse, OptimizeResponse, ReviewResponse
from config.database import get_db
from api.dependencies import get_current_user
from services.agent_service import agent_service
from models.agent_job import AgentType
from loguru import logger


router = APIRouter(prefix="/api/agents/seo", tags=["SEO Agent"])


@router.post("/research", response_model=ResearchResponse, status_code=status.HTTP_202_ACCEPTED)
async def research_topic(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)] = None
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
            agent_type=AgentType.SEO_WRITER,
            input_data={
                "command": "research",
                **request.model_dump()
            }
        )

        # Queue background task
        job_id = job.id
        async def execute_research():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job_by_id(session, job_id)

        background_tasks.add_task(execute_research)

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
    current_user: Annotated[dict, Depends(get_current_user)] = None
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
            agent_type=AgentType.SEO_WRITER,
            input_data={
                "command": "write",
                **request.model_dump()
            }
        )

        # Queue background task with job_id
        job_id = job.id
        async def execute_write():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job_by_id(session, job_id)

        background_tasks.add_task(execute_write)

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
    current_user: Annotated[dict, Depends(get_current_user)] = None
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
            agent_type=AgentType.SEO_WRITER,
            input_data={
                "command": "optimize",
                "url": str(request.url),
                "target_keyword": request.target_keyword
            }
        )

        # Queue background task with job_id
        job_id = job.id
        async def execute_optimize():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job_by_id(session, job_id)

        background_tasks.add_task(execute_optimize)

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
    current_user: Annotated[dict, Depends(get_current_user)] = None
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
            agent_type=AgentType.SEO_WRITER,
            input_data={
                "command": "review",
                **request.model_dump()
            }
        )

        # Queue background task with job_id
        job_id = job.id
        async def execute_review():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job_by_id(session, job_id)

        background_tasks.add_task(execute_review)

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
