"""
CMO Agent API Routes
"""
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from api.schemas.agent_requests import CMOAnalyzeRequest, CMOReviewRequest
from api.schemas.agent_responses import CMOResponse
from config.database import get_db
from api.dependencies import get_current_user
from services.agent_service import agent_service
from models.agent_job import AgentType
from loguru import logger


router = APIRouter(prefix="/api/agents/cmo", tags=["CMO Agent"])


@router.post("/analyze", response_model=CMOResponse, status_code=status.HTTP_202_ACCEPTED)
async def analyze_strategy(
    request: CMOAnalyzeRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """
    Strategic marketing analysis

    CMO-level insights on:
    - Channel performance
    - Budget allocation
    - Campaign effectiveness
    - Market opportunities

    Orchestrates SEO Writer and Email Marketer for comprehensive view.
    """
    try:
        job = await agent_service.create_job(
            db=db,
            agent_type=AgentType.SEO_WRITER,  # TODO: Change to CMO agent when implemented
            input_data={
                "command": "analyze",
                **request.model_dump()
            }
        )

        # CMO agent implementation will be in next phase
        # For now, return placeholder

        return CMOResponse(
            success=True,
            message=f"Strategic analysis queued for: {request.focus_area}",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue CMO analysis job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue CMO analysis job: {str(e)}"
        )


@router.post("/review", response_model=CMOResponse, status_code=status.HTTP_202_ACCEPTED)
async def strategic_review(
    request: CMOReviewRequest,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)] = None
):
    """
    Comprehensive marketing review

    Executive summary of:
    - Overall marketing performance
    - ROI by channel
    - Strategic recommendations
    - Action items
    """
    try:
        job = await agent_service.create_job(
            db=db,
            agent_type=AgentType.SEO_WRITER,  # TODO: Change to CMO agent when implemented
            input_data={
                "command": "review",
                **request.model_dump()
            }
        )

        return CMOResponse(
            success=True,
            message=f"Strategic review queued for {request.period_days} days",
            job_id=str(job.id),
            status="queued",
            created_at=job.created_at
        )

    except Exception as e:
        logger.error(f"Failed to queue CMO review job: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue CMO review job: {str(e)}"
        )
