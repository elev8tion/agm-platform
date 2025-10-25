# Phase 2 Backend: Background Tasks & Job Queue

## Overview

This document implements a robust background task execution system for long-running agent operations. The system handles job queuing, execution, progress tracking, and result persistence using FastAPI BackgroundTasks, database-backed queue, and optional Redis for distributed processing.

**Outcomes:**
- Production-ready job queue system
- Background task execution with progress tracking
- Graceful error handling and retry logic
- WebSocket integration for real-time updates
- Job history and cleanup automation

## Prerequisites

- Phase 1 completed (database setup)
- 06_AGENT_ENDPOINTS.md implemented
- Python 3.13+ installed
- PostgreSQL running
- Redis (optional, for distributed queue)

**Dependencies:**
```bash
pip install fastapi sqlalchemy asyncio redis aioredis celery loguru
```

## Architecture

```
Background Task Flow:
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ POST /api/agents/seo/write
       ▼
┌─────────────────┐
│  FastAPI Route  │
│  - Validate     │
│  - Create Job   │
│  - Queue Task   │
└──────┬──────────┘
       │ Return 202 + job_id
       │
       ▼
┌─────────────────┐
│ Background Task │
│  - Update status│
│  - Execute agent│
│  - Save result  │
│  - Emit events  │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Database      │
│  agent_jobs     │
│  - status       │
│  - progress     │
│  - result       │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│   WebSocket     │
│  - Emit updates │
│  - Stream logs  │
└─────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create Job Service

```python
# services/job_service.py
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, or_
from loguru import logger
import json

from db.models import AgentJob, User
from api.websocket import emit_job_update


