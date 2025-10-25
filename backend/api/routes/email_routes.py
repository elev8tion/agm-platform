"""
Email Marketer API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from config.database import get_db
from schemas.agent_schemas import (
    CreateEmailRequest,
    CreateSeriesRequest,
    AgentResponseBase,
    JobResponse
)
from models.agent_job import AgentType
from services.agent_service import agent_service
from loguru import logger


router = APIRouter(prefix="/api/agents/email", tags=["Email Marketer"])


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


@router.post("/create", response_model=AgentResponseBase)
async def create_email(
    request: CreateEmailRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create a marketing email

    Creates a background job to generate email copy using AI.
    Returns immediately with job ID to track progress.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            agent_type=AgentType.EMAIL_MARKETER,
            input_data={
                "command": "create",
                **request.model_dump()
            }
        )

        background_tasks.add_task(execute_job_background, job.id)

        return AgentResponseBase(
            success=True,
            message="Email creation job created",
            job_id=str(job.id),
            status="pending"
        )

    except Exception as e:
        logger.error(f"Failed to create email job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/series", response_model=AgentResponseBase)
async def create_email_series(
    request: CreateSeriesRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Create an email series/sequence

    Creates a background job to generate multi-email campaign.
    Returns immediately with job ID to track progress.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            agent_type=AgentType.EMAIL_MARKETER,
            input_data={
                "command": "series",
                **request.model_dump()
            }
        )

        background_tasks.add_task(execute_job_background, job.id)

        return AgentResponseBase(
            success=True,
            message="Email series job created",
            job_id=str(job.id),
            status="pending"
        )

    except Exception as e:
        logger.error(f"Failed to create email series job: {e}")
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
