"""
Email Marketing Agent API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import CreateEmailRequest, CreateSeriesRequest
from api.schemas.agent_responses import EmailResponse, SeriesResponse
from config.database import get_db
from api.dependencies import get_current_user
from services.agent_service import agent_service
from models.agent_job import AgentType
from loguru import logger


router = APIRouter(prefix="/api/agents/email", tags=["Email Marketing Agent"])


@router.post("/create", response_model=EmailResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_email(
    request: CreateEmailRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """
    Create a single marketing email

    Generates:
    - Compelling subject line
    - Engaging email body
    - Clear call-to-action
    - Preview text

    Uses brand voice from Vector Store context.
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

        async def execute_email():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job(session, job)

        background_tasks.add_task(execute_email)

        return EmailResponse(
            success=True,
            message="Email creation job queued",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue email creation job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue email creation job: {str(e)}"
        )


@router.post("/series", response_model=SeriesResponse, status_code=status.HTTP_202_ACCEPTED)
async def create_series(
    request: CreateSeriesRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """
    Create email series/sequence

    Generates multi-email sequence with:
    - Cohesive narrative arc
    - Progressive value delivery
    - Consistent branding
    - Strategic CTAs

    Perfect for onboarding, nurture campaigns, product launches.
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

        async def execute_series():
            from config.database import AsyncSessionLocal
            async with AsyncSessionLocal() as session:
                await agent_service.execute_job(session, job)

        background_tasks.add_task(execute_series)

        return SeriesResponse(
            success=True,
            message=f"Email series job queued ({request.num_emails} emails)",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue series creation job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue series creation job: {str(e)}"
        )