class JobService:
    """Service for managing agent jobs"""

    async def create_job(
        self,
        db: AsyncSession,
        user_id: int,
        agent_type: str,
        command: str,
        parameters: Dict[str, Any],
        priority: int = 5
    ) -> AgentJob:
        """
        Create a new agent job

        Args:
            db: Database session
            user_id: User ID creating the job
            agent_type: Type of agent (seo_writer, email_marketer, cmo)
            command: Command to execute (research, write, etc.)
            parameters: Command parameters
            priority: Job priority (1-10, higher = more urgent)

        Returns:
            Created AgentJob instance
        """
        job = AgentJob(
            user_id=user_id,
            agent_type=agent_type,
            command=command,
            parameters=parameters,
            status="queued",
            progress=0,
            priority=priority,
            created_at=datetime.utcnow()
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(
            f"Created job {job.id}: {agent_type}/{command} for user {user_id}"
        )

        # Emit WebSocket event
        await emit_job_update(job.id, {
            "status": "queued",
            "progress": 0,
            "message": "Job created and queued"
        })

        return job

    async def get_job(
        self,
        db: AsyncSession,
        job_id: int,
        user_id: Optional[int] = None
    ) -> Optional[AgentJob]:
        """
        Get job by ID

        Args:
            db: Database session
            job_id: Job ID
            user_id: Optional user ID for authorization check

        Returns:
            AgentJob instance or None
        """
        query = select(AgentJob).where(AgentJob.id == job_id)

        if user_id:
            query = query.where(AgentJob.user_id == user_id)

        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def update_job_status(
        self,
        db: AsyncSession,
        job_id: int,
        status: str,
        progress: Optional[int] = None,
        result: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ):
        """
        Update job status and emit WebSocket event

        Args:
            db: Database session
            job_id: Job ID
            status: New status (running, completed, failed)
            progress: Progress percentage (0-100)
            result: Job result data
            error_message: Error message if failed
        """
        update_data = {"status": status}

        if progress is not None:
            update_data["progress"] = progress

        if result is not None:
            update_data["result"] = result

        if error_message is not None:
            update_data["error_message"] = error_message

        # Set timestamps based on status
        if status == "running" and not update_data.get("started_at"):
            update_data["started_at"] = datetime.utcnow()
        elif status in ("completed", "failed"):
            update_data["completed_at"] = datetime.utcnow()

        # Update database
        await db.execute(
            update(AgentJob)
            .where(AgentJob.id == job_id)
            .values(**update_data)
        )
        await db.commit()

        # Emit WebSocket event
        event_data = {
            "status": status,
            "progress": progress or 0,
        }

        if result:
            event_data["result"] = result
        if error_message:
            event_data["error"] = error_message

        await emit_job_update(job_id, event_data)

        logger.info(f"Job {job_id} updated: {status} ({progress}%)")

    async def get_user_jobs(
        self,
        db: AsyncSession,
        user_id: int,
        status: Optional[str] = None,
        agent_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[AgentJob]:
        """
        Get jobs for a user with optional filtering

        Args:
            db: Database session
            user_id: User ID
            status: Filter by status
            agent_type: Filter by agent type
            limit: Max results
            offset: Pagination offset

        Returns:
            List of AgentJob instances
        """
        query = select(AgentJob).where(AgentJob.user_id == user_id)

        if status:
            query = query.where(AgentJob.status == status)

        if agent_type:
            query = query.where(AgentJob.agent_type == agent_type)

        query = (
            query.order_by(AgentJob.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        result = await db.execute(query)
        return result.scalars().all()

    async def get_next_queued_job(
        self,
        db: AsyncSession
    ) -> Optional[AgentJob]:
        """
        Get next job to execute from queue (highest priority, oldest first)

        Returns:
            AgentJob instance or None if queue empty
        """
        query = (
            select(AgentJob)
            .where(AgentJob.status == "queued")
            .order_by(
                AgentJob.priority.desc(),  # Higher priority first
                AgentJob.created_at.asc()   # Older first (FIFO)
            )
            .limit(1)
        )

        result = await db.execute(query)
        job = result.scalar_one_or_none()

        if job:
            # Mark as running
            await self.update_job_status(
                db=db,
                job_id=job.id,
                status="running",
                progress=0
            )

        return job

    async def cancel_job(
        self,
        db: AsyncSession,
        job_id: int,
        user_id: int
    ) -> bool:
        """
        Cancel a queued or running job

        Args:
            db: Database session
            job_id: Job ID
            user_id: User ID (for authorization)

        Returns:
            True if cancelled, False if not found or not cancellable
        """
        job = await self.get_job(db, job_id, user_id)

        if not job:
            return False

        if job.status not in ("queued", "running"):
            logger.warning(f"Cannot cancel job {job_id}: status is {job.status}")
            return False

        await self.update_job_status(
            db=db,
            job_id=job_id,
            status="cancelled",
            error_message="Cancelled by user"
        )

        logger.info(f"Job {job_id} cancelled by user {user_id}")
        return True

    async def cleanup_old_jobs(
        self,
        db: AsyncSession,
        days: int = 7
    ) -> int:
        """
        Delete completed/failed jobs older than specified days

        Args:
            db: Database session
            days: Age threshold in days

        Returns:
            Number of jobs deleted
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        result = await db.execute(
            delete(AgentJob)
            .where(
                and_(
                    AgentJob.status.in_(["completed", "failed", "cancelled"]),
                    AgentJob.completed_at < cutoff_date
                )
            )
        )

        await db.commit()
        deleted_count = result.rowcount

        logger.info(f"Cleaned up {deleted_count} old jobs")
        return deleted_count

    async def get_queue_stats(
        self,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get queue statistics

        Returns:
            Dictionary with queue metrics
        """
        from sqlalchemy import func

        # Count by status
        status_counts = await db.execute(
            select(
                AgentJob.status,
                func.count(AgentJob.id).label("count")
            )
            .group_by(AgentJob.status)
        )

        stats = {
            "by_status": {row.status: row.count for row in status_counts},
            "total": sum(row.count for row in status_counts)
        }

        # Average execution time for completed jobs
        avg_time = await db.execute(
            select(
                func.avg(
                    func.extract(
                        'epoch',
                        AgentJob.completed_at - AgentJob.started_at
                    )
                ).label("avg_seconds")
            )
            .where(
                and_(
                    AgentJob.status == "completed",
                    AgentJob.started_at.isnot(None),
                    AgentJob.completed_at.isnot(None)
                )
            )
        )

        avg_seconds = avg_time.scalar()
        stats["avg_execution_time_seconds"] = (
            round(avg_seconds, 2) if avg_seconds else None
        )

        return stats


# Singleton instance
job_service = JobService()
```

### Step 2: Create Task Runner

```python
# services/task_runner.py
from typing import Dict, Any, Callable, Awaitable
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import asyncio
import traceback

from services.job_service import job_service
from services.agent_service import agent_service
from db.models import AgentJob
from api.websocket import emit_job_update


class TaskRunner:
    """Handles background task execution for agent jobs"""

    def __init__(self):
        self.running_tasks: Dict[int, asyncio.Task] = {}

    async def execute_job(
        self,
        db: AsyncSession,
        job: AgentJob
    ):
        """
        Execute a single agent job

        Args:
            db: Database session
            job: AgentJob instance to execute
        """
        job_id = job.id

        try:
            logger.info(f"Starting execution of job {job_id}: {job.agent_type}/{job.command}")

            # Update status to running
            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status="running",
                progress=10
            )

            # Route to appropriate agent based on type and command
            result = await self._route_job(db, job)

            # Update status to completed
            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status="completed",
                progress=100,
                result=result
            )

            logger.info(f"Job {job_id} completed successfully")

        except asyncio.CancelledError:
            logger.warning(f"Job {job_id} was cancelled")
            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status="cancelled",
                error_message="Task cancelled"
            )
            raise

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            logger.error(f"Job {job_id} failed: {error_msg}")
            logger.error(traceback.format_exc())

            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status="failed",
                error_message=error_msg
            )

        finally:
            # Remove from running tasks
            if job_id in self.running_tasks:
                del self.running_tasks[job_id]

    async def _route_job(
        self,
        db: AsyncSession,
        job: AgentJob
    ) -> Dict[str, Any]:
        """
        Route job to appropriate agent executor

        Args:
            db: Database session
            job: AgentJob to execute

        Returns:
            Job result dictionary
        """
        params = job.parameters

        # SEO Writer routes
        if job.agent_type == "seo_writer":
            if job.command == "research":
                return await agent_service.execute_seo_research(
                    db=db,
                    job=job,
                    topic=params["topic"],
                    target_audience=params.get("target_audience"),
                    depth=params.get("depth", "medium")
                )

            elif job.command == "write":
                return await agent_service.execute_seo_write(
                    db=db,
                    job=job,
                    brief=params["brief"],
                    keyword=params.get("keyword"),
                    word_count=params.get("word_count", 1500),
                    tone=params.get("tone", "professional"),
                    include_faqs=params.get("include_faqs", True)
                )

            elif job.command == "optimize":
                return await agent_service.execute_seo_optimize(
                    db=db,
                    job=job,
                    url=params["url"],
                    target_keyword=params.get("target_keyword")
                )

        # Email Marketer routes
        elif job.agent_type == "email_marketer":
            if job.command == "create":
                return await agent_service.execute_email_create(
                    db=db,
                    job=job,
                    brief=params["brief"],
                    subject_line=params.get("subject_line"),
                    tone=params.get("tone", "friendly"),
                    include_cta=params.get("include_cta", True)
                )

            elif job.command == "series":
                return await agent_service.execute_email_series(
                    db=db,
                    job=job,
                    brief=params["brief"],
                    num_emails=params.get("num_emails", 5),
                    frequency=params.get("frequency", "daily"),
                    goal=params.get("goal", "conversion")
                )

        # CMO routes (placeholder)
        elif job.agent_type == "cmo":
            # CMO implementation in future phase
            return {
                "message": "CMO agent not yet implemented",
                "command": job.command
            }

        raise ValueError(f"Unknown agent type/command: {job.agent_type}/{job.command}")

    async def queue_task(
        self,
        db: AsyncSession,
        job: AgentJob
    ):
        """
        Queue a background task for execution

        Args:
            db: Database session
            job: AgentJob to queue
        """
        task = asyncio.create_task(self.execute_job(db, job))
        self.running_tasks[job.id] = task

        logger.info(f"Queued task for job {job.id}")

    async def cancel_task(self, job_id: int) -> bool:
        """
        Cancel a running task

        Args:
            job_id: Job ID to cancel

        Returns:
            True if cancelled, False if not found
        """
        task = self.running_tasks.get(job_id)

        if not task:
            return False

        task.cancel()
        logger.info(f"Cancelled task for job {job_id}")
        return True

    def get_running_count(self) -> int:
        """Get number of currently running tasks"""
        return len(self.running_tasks)

    def is_job_running(self, job_id: int) -> bool:
        """Check if a job is currently running"""
        return job_id in self.running_tasks


