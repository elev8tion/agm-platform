# Phase 2 Backend: Advanced Job Queue Management

## Overview

This document implements an advanced job queue system with priority scheduling, concurrency control, worker pools, retry logic, and comprehensive job lifecycle management. The system ensures efficient resource utilization and fair distribution of agent workloads.

**Outcomes:**
- Priority-based job scheduling
- Concurrent worker pool management
- Automatic retry with exponential backoff
- Job dependencies and chaining
- Dead letter queue for failed jobs
- Real-time queue metrics and monitoring
- Cleanup automation

## Prerequisites

- Phase 1 completed (database setup)
- 06_AGENT_ENDPOINTS.md implemented
- 07_BACKGROUND_TASKS.md implemented
- 08_WEBSOCKET_SETUP.md implemented
- 09_BUDGET_SYSTEM.md implemented
- Python 3.13+ installed
- Redis (optional, for distributed queue)

**Dependencies:**
```bash
pip install asyncio aioredis redis loguru apscheduler
```

## Architecture

```
Queue Architecture:
┌──────────────────┐
│  Job Submission  │
│  - Validate      │
│  - Set priority  │
│  - Enqueue       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Priority Queue  │
│  - Sort by prio  │
│  - FIFO per prio │
│  - Deadlines     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Worker Pool     │
│  - Max workers   │
│  - Load balance  │
│  - Scaling       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Task Execution  │
│  - Run job       │
│  - Track metrics │
│  - Handle errors │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌──────────┐
│Success │  │  Failure │
│        │  │  - Retry │
│        │  │  - DLQ   │
└────────┘  └──────────┘
```

## Step-by-Step Implementation

### Step 1: Enhance Job Model

```python
# db/models.py (enhance AgentJob model)
from sqlalchemy import Column, Integer, String, JSON, DateTime, Enum as SQLEnum
import enum

class JobPriority(enum.IntEnum):
    """Job priority levels"""
    LOWEST = 1
    LOW = 3
    NORMAL = 5
    HIGH = 7
    CRITICAL = 10


class JobStatus(enum.Enum):
    """Job status states"""
    PENDING = "pending"
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"
    DEAD = "dead"  # Moved to dead letter queue


# Update AgentJob model
class AgentJob(Base):
    __tablename__ = "agent_jobs"

    # ... existing fields ...

    # Priority and scheduling
    priority = Column(Integer, default=5, index=True)  # 1-10
    scheduled_at = Column(DateTime, nullable=True)  # For delayed jobs
    deadline = Column(DateTime, nullable=True)  # Job must complete by this time

    # Retry logic
    max_retries = Column(Integer, default=3)
    retry_count = Column(Integer, default=0)
    last_error = Column(String, nullable=True)

    # Dependencies
    depends_on_job_id = Column(Integer, ForeignKey("agent_jobs.id"), nullable=True)
    depends_on = relationship("AgentJob", remote_side=[id])

    # Worker tracking
    worker_id = Column(String, nullable=True)  # Which worker is processing
    heartbeat_at = Column(DateTime, nullable=True)  # Last heartbeat

    # Timing
    queue_time_seconds = Column(Float, nullable=True)  # Time in queue
    execution_time_seconds = Column(Float, nullable=True)  # Execution duration

    # Indexes for efficient queries
    __table_args__ = (
        Index('ix_jobs_queue_priority', 'status', 'priority', 'created_at'),
        Index('ix_jobs_worker', 'worker_id', 'status'),
        Index('ix_jobs_dependency', 'depends_on_job_id'),
    )
```

### Step 2: Create Queue Manager

