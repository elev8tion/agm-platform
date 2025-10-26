"""
Job Service - Manages agent job CRUD operations
"""
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, and_, func
from loguru import logger
import json

from models.agent_job import AgentJob, JobStatus


class JobService:
    """Service for managing agent jobs"""

    async def create_job(
        self,
        db: AsyncSession,
        user_id: str,
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
            input_data=parameters,
            status=JobStatus.PENDING,
            priority=priority,
            created_at=datetime.utcnow()
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(
            f"Created job {job.id}: {agent_type}/{command} for user {user_id}"
        )

        return job

    async def get_job(
        self,
        db: AsyncSession,
        job_id: str,
        user_id: Optional[str] = None
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
        job_id: str,
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
            update_data["output_data"] = result

        if error_message is not None:
            update_data["error_message"] = error_message

        # Set timestamps based on status
        if status == JobStatus.RUNNING.value:
            update_data["started_at"] = datetime.utcnow()
        elif status in (JobStatus.COMPLETED.value, JobStatus.FAILED.value):
            update_data["completed_at"] = datetime.utcnow()

        # Update database
        await db.execute(
            update(AgentJob)
            .where(AgentJob.id == job_id)
            .values(**update_data)
        )
        await db.commit()

        logger.info(f"Job {job_id} updated: {status} ({progress}%)")

    async def get_user_jobs(
        self,
        db: AsyncSession,
        user_id: str,
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
        return list(result.scalars().all())

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
            .where(AgentJob.status == JobStatus.PENDING.value)
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
                status=JobStatus.RUNNING.value,
                progress=0
            )

        return job

    async def cancel_job(
        self,
        db: AsyncSession,
        job_id: str,
        user_id: str
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

        if job.status not in (JobStatus.PENDING.value, JobStatus.RUNNING.value):
            logger.warning(f"Cannot cancel job {job_id}: status is {job.status}")
            return False

        await self.update_job_status(
            db=db,
            job_id=job_id,
            status=JobStatus.CANCELLED.value,
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
                    AgentJob.status.in_([JobStatus.COMPLETED.value, JobStatus.FAILED.value, JobStatus.CANCELLED.value]),
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
        # Count by status
        status_counts = await db.execute(
            select(
                AgentJob.status,
                func.count(AgentJob.id).label("count")
            )
            .group_by(AgentJob.status)
        )

        stats = {
            "by_status": {str(row.status): row.count for row in status_counts},
            "total": sum(row.count for row in status_counts)
        }

        # Average execution time for completed jobs
        avg_time = await db.execute(
            select(
                func.avg(
                    func.julianday(AgentJob.completed_at) - func.julianday(AgentJob.started_at)
                ).label("avg_days")
            )
            .where(
                and_(
                    AgentJob.status == JobStatus.COMPLETED.value,
                    AgentJob.started_at.isnot(None),
                    AgentJob.completed_at.isnot(None)
                )
            )
        )

        avg_days = avg_time.scalar()
        stats["avg_execution_time_seconds"] = (
            round(avg_days * 86400, 2) if avg_days else None
        )

        return stats


# Singleton instance
job_service = JobService()