# Singleton instance
task_runner = TaskRunner()
```

### Step 3: Create Progress Update Mechanism

```python
# services/progress_tracker.py
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from services.job_service import job_service


class ProgressTracker:
    """Helper for tracking job progress within agent execution"""

    def __init__(self, db: AsyncSession, job_id: int):
        self.db = db
        self.job_id = job_id
        self.current_progress = 0

    async def update(
        self,
        progress: int,
        message: Optional[str] = None
    ):
        """
        Update job progress

        Args:
            progress: Progress percentage (0-100)
            message: Optional progress message
        """
        if progress < 0 or progress > 100:
            logger.warning(f"Invalid progress value: {progress}")
            return

        self.current_progress = progress

        await job_service.update_job_status(
            db=self.db,
            job_id=self.job_id,
            status="running",
            progress=progress
        )

        if message:
            logger.info(f"Job {self.job_id} progress: {progress}% - {message}")

    async def increment(
        self,
        amount: int,
        message: Optional[str] = None
    ):
        """
        Increment progress by amount

        Args:
            amount: Amount to increment
            message: Optional progress message
        """
        new_progress = min(self.current_progress + amount, 100)
        await self.update(new_progress, message)

    async def set_stage(
        self,
        stage: str,
        progress: int
    ):
        """
        Set named stage with progress

        Args:
            stage: Stage name (e.g., "Researching", "Drafting", "Polishing")
            progress: Progress percentage for this stage
        """
        await self.update(progress, f"Stage: {stage}")