```python
# services/queue_manager.py
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_, func
from loguru import logger
import asyncio
import uuid

from db.models import AgentJob, JobStatus, JobPriority
from services.job_service import job_service
from api.websocket import emit_job_update


class QueueManager:
    """Advanced job queue manager with priority scheduling"""

    def __init__(
        self,
        max_concurrent_jobs: int = 10,
        worker_heartbeat_interval: int = 30,  # seconds
        stale_job_threshold: int = 300  # 5 minutes
    ):
        self.max_concurrent_jobs = max_concurrent_jobs
        self.worker_heartbeat_interval = worker_heartbeat_interval
        self.stale_job_threshold = stale_job_threshold
        self.worker_id = f"worker-{uuid.uuid4().hex[:8]}"

        logger.info(f"QueueManager initialized: worker_id={self.worker_id}")

    async def enqueue(
        self,
        db: AsyncSession,
        job: AgentJob,
        priority: int = JobPriority.NORMAL,
        scheduled_at: Optional[datetime] = None,
        deadline: Optional[datetime] = None,
        depends_on_job_id: Optional[int] = None
    ):
        """
        Add job to queue with scheduling options

        Args:
            db: Database session
            job: Job to enqueue
            priority: Job priority (1-10)
            scheduled_at: When to run (None = immediate)
            deadline: Must complete by this time
            depends_on_job_id: Job must wait for this job to complete
        """
        # Validate priority
        if not 1 <= priority <= 10:
            raise ValueError(f"Invalid priority: {priority}. Must be 1-10")

        # Set scheduling parameters
        job.priority = priority
        job.scheduled_at = scheduled_at
        job.deadline = deadline
        job.depends_on_job_id = depends_on_job_id

        # Determine initial status
        if scheduled_at and scheduled_at > datetime.utcnow():
            job.status = JobStatus.PENDING.value
        elif depends_on_job_id:
            # Check if dependency is completed
            dep_job = await job_service.get_job(db, depends_on_job_id)
            if not dep_job or dep_job.status != JobStatus.COMPLETED.value:
                job.status = JobStatus.PENDING.value
            else:
                job.status = JobStatus.QUEUED.value
        else:
            job.status = JobStatus.QUEUED.value

        await db.commit()
        await db.refresh(job)

        logger.info(
            f"Job {job.id} enqueued: priority={priority}, "
            f"status={job.status}, scheduled_at={scheduled_at}"
        )

        await emit_job_update(job.id, {
            "status": job.status,
            "priority": priority,
            "message": "Job added to queue"
        })

    async def dequeue(
        self,
        db: AsyncSession
    ) -> Optional[AgentJob]:
        """
        Get next job to execute from queue

        Selection criteria (in order):
        1. Highest priority
        2. Past deadline (urgent)
        3. Oldest (FIFO within priority)

        Returns:
            AgentJob or None if queue empty
        """
        now = datetime.utcnow()

        # Query for next eligible job
        query = (
            select(AgentJob)
            .where(
                and_(
                    AgentJob.status == JobStatus.QUEUED.value,
                    or_(
                        AgentJob.scheduled_at.is_(None),
                        AgentJob.scheduled_at <= now
                    ),
                    # No active dependency
                    or_(
                        AgentJob.depends_on_job_id.is_(None),
                        # Dependency completed
                        AgentJob.depends_on.has(status=JobStatus.COMPLETED.value)
                    )
                )
            )
            .order_by(
                # Past deadline first (most urgent)
                (AgentJob.deadline < now).desc(),
                # Then by priority (highest first)
                AgentJob.priority.desc(),
                # Then FIFO (oldest first)
                AgentJob.created_at.asc()
            )
            .limit(1)
        )

        result = await db.execute(query)
        job = result.scalar_one_or_none()

        if not job:
            return None

        # Claim job for this worker
        job.status = JobStatus.RUNNING.value
        job.started_at = datetime.utcnow()
        job.worker_id = self.worker_id
        job.heartbeat_at = datetime.utcnow()

        # Calculate queue time
        if job.created_at:
            queue_time = (job.started_at - job.created_at).total_seconds()
            job.queue_time_seconds = queue_time

        await db.commit()
        await db.refresh(job)

        logger.info(
            f"Dequeued job {job.id} (priority={job.priority}, "
            f"queued_for={job.queue_time_seconds:.1f}s)"
        )

        await emit_job_update(job.id, {
            "status": JobStatus.RUNNING.value,
            "worker_id": self.worker_id,
            "message": "Job started"
        })

        return job

    async def heartbeat(
        self,
        db: AsyncSession,
        job_id: int
    ):
        """
        Update job heartbeat to indicate worker is alive

        Args:
            db: Database session
            job_id: Job ID
        """
        await db.execute(
            update(AgentJob)
            .where(AgentJob.id == job_id)
            .values(heartbeat_at=datetime.utcnow())
        )
        await db.commit()

    async def complete_job(
        self,
        db: AsyncSession,
        job_id: int,
        result: Dict[str, Any]
    ):
        """
        Mark job as completed and trigger dependent jobs

        Args:
            db: Database session
            job_id: Job ID
            result: Job result data
        """
        job = await job_service.get_job(db, job_id)

        if not job:
            return

        job.status = JobStatus.COMPLETED.value
        job.completed_at = datetime.utcnow()
        job.result = result

        # Calculate execution time
        if job.started_at:
            exec_time = (job.completed_at - job.started_at).total_seconds()
            job.execution_time_seconds = exec_time

        await db.commit()

        logger.info(
            f"Job {job_id} completed in {job.execution_time_seconds:.1f}s"
        )

        # Queue dependent jobs
        await self._queue_dependent_jobs(db, job_id)

        await emit_job_update(job_id, {
            "status": JobStatus.COMPLETED.value,
            "result": result,
            "execution_time_seconds": job.execution_time_seconds,
            "message": "Job completed successfully"
        })

    async def fail_job(
        self,
        db: AsyncSession,
        job_id: int,
        error_message: str,
        retry: bool = True
    ):
        """
        Mark job as failed and optionally retry

        Args:
            db: Database session
            job_id: Job ID
            error_message: Error description
            retry: Whether to retry job
        """
        job = await job_service.get_job(db, job_id)

        if not job:
            return

        job.last_error = error_message
        job.retry_count += 1

        # Determine if should retry
        should_retry = retry and job.retry_count < job.max_retries

        if should_retry:
            # Calculate backoff delay (exponential)
            backoff_seconds = min(2 ** job.retry_count * 60, 3600)  # Max 1 hour
            retry_at = datetime.utcnow() + timedelta(seconds=backoff_seconds)

            job.status = JobStatus.RETRYING.value
            job.scheduled_at = retry_at

            logger.warning(
                f"Job {job_id} failed (attempt {job.retry_count}/{job.max_retries}). "
                f"Retrying in {backoff_seconds}s"
            )

            await emit_job_update(job_id, {
                "status": JobStatus.RETRYING.value,
                "error": error_message,
                "retry_count": job.retry_count,
                "retry_at": retry_at.isoformat(),
                "message": f"Retrying in {backoff_seconds}s"
            })

        else:
            # Move to dead letter queue
            job.status = JobStatus.DEAD.value
            job.completed_at = datetime.utcnow()

            logger.error(
                f"Job {job_id} moved to dead letter queue after "
                f"{job.retry_count} retries"
            )

            await emit_job_update(job_id, {
                "status": JobStatus.DEAD.value,
                "error": error_message,
                "message": "Job failed and moved to dead letter queue"
            })

        await db.commit()

    async def _queue_dependent_jobs(
        self,
        db: AsyncSession,
        completed_job_id: int
    ):
        """
        Queue jobs that depend on completed job

        Args:
            db: Database session
            completed_job_id: ID of completed job
        """
        # Find jobs waiting for this one
        result = await db.execute(
            select(AgentJob).where(
                and_(
                    AgentJob.depends_on_job_id == completed_job_id,
                    AgentJob.status == JobStatus.PENDING.value
                )
            )
        )

        dependent_jobs = result.scalars().all()

        for job in dependent_jobs:
            # Check if scheduled time has passed
            now = datetime.utcnow()
            if not job.scheduled_at or job.scheduled_at <= now:
                job.status = JobStatus.QUEUED.value
                await db.commit()

                logger.info(f"Queued dependent job {job.id}")

                await emit_job_update(job.id, {
                    "status": JobStatus.QUEUED.value,
                    "message": f"Dependency {completed_job_id} completed"
                })

    async def recover_stale_jobs(
        self,
        db: AsyncSession
    ):
        """
        Recover jobs with stale heartbeats (worker crashed)

        Returns:
            Number of jobs recovered
        """
        threshold = datetime.utcnow() - timedelta(seconds=self.stale_job_threshold)

        result = await db.execute(
            select(AgentJob).where(
                and_(
                    AgentJob.status == JobStatus.RUNNING.value,
                    AgentJob.heartbeat_at < threshold
                )
            )
        )

        stale_jobs = result.scalars().all()
        recovered = 0

        for job in stale_jobs:
            logger.warning(
                f"Recovering stale job {job.id} (worker={job.worker_id}, "
                f"last_heartbeat={job.heartbeat_at})"
            )

            # Reset to queued for retry
            job.status = JobStatus.QUEUED.value
            job.worker_id = None
            job.started_at = None
            await db.commit()

            recovered += 1

            await emit_job_update(job.id, {
                "status": JobStatus.QUEUED.value,
                "message": "Recovered from stale worker"
            })

        if recovered > 0:
            logger.info(f"Recovered {recovered} stale jobs")

        return recovered

    async def get_queue_stats(
        self,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Get comprehensive queue statistics

        Returns:
            Queue metrics dictionary
        """
        # Count by status
        status_counts = await db.execute(
            select(
                AgentJob.status,
                func.count(AgentJob.id).label("count")
            )
            .group_by(AgentJob.status)
        )

        by_status = {row.status: row.count for row in status_counts}

        # Average queue time
        avg_queue_time = await db.execute(
            select(func.avg(AgentJob.queue_time_seconds))
            .where(AgentJob.queue_time_seconds.isnot(None))
        )

        # Average execution time
        avg_exec_time = await db.execute(
            select(func.avg(AgentJob.execution_time_seconds))
            .where(AgentJob.execution_time_seconds.isnot(None))
        )

        # Priority distribution of queued jobs
        priority_dist = await db.execute(
            select(
                AgentJob.priority,
                func.count(AgentJob.id).label("count")
            )
            .where(AgentJob.status == JobStatus.QUEUED.value)
            .group_by(AgentJob.priority)
        )

        # Jobs past deadline
        past_deadline = await db.execute(
            select(func.count(AgentJob.id))
            .where(
                and_(
                    AgentJob.deadline < datetime.utcnow(),
                    AgentJob.status.in_([
                        JobStatus.QUEUED.value,
                        JobStatus.RUNNING.value
                    ])
                )
            )
        )

        return {
            "by_status": by_status,
            "total_jobs": sum(by_status.values()),
            "queued": by_status.get(JobStatus.QUEUED.value, 0),
            "running": by_status.get(JobStatus.RUNNING.value, 0),
            "avg_queue_time_seconds": round(avg_queue_time.scalar() or 0, 2),
            "avg_execution_time_seconds": round(avg_exec_time.scalar() or 0, 2),
            "priority_distribution": {
                row.priority: row.count for row in priority_dist
            },
            "past_deadline": past_deadline.scalar() or 0,
            "worker_id": self.worker_id,
            "max_concurrent_jobs": self.max_concurrent_jobs
        }

    async def cleanup_old_jobs(
        self,
        db: AsyncSession,
        days: int = 30
    ) -> int:
        """
        Delete old completed/failed jobs

        Args:
            db: Database session
            days: Keep jobs from last N days

        Returns:
            Number of jobs deleted
        """
        cutoff = datetime.utcnow() - timedelta(days=days)

        result = await db.execute(
            select(func.count(AgentJob.id))
            .where(
                and_(
                    AgentJob.status.in_([
                        JobStatus.COMPLETED.value,
                        JobStatus.DEAD.value
                    ]),
                    AgentJob.completed_at < cutoff
                )
            )
        )

        count = result.scalar() or 0

        if count > 0:
            await db.execute(
                AgentJob.__table__.delete().where(
                    and_(
                        AgentJob.status.in_([
                            JobStatus.COMPLETED.value,
                            JobStatus.DEAD.value
                        ]),
                        AgentJob.completed_at < cutoff
                    )
                )
            )
            await db.commit()

            logger.info(f"Cleaned up {count} old jobs (>{days} days)")

        return count


# Singleton instance
queue_manager = QueueManager()
```

