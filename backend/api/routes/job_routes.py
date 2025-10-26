"""
Job Management Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional

from schemas.job_schemas import JobStatusResponse, JobListResponse, QueueStatsResponse
from config.database import get_db
from api.dependencies import get_current_user
from services.job_service import job_service
from services.task_runner import task_runner
from loguru import logger


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """
    Get status of a specific job

    Returns job details including:
    - Current status (pending, running, completed, failed)
    - Progress percentage
    - Result (if completed)
    - Error message (if failed)
    - Execution timestamps
    """
    user_id = current_user.get("id") if current_user else None
    job = await job_service.get_job(db, job_id, user_id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    return JobStatusResponse(
        id=job.id,
        status=str(job.status.value),
        progress=job.progress,
        agent_type=str(job.agent_type.value),
        command=job.command,
        input_data=job.input_data,
        output_data=job.output_data,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at
    )


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None,
    status_filter: Optional[str] = Query(None, description="Filter by status", alias="status"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    List jobs for current user

    Supports filtering by:
    - Status (pending, running, completed, failed)
    - Agent type (seo_writer, email_marketer, cmo)

    Results ordered by creation time (newest first)
    """
    user_id = current_user.get("id") if current_user else "dev-user"

    jobs = await job_service.get_user_jobs(
        db=db,
        user_id=user_id,
        status=status_filter,
        agent_type=agent_type,
        limit=limit,
        offset=offset
    )

    return JobListResponse(
        jobs=[
            JobStatusResponse(
                id=job.id,
                status=str(job.status.value),
                progress=job.progress,
                agent_type=str(job.agent_type.value),
                command=job.command,
                input_data=job.input_data,
                output_data=job.output_data,
                error_message=job.error_message,
                created_at=job.created_at,
                started_at=job.started_at,
                completed_at=job.completed_at
            )
            for job in jobs
        ],
        total=len(jobs),
        limit=limit,
        offset=offset
    )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_job(
    job_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """
    Cancel a queued or running job

    Cancellation will:
    - Stop job execution if running
    - Remove from queue if queued
    - Mark as cancelled in database
    """
    user_id = current_user.get("id") if current_user else "dev-user"

    # Cancel in task runner if running
    task_runner.cancel_task(job_id)

    # Cancel in database
    cancelled = await job_service.cancel_job(
        db=db,
        job_id=job_id,
        user_id=user_id
    )

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found or cannot be cancelled"
        )


@router.get("/stats/queue", response_model=QueueStatsResponse)
async def get_queue_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Optional[dict], Depends(get_current_user)] = None
):
    """
    Get queue statistics

    Returns metrics about:
    - Jobs by status
    - Average execution time
    - Currently running tasks
    """
    stats = await job_service.get_queue_stats(db)

    return QueueStatsResponse(
        by_status=stats["by_status"],
        total=stats["total"],
        avg_execution_time_seconds=stats.get("avg_execution_time_seconds"),
        currently_running=task_runner.get_running_count()
    )