```

### Step 4: Update Agent Service to Use Progress Tracker

```python
# services/agent_service.py (updated execute methods)
from services.progress_tracker import ProgressTracker

class AgentService:
    # ... existing code ...

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
        """Execute SEO write command with progress tracking"""
        tracker = ProgressTracker(db, job.id)

        try:
            # Stage 1: Research (0-20%)
            await tracker.set_stage("Researching topic", 10)
            research_data = await self.seo_writer.research(
                topic=brief,
                depth="medium"
            )
            await tracker.update(20, "Research completed")

            # Stage 2: Outline (20-30%)
            await tracker.set_stage("Creating outline", 25)
            outline = await self.seo_writer.create_outline(
                research_data,
                keyword
            )
            await tracker.update(30, "Outline created")

            # Stage 3: Draft (30-60%)
            await tracker.set_stage("Writing draft", 40)
            draft = await self.seo_writer.write_draft(
                outline,
                word_count,
                tone
            )
            await tracker.update(60, "Draft completed")

            # Stage 4: Polish (60-80%)
            await tracker.set_stage("Polishing content", 70)
            polished = await self.seo_writer.polish(draft)
            await tracker.update(80, "Content polished")

            # Stage 5: SEO optimization (80-100%)
            await tracker.set_stage("Optimizing for SEO", 90)
            final_content = await self.seo_writer.optimize_seo(
                polished,
                keyword,
                include_faqs
            )
            await tracker.update(100, "SEO optimization completed")

            return {
                "content": final_content["content"],
                "word_count": final_content["word_count"],
                "seo_score": final_content.get("seo_score", 0.0),
                "meta_description": final_content.get("meta_description"),
                "title": final_content.get("title")
            }

        except Exception as e:
            logger.error(f"SEO write failed for job {job.id}: {e}")
            raise