### Step 3: Create Worker Pool

```python
# services/worker_pool.py
import asyncio
from typing import List, Dict, Any
from loguru import logger
from datetime import datetime

from db.session import AsyncSessionLocal
from services.queue_manager import queue_manager
from services.task_runner import task_runner


class WorkerPool:
    """Manages pool of worker tasks for job processing"""

    def __init__(
        self,
        num_workers: int = 5,
        heartbeat_interval: int = 30
    ):
        self.num_workers = num_workers
        self.heartbeat_interval = heartbeat_interval
        self.workers: List[asyncio.Task] = []
        self.running = False

        logger.info(f"WorkerPool initialized with {num_workers} workers")

    async def start(self):
        """Start all workers"""
        if self.running:
            logger.warning("WorkerPool already running")
            return

        self.running = True

        # Start worker tasks
        for i in range(self.num_workers):
            worker_task = asyncio.create_task(
                self._worker(worker_id=i),
                name=f"worker-{i}"
            )
            self.workers.append(worker_task)

        # Start maintenance tasks
        heartbeat_task = asyncio.create_task(
            self._heartbeat_loop(),
            name="heartbeat"
        )
        self.workers.append(heartbeat_task)

        recovery_task = asyncio.create_task(
            self._recovery_loop(),
            name="recovery"
        )
        self.workers.append(recovery_task)

        cleanup_task = asyncio.create_task(
            self._cleanup_loop(),
            name="cleanup"
        )
        self.workers.append(cleanup_task)

        logger.info("WorkerPool started")

    async def stop(self):
        """Stop all workers gracefully"""
        if not self.running:
            return

        self.running = False

        # Cancel all worker tasks
        for worker in self.workers:
            worker.cancel()

        # Wait for cancellation
        await asyncio.gather(*self.workers, return_exceptions=True)

        self.workers.clear()

        logger.info("WorkerPool stopped")

    async def _worker(self, worker_id: int):
        """
        Worker task that processes jobs from queue

        Args:
            worker_id: Worker identifier
        """
        logger.info(f"Worker {worker_id} started")

        while self.running:
            try:
                async with AsyncSessionLocal() as db:
                    # Get next job from queue
                    job = await queue_manager.dequeue(db)

                    if not job:
                        # Queue empty, wait before checking again
                        await asyncio.sleep(5)
                        continue

                    logger.info(f"Worker {worker_id} processing job {job.id}")

                    # Execute job
                    await task_runner.execute_job(db, job)

            except asyncio.CancelledError:
                logger.info(f"Worker {worker_id} cancelled")
                break

            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}", exc_info=True)
                await asyncio.sleep(10)  # Back off on error

        logger.info(f"Worker {worker_id} stopped")

    async def _heartbeat_loop(self):
        """Periodic heartbeat for running jobs"""
        logger.info("Heartbeat loop started")

        while self.running:
            try:
                await asyncio.sleep(self.heartbeat_interval)

                async with AsyncSessionLocal() as db:
                    # Update heartbeat for all running jobs assigned to this pool
                    from sqlalchemy import update
                    from db.models import AgentJob, JobStatus

                    await db.execute(
                        update(AgentJob)
                        .where(
                            AgentJob.status == JobStatus.RUNNING.value,
                            AgentJob.worker_id == queue_manager.worker_id
                        )
                        .values(heartbeat_at=datetime.utcnow())
                    )
                    await db.commit()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat loop error: {e}")

        logger.info("Heartbeat loop stopped")

    async def _recovery_loop(self):
        """Periodic recovery of stale jobs"""
        logger.info("Recovery loop started")

        while self.running:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes

                async with AsyncSessionLocal() as db:
                    recovered = await queue_manager.recover_stale_jobs(db)

                    if recovered > 0:
                        logger.info(f"Recovery loop recovered {recovered} jobs")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Recovery loop error: {e}")

        logger.info("Recovery loop stopped")

    async def _cleanup_loop(self):
        """Periodic cleanup of old jobs"""
        logger.info("Cleanup loop started")

        while self.running:
            try:
                await asyncio.sleep(86400)  # Once per day

                async with AsyncSessionLocal() as db:
                    deleted = await queue_manager.cleanup_old_jobs(db, days=30)

                    if deleted > 0:
                        logger.info(f"Cleanup loop deleted {deleted} old jobs")

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Cleanup loop error: {e}")

        logger.info("Cleanup loop stopped")

    def get_stats(self) -> Dict[str, Any]:
        """Get worker pool statistics"""
        active_workers = sum(1 for w in self.workers if not w.done())

        return {
            "num_workers": self.num_workers,
            "active_workers": active_workers,
            "running": self.running,
            "worker_id": queue_manager.worker_id
        }


# Global worker pool instance
worker_pool = WorkerPool(num_workers=5)
```

