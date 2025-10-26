"""
Budget Tracker - Context manager for tracking costs during agent execution
"""
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from services.budget_service import budget_service


class BudgetTracker:
    """Context manager for tracking budget during agent execution"""

    def __init__(
        self,
        db: AsyncSession,
        user_id: str,
        job_id: Optional[str] = None
    ):
        self.db = db
        self.user_id = user_id
        self.job_id = job_id
        self.total_cost = 0.0

    async def track_completion(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        description: Optional[str] = None
    ):
        """Track a chat completion"""
        entry = await budget_service.track_chat_completion(
            db=self.db,
            user_id=self.user_id,
            job_id=self.job_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            description=description
        )

        self.total_cost += entry.cost
        return entry

    async def track_searches(
        self,
        web_search_calls: int = 0,
        file_search_calls: int = 0,
        description: Optional[str] = None
    ):
        """Track search calls"""
        entry = await budget_service.track_search_calls(
            db=self.db,
            user_id=self.user_id,
            job_id=self.job_id,
            web_search_calls=web_search_calls,
            file_search_calls=file_search_calls,
            description=description
        )

        self.total_cost += entry.cost
        return entry

    def get_total_cost(self) -> float:
        """Get total cost tracked so far"""
        return self.total_cost
