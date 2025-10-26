"""
Job Response Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class JobStatusResponse(BaseModel):
    """Response model for job status"""
    id: str
    status: str
    progress: float
    agent_type: str
    command: Optional[str] = None
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
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
    currently_running: int = 0