### Step 4: Integrate with FastAPI Lifespan

```python
# main.py (updated)
from contextlib import asynccontextmanager
from fastapi import FastAPI

from services.worker_pool import worker_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting application...")

    # Initialize database
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start worker pool
    await worker_pool.start()

    logger.info("Application started")

    yield

    # Shutdown
    logger.info("Shutting down application...")

    # Stop worker pool
    await worker_pool.stop()

    logger.info("Application stopped")


app = FastAPI(
    title="Agentic Marketing Dashboard API",
    version="2.0.0",
    lifespan=lifespan
)
```

### Step 5: Create Queue Management Endpoints

```python
# api/routes/queue_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.queue_responses import QueueStatsResponse, WorkerPoolStatsResponse
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user, require_admin
from services.queue_manager import queue_manager
from services.worker_pool import worker_pool
from loguru import logger


router = APIRouter(prefix="/api/queue", tags=["Queue Management"])


@router.get("/stats", response_model=QueueStatsResponse)
async def get_queue_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get queue statistics

    Returns metrics about:
    - Jobs by status
    - Queue/execution times
    - Priority distribution
    - Past deadline count
    """
    stats = await queue_manager.get_queue_stats(db)
    return QueueStatsResponse(**stats)


@router.get("/workers", response_model=WorkerPoolStatsResponse)
async def get_worker_stats(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get worker pool statistics

    Returns info about worker pool health and activity.
    """
    stats = worker_pool.get_stats()
    return WorkerPoolStatsResponse(**stats)


@router.post("/recover", status_code=status.HTTP_200_OK)
async def recover_stale_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)]
):
    """
    Manually trigger recovery of stale jobs

    Admin only. Forces recovery of jobs with stale heartbeats.
    """
    recovered = await queue_manager.recover_stale_jobs(db)

    return {
        "message": f"Recovered {recovered} stale jobs",
        "count": recovered
    }


@router.post("/cleanup", status_code=status.HTTP_200_OK)
async def cleanup_old_jobs(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
    days: int = Query(30, ge=1, le=365, description="Keep jobs from last N days")
):
    """
    Manually trigger cleanup of old jobs

    Admin only. Deletes completed/failed jobs older than specified days.
    """
    deleted = await queue_manager.cleanup_old_jobs(db, days=days)

    return {
        "message": f"Deleted {deleted} old jobs",
        "count": deleted
    }
```

