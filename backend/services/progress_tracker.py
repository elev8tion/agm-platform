"""
Progress Tracker - Helper for tracking job progress within agent execution
"""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from services.job_service import job_service
from models.agent_job import JobStatus


class ProgressTracker:
    """Helper for tracking job progress within agent execution"""

    def __init__(self, db: AsyncSession, job_id: str):
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
            status=JobStatus.RUNNING.value,
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