```

### Step 5: Create Job Status Endpoints

```python
# api/routes/job_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional, List

from api.schemas.job_responses import JobStatusResponse, JobListResponse, QueueStatsResponse
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user
from services.job_service import job_service
from services.task_runner import task_runner
from loguru import logger


router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get status of a specific job

    Returns job details including:
    - Current status (queued, running, completed, failed)
    - Progress percentage
    - Result (if completed)
    - Error message (if failed)
    - Execution timestamps
    """
    job = await job_service.get_job(db, job_id, current_user.id)

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )

    return JobStatusResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        agent_type=job.agent_type,
        command=job.command,
        parameters=job.parameters,
        result=job.result,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at
    )


@router.get("/", response_model=JobListResponse)
async def list_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status: Optional[str] = Query(None, description="Filter by status"),
    agent_type: Optional[str] = Query(None, description="Filter by agent type"),
    limit: int = Query(50, ge=1, le=100, description="Max results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    List jobs for current user

    Supports filtering by:
    - Status (queued, running, completed, failed)
    - Agent type (seo_writer, email_marketer, cmo)

    Results ordered by creation time (newest first)
    """
    jobs = await job_service.get_user_jobs(
        db=db,
        user_id=current_user.id,
        status=status,
        agent_type=agent_type,
        limit=limit,
        offset=offset
    )

    return JobListResponse(
        jobs=[
            JobStatusResponse(
                id=job.id,
                status=job.status,
                progress=job.progress,
                agent_type=job.agent_type,
                command=job.command,
                parameters=job.parameters,
                result=job.result,
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
    job_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Cancel a queued or running job

    Cancellation will:
    - Stop job execution if running
    - Remove from queue if queued
    - Mark as cancelled in database
    """
    # Cancel in task runner if running
    task_runner.cancel_task(job_id)

    # Cancel in database
    cancelled = await job_service.cancel_job(
        db=db,
        job_id=job_id,
        user_id=current_user.id
    )

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found or cannot be cancelled"
        )


@router.get("/stats/queue", response_model=QueueStatsResponse)
async def get_queue_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
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
```

### Step 6: Create Job Response Schemas

```python
# api/schemas/job_responses.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class JobStatusResponse(BaseModel):
    """Response model for job status"""
    id: int
    status: str
    progress: int
    agent_type: str
    command: str
    parameters: Dict[str, Any]
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Response model for job list"""
    jobs: List[JobStatusResponse]
    total: int
    limit: int
    offset: int


class QueueStatsResponse(BaseModel):
    """Response model for queue statistics"""
    by_status: Dict[str, int]
    total: int
    avg_execution_time_seconds: Optional[float] = None
    currently_running: int
```

### Step 7: Register Job Routes

```python
# main.py (add to route registration)
from api.routes import job_routes

app.include_router(job_routes.router)
```

## Database Integration

### Job State Transitions

```sql
-- Valid state transitions
queued → running → completed
queued → running → failed
queued → cancelled
running → cancelled

-- Query jobs by state
SELECT id, agent_type, command, status, progress
FROM agent_jobs
WHERE user_id = :user_id
  AND status = 'running'
ORDER BY started_at ASC;

-- Find stuck jobs (running > 1 hour)
SELECT id, agent_type, command, started_at
FROM agent_jobs
WHERE status = 'running'
  AND started_at < NOW() - INTERVAL '1 hour';

-- Cleanup completed jobs older than 7 days
DELETE FROM agent_jobs
WHERE status IN ('completed', 'failed', 'cancelled')
  AND completed_at < NOW() - INTERVAL '7 days';
```

## Testing

### 1. Test Job Creation and Execution

```python
# test_background_tasks.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

@pytest.mark.asyncio
async def test_create_and_execute_job(client: AsyncClient, auth_headers: dict):
    # Create job
    response = await client.post(
        "/api/agents/seo/research",
        headers=auth_headers,
        json={"topic": "AI marketing", "depth": "medium"}
    )
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    # Wait briefly
    await asyncio.sleep(1)

    # Check status
    response = await client.get(
        f"/api/jobs/{job_id}/status",
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["status"] in ("queued", "running")
```

### 2. Test Progress Updates

```bash
# Start long-running job
curl -X POST http://localhost:8000/api/agents/seo/write \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"brief": "Write about AI", "word_count": 2000}' | jq -r '.job_id'

# Poll for updates
JOB_ID=123
watch -n 2 "curl -s http://localhost:8000/api/jobs/$JOB_ID/status \
  -H 'Authorization: Bearer $TOKEN' | jq '.progress, .status'"
```

### 3. Test Job Cancellation

```bash
# Cancel job
curl -X DELETE http://localhost:8000/api/jobs/$JOB_ID \
  -H "Authorization: Bearer $TOKEN"

# Verify cancelled
curl http://localhost:8000/api/jobs/$JOB_ID/status \
  -H "Authorization: Bearer $TOKEN" | jq '.status'
```

## Troubleshooting

### Issue: Jobs stuck in "running" state

**Cause:** Task crashed without updating database

**Solution:** Add health check task:
```python
# tasks/health_check.py
async def check_stuck_jobs():
    """Mark stuck jobs as failed"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AgentJob)
            .where(
                and_(
                    AgentJob.status == "running",
                    AgentJob.started_at < datetime.utcnow() - timedelta(hours=1)
                )
            )
        )

        for job in result.scalars():
            await job_service.update_job_status(
                db=db,
                job_id=job.id,
                status="failed",
                error_message="Job timeout - exceeded 1 hour"
            )
```

### Issue: Memory leaks with long-running tasks

**Solution:** Implement task cleanup:
```python
async def execute_job(self, db: AsyncSession, job: AgentJob):
    try:
        # ... execution ...
    finally:
        # Force garbage collection
        import gc
        gc.collect()

        # Close any open connections
        await db.close()
```

### Issue: Database connection pool exhausted

**Solution:** Use connection pooling best practices:
```python
# db/session.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_recycle=3600,  # Recycle connections after 1 hour
    pool_pre_ping=True   # Test connections before use
)
```

## Performance Considerations

### 1. Limit Concurrent Tasks

```python
# services/task_runner.py
MAX_CONCURRENT_TASKS = 10

async def queue_task(self, db: AsyncSession, job: AgentJob):
    while self.get_running_count() >= MAX_CONCURRENT_TASKS:
        await asyncio.sleep(1)  # Wait for slot

    await super().queue_task(db, job)
```

### 2. Use Redis for Distributed Queue (Optional)

```python
# services/redis_queue.py
import aioredis
from typing import Optional

class RedisQueue:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)

    async def enqueue(self, job_id: int, priority: int = 5):
        """Add job to Redis queue"""
        await self.redis.zadd(
            "job_queue",
            {str(job_id): priority}
        )

    async def dequeue(self) -> Optional[int]:
        """Get next job from queue"""
        result = await self.redis.zpopmax("job_queue")
        if result:
            return int(result[0][0])
        return None
```

### 3. Implement Retry Logic

```python
async def execute_with_retry(
    self,
    func: Callable,
    max_retries: int = 3,
    backoff: int = 5
):
    """Execute function with exponential backoff retry"""
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = backoff * (2 ** attempt)
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {wait_time}s")
            await asyncio.sleep(wait_time)
```

## Next Steps

With background tasks implemented, proceed to:

1. **08_WEBSOCKET_SETUP.md** - Real-time progress streaming to frontend
2. **09_BUDGET_SYSTEM.md** - Cost tracking and enforcement
3. **10_JOB_QUEUE.md** - Advanced queue management features

**Key Integration Points:**
- WebSocket events emitted during status updates
- Budget checks before job execution
- Queue prioritization based on user tier
- Rate limiting per user/organization

**Production Checklist:**
- [ ] Task timeout handling implemented
- [ ] Stuck job detection running
- [ ] Connection pool sized appropriately
- [ ] Retry logic configured
- [ ] Old job cleanup scheduled
- [ ] Monitoring/alerting configured