## Database Integration

### Queue Queries

```sql
-- Get queue depth by priority
SELECT priority, COUNT(*) as count
FROM agent_jobs
WHERE status = 'queued'
GROUP BY priority
ORDER BY priority DESC;

-- Find jobs past deadline
SELECT id, agent_type, command, deadline,
       EXTRACT(EPOCH FROM (NOW() - deadline)) as seconds_overdue
FROM agent_jobs
WHERE status IN ('queued', 'running')
  AND deadline < NOW()
ORDER BY seconds_overdue DESC;

-- Get average queue time by agent type
SELECT agent_type,
       AVG(queue_time_seconds) as avg_queue_time,
       AVG(execution_time_seconds) as avg_execution_time
FROM agent_jobs
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_type;
```

## Testing

### 1. Test Priority Queue

```python
# Create jobs with different priorities
for priority in [1, 5, 10]:
    response = await client.post(
        "/api/agents/seo/research",
        headers=auth_headers,
        json={
            "topic": f"Test topic priority {priority}",
            "priority": priority
        }
    )
    print(f"Created job with priority {priority}: {response.json()['job_id']}")

# Higher priority jobs should execute first
```

### 2. Test Job Dependencies

```bash
# Create parent job
PARENT_ID=$(curl -X POST http://localhost:8000/api/agents/seo/research \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topic": "Parent research"}' | jq -r '.job_id')

# Create dependent job
curl -X POST http://localhost:8000/api/agents/seo/write \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"brief\": \"Write based on research\", \"depends_on_job_id\": $PARENT_ID}"
```

