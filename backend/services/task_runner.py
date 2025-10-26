"""
Task Runner - Handles background task execution for agent jobs
"""
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import asyncio
import traceback

from services.job_service import job_service
from models.agent_job import AgentJob, JobStatus


class TaskRunner:
    """Handles background task execution for agent jobs"""

    def __init__(self):
        self.running_tasks: Dict[str, asyncio.Task] = {}

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
                status=JobStatus.RUNNING.value,
                progress=10
            )

            # Route to appropriate agent based on type and command
            result = await self._route_job(db, job)

            # Update status to completed
            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status=JobStatus.COMPLETED.value,
                progress=100,
                result=result
            )

            logger.info(f"Job {job_id} completed successfully")

        except asyncio.CancelledError:
            logger.warning(f"Job {job_id} was cancelled")
            await job_service.update_job_status(
                db=db,
                job_id=job_id,
                status=JobStatus.CANCELLED.value,
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
                status=JobStatus.FAILED.value,
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
        params = job.input_data

        # Placeholder for agent routing
        # This will be implemented when integrating with actual agent services

        # SEO Writer routes
        if job.agent_type == "seo_writer":
            if job.command == "research":
                # Simulate research task
                await asyncio.sleep(2)
                return {
                    "status": "success",
                    "message": f"Research completed for topic: {params.get('topic', 'N/A')}",
                    "outline": ["Introduction", "Main Points", "Conclusion"]
                }

            elif job.command == "write":
                # Simulate write task
                await asyncio.sleep(5)
                return {
                    "status": "success",
                    "message": f"Article written: {params.get('brief', 'N/A')}",
                    "content": "Generated SEO content...",
                    "word_count": params.get("word_count", 1500)
                }

            elif job.command == "optimize":
                # Simulate optimize task
                await asyncio.sleep(3)
                return {
                    "status": "success",
                    "message": f"Optimized URL: {params.get('url', 'N/A')}",
                    "seo_score": 85
                }

        # Email Marketer routes
        elif job.agent_type == "email_marketer":
            if job.command == "create":
                # Simulate email creation
                await asyncio.sleep(2)
                return {
                    "status": "success",
                    "message": "Email created",
                    "subject": params.get("subject_line", "Welcome!"),
                    "body": "Email content..."
                }

            elif job.command == "series":
                # Simulate series creation
                await asyncio.sleep(4)
                num_emails = params.get("num_emails", 5)
                return {
                    "status": "success",
                    "message": f"Email series created: {num_emails} emails",
                    "emails": [{"subject": f"Email {i+1}"} for i in range(num_emails)]
                }

        # CMO routes (placeholder)
        elif job.agent_type == "cmo":
            await asyncio.sleep(1)
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

    async def cancel_task(self, job_id: str) -> bool:
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

    def is_job_running(self, job_id: str) -> bool:
        """Check if a job is currently running"""
        return job_id in self.running_tasks


# Singleton instance
task_runner = TaskRunner()
