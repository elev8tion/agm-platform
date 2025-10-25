"""
SEO Writer API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from config.database import get_db
from schemas.agent_schemas import (
    ResearchRequest,
    WriteRequest,
    AgentResponseBase,
    JobResponse
)
from models.agent_job import AgentType
from services.agent_service import agent_service
from loguru import logger


router = APIRouter(prefix="/api/agents/seo", tags=["SEO Writer"])


async def execute_job_background(job_id: int):
    """Background task to execute job"""
    from config.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        job = await agent_service.get_job(db, job_id)
        if job:
            try:
                await agent_service.execute_job(db, job)
            except Exception as e:
                logger.error(f"Background job {job_id} failed: {e}")


@router.post("/research", response_model=AgentResponseBase)
async def research_topic(
    request: ResearchRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Research a topic and generate content outline

    Creates a background job to research the topic using AI.
    Returns immediately with job ID to track progress.
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

        # Execute in background
        background_tasks.add_task(execute_job_background, job.id)

        return AgentResponseBase(
            success=True,
            message="Research job created",
            job_id=str(job.id),
            status="pending"
        )

    except Exception as e:
        logger.error(f"Failed to create research job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/write", response_model=AgentResponseBase)
async def write_content(
    request: WriteRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Write SEO-optimized content

    Creates a background job to write content using AI.
    Returns immediately with job ID to track progress.
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

        background_tasks.add_task(execute_job_background, job.id)

        return AgentResponseBase(
            success=True,
            message="Content writing job created",
            job_id=str(job.id),
            status="pending"
        )

    except Exception as e:
        logger.error(f"Failed to create writing job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job_status(
    job_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get job status and results"""
    job = await agent_service.get_job(db, job_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    return JobResponse.model_validate(job)