### 3. Test Queue Stats

```bash
curl http://localhost:8000/api/queue/stats \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Troubleshooting

### Issue: Jobs not being picked up by workers

**Solution:** Check worker pool status:
```bash
curl http://localhost:8000/api/queue/workers \
  -H "Authorization: Bearer $TOKEN"
```

Restart worker pool if needed:
```python
await worker_pool.stop()
await worker_pool.start()
```

### Issue: Jobs stuck in "running" state

**Solution:** Trigger stale job recovery:
```bash
curl -X POST http://localhost:8000/api/queue/recover \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: Memory usage grows over time

**Solution:** Schedule regular cleanup:
```python
# Add to cron or APScheduler
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(
    lambda: queue_manager.cleanup_old_jobs(db, days=7),
    'cron',
    hour=2,  # 2 AM daily
    minute=0
)
scheduler.start()
```

## Performance Considerations

### 1. Optimize Queue Queries

```sql
-- Ensure proper indexes exist
CREATE INDEX ix_jobs_queue_priority
  ON agent_jobs(status, priority, created_at)
  WHERE status = 'queued';

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM agent_jobs
WHERE status = 'queued'
  AND (scheduled_at IS NULL OR scheduled_at <= NOW())
ORDER BY priority DESC, created_at ASC
LIMIT 1;
```

