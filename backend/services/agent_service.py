"""
Agent Service Layer
Handles agent execution and job management
"""
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from loguru import logger
from datetime import datetime

from models.agent_job import AgentJob, AgentType, JobStatus
from agents.seo_writer_agent import SEOWriterAgent
from agents.email_marketer_agent import EmailMarketerAgent


class AgentService:
    """Service layer for agent execution"""

    def __init__(self):
        self.seo_writer = SEOWriterAgent()
        self.email_marketer = EmailMarketerAgent()

    async def create_job(
        self,
        db: AsyncSession,
        agent_type: AgentType,
        input_data: Dict[str, Any]
    ) -> AgentJob:
        """Create a new agent job"""
        job = AgentJob(
            agent_type=agent_type,
            status=JobStatus.PENDING,
            input_data=input_data
        )

        db.add(job)
        await db.commit()
        await db.refresh(job)

        logger.info(f"Created job {job.id}: {agent_type}")
        return job

    async def execute_job(
        self,
        db: AsyncSession,
        job: AgentJob
    ) -> Dict[str, Any]:
        """Execute an agent job"""
        try:
            # Import WebSocket functions from api.websocket
            from api.websocket import sio

            # Update status to running
            job.status = JobStatus.RUNNING
            job.started_at = datetime.utcnow()
            await db.commit()

            # Broadcast job started event (to ALL connected clients)
            await sio.emit('job_started', {
                'job_id': str(job.id),
                'agent_type': job.agent_type.value,
                'status': 'running',
                'message': f'🚀 {job.agent_type.value} agent starting...'
            })
            logger.info(f"WebSocket: Broadcasted job_started for {job.id}")

            await sio.emit('job_thinking', {
                'job_id': str(job.id),
                'thought': 'Initializing agent...',
                'icon': '🤔'
            })

            # Route to appropriate agent
            if job.agent_type == AgentType.SEO_WRITER:
                await sio.emit('job_progress', {
                    'job_id': str(job.id),
                    'progress': 20,
                    'message': 'SEO Writer agent processing...'
                })
                result = await self._execute_seo_writer(job)
            elif job.agent_type == AgentType.EMAIL_MARKETER:
                await sio.emit('job_progress', {
                    'job_id': str(job.id),
                    'progress': 20,
                    'message': 'Email Marketer agent processing...'
                })
                result = await self._execute_email_marketer(job)
            else:
                raise ValueError(f"Unknown agent type: {job.agent_type}")

            # Update job with results
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.output_data = result
            job.tokens_used = result.get("tokens_used", 0)
            job.cost = result.get("cost", 0.0)

            await db.commit()
            await db.refresh(job)

            # Broadcast completion event
            await sio.emit('job_completed', {
                'job_id': str(job.id),
                'status': 'completed',
                'result': result,
                'message': '✅ Agent completed successfully!'
            })
            logger.info(f"WebSocket: Broadcasted job_completed for {job.id}")

            logger.info(f"Job {job.id} completed successfully")
            return result

        except Exception as e:
            logger.error(f"Job {job.id} failed: {e}")
            job.status = JobStatus.FAILED
            job.completed_at = datetime.utcnow()
            job.error_message = str(e)
            await db.commit()

            # Broadcast failure event
            from api.websocket import sio
            await sio.emit('job_failed', {
                'job_id': str(job.id),
                'status': 'failed',
                'error': str(e),
                'message': '❌ Agent failed'
            })
            logger.error(f"WebSocket: Broadcasted job_failed for {job.id}")
            raise

    async def execute_job_by_id(
        self,
        db: AsyncSession,
        job_id: str
    ) -> Dict[str, Any]:
        """Execute a job by fetching it from database first"""
        # Fetch job from database
        result = await db.execute(
            select(AgentJob).where(AgentJob.id == job_id)
        )
        job = result.scalar_one_or_none()

        if not job:
            raise ValueError(f"Job {job_id} not found")

        return await self.execute_job(db, job)

    async def get_job(
        self,
        db: AsyncSession,
        job_id: int
    ) -> Optional[AgentJob]:
        """Get job by ID"""
        result = await db.execute(
            select(AgentJob).where(AgentJob.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _execute_seo_writer(self, job: AgentJob) -> Dict[str, Any]:
        """Execute SEO Writer job"""
        input_data = job.input_data
        command = input_data.get("command", "write")

        if command == "research":
            return await self.seo_writer.research(
                topic=input_data["topic"],
                target_audience=input_data.get("target_audience"),
                depth=input_data.get("depth", "medium")
            )
        elif command == "write":
            return await self.seo_writer.write(
                brief=input_data["brief"],
                keyword=input_data.get("keyword"),
                word_count=input_data.get("word_count", 1500),
                tone=input_data.get("tone", "professional"),
                include_faqs=input_data.get("include_faqs", True)
            )
        else:
            raise ValueError(f"Unknown SEO command: {command}")

    async def _execute_email_marketer(self, job: AgentJob) -> Dict[str, Any]:
        """Execute Email Marketer job"""
        input_data = job.input_data
        command = input_data.get("command", "create")

        if command == "create":
            return await self.email_marketer.create_email(
                brief=input_data["brief"],
                subject_line=input_data.get("subject_line"),
                tone=input_data.get("tone", "friendly"),
                include_cta=input_data.get("include_cta", True)
            )
        elif command == "series":
            return await self.email_marketer.create_series(
                brief=input_data["brief"],
                num_emails=input_data.get("num_emails", 5),
                frequency=input_data.get("frequency", "daily"),
                goal=input_data.get("goal", "conversion")
            )
        else:
            raise ValueError(f"Unknown email command: {command}")


# Singleton instance
agent_service = AgentService()