### 2. Scale Workers Dynamically

```python
# services/auto_scaler.py
async def auto_scale_workers():
    """Adjust worker count based on queue depth"""
    async with AsyncSessionLocal() as db:
        stats = await queue_manager.get_queue_stats(db)

        queued = stats["queued"]

        if queued > 50 and worker_pool.num_workers < 20:
            # Scale up
            worker_pool.num_workers += 2
            logger.info(f"Scaled up to {worker_pool.num_workers} workers")

        elif queued < 10 and worker_pool.num_workers > 5:
            # Scale down
            worker_pool.num_workers -= 1
            logger.info(f"Scaled down to {worker_pool.num_workers} workers")
```

### 3. Use Redis for Distributed Queue (Optional)

```python
# For multi-server deployments
import aioredis

class RedisQueue:
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)

    async def enqueue(self, job_id: int, priority: int):
        """Add to Redis sorted set (score = priority)"""
        await self.redis.zadd("job_queue", {str(job_id): -priority})

    async def dequeue(self) -> Optional[int]:
        """Get highest priority job"""
        result = await self.redis.zpopmin("job_queue")
        if result:
            return int(result[0][0])
        return None
```

## Next Steps

**Phase 2 Backend Complete!** All 5 documents created:

1. ✅ 06_AGENT_ENDPOINTS.md - FastAPI routes for all agents
2. ✅ 07_BACKGROUND_TASKS.md - Job execution and progress tracking
3. ✅ 08_WEBSOCKET_SETUP.md - Real-time updates via Socket.io
4. ✅ 09_BUDGET_SYSTEM.md - Cost tracking and enforcement
5. ✅ 10_JOB_QUEUE.md - Advanced queue management

**Next Phase:**
- Phase 3: Frontend Integration (React dashboard, WebSocket hooks, job monitoring UI)
- Phase 4: Agent Implementation (Port Python agents to use new infrastructure)
- Phase 5: Testing & Deployment (E2E tests, CI/CD, production deployment)

**Production Checklist:**
- [ ] Database indexes created
- [ ] Worker pool configured for production load
- [ ] Stale job recovery scheduled
- [ ] Old job cleanup automated
- [ ] Queue metrics monitored
- [ ] Alerts configured for queue depth
- [ ] Load testing completed
- [ ] Horizontal scaling tested (if using Redis)
- [ ] Disaster recovery plan documented
