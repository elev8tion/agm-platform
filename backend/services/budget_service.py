"""
Budget Service - Tracks and enforces budget limits
"""
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from loguru import logger
import tiktoken

from models.budget_entry import BudgetEntry, ResourceType
from models.budget_limit import BudgetLimit


# OpenAI Pricing (as of January 2025)
PRICING = {
    "gpt-4o": {
        "prompt": 2.50 / 1_000_000,      # $2.50 per 1M tokens
        "completion": 10.00 / 1_000_000  # $10.00 per 1M tokens
    },
    "gpt-4o-mini": {
        "prompt": 0.150 / 1_000_000,     # $0.15 per 1M tokens
        "completion": 0.600 / 1_000_000  # $0.60 per 1M tokens
    },
    "gpt-4-turbo": {
        "prompt": 10.00 / 1_000_000,
        "completion": 30.00 / 1_000_000
    },
    "web_search": 0.005,  # $0.005 per call
    "file_search": 0.001  # $0.001 per call
}


class BudgetService:
    """Service for tracking and enforcing budget limits"""

    def __init__(self):
        self.tokenizers = {}

    def get_tokenizer(self, model: str):
        """Get or create tokenizer for model"""
        if model not in self.tokenizers:
            try:
                self.tokenizers[model] = tiktoken.encoding_for_model(model)
            except KeyError:
                # Default to cl100k_base for unknown models
                self.tokenizers[model] = tiktoken.get_encoding("cl100k_base")
        return self.tokenizers[model]

    def count_tokens(self, text: str, model: str = "gpt-4o") -> int:
        """Count tokens in text for given model"""
        tokenizer = self.get_tokenizer(model)
        return len(tokenizer.encode(text))

    def calculate_chat_cost(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int
    ) -> float:
        """Calculate cost for chat completion"""
        if model not in PRICING:
            logger.warning(f"Unknown model pricing: {model}, using gpt-4o prices")
            model = "gpt-4o"

        pricing = PRICING[model]
        prompt_cost = prompt_tokens * pricing["prompt"]
        completion_cost = completion_tokens * pricing["completion"]

        return prompt_cost + completion_cost

    def calculate_search_cost(
        self,
        web_search_calls: int = 0,
        file_search_calls: int = 0
    ) -> float:
        """Calculate cost for search operations"""
        web_cost = web_search_calls * PRICING["web_search"]
        file_cost = file_search_calls * PRICING["file_search"]

        return web_cost + file_cost

    async def track_chat_completion(
        self,
        db: AsyncSession,
        user_id: str,
        job_id: Optional[str],
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        description: Optional[str] = None
    ) -> BudgetEntry:
        """Track a chat completion API call"""
        total_tokens = prompt_tokens + completion_tokens
        cost = self.calculate_chat_cost(model, prompt_tokens, completion_tokens)

        entry = BudgetEntry(
            user_id=user_id,
            agent_job_id=job_id,
            resource_type=ResourceType.OPENAI_API,
            model_used=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            tokens_used=total_tokens,
            cost=cost,
            description=description or f"Chat completion with {model}"
        )

        db.add(entry)
        await db.commit()
        await db.refresh(entry)

        logger.info(
            f"Tracked chat completion: {model}, "
            f"{total_tokens} tokens, ${cost:.6f} for user {user_id}"
        )

        return entry

    async def track_search_calls(
        self,
        db: AsyncSession,
        user_id: str,
        job_id: Optional[str],
        web_search_calls: int = 0,
        file_search_calls: int = 0,
        description: Optional[str] = None
    ) -> BudgetEntry:
        """Track search API calls"""
        cost = self.calculate_search_cost(web_search_calls, file_search_calls)

        entry = BudgetEntry(
            user_id=user_id,
            agent_job_id=job_id,
            resource_type=ResourceType.WEB_SEARCH if web_search_calls > 0 else ResourceType.FILE_SEARCH,
            web_search_calls=web_search_calls,
            file_search_calls=file_search_calls,
            cost=cost,
            description=description or f"Search calls: {web_search_calls} web, {file_search_calls} file"
        )

        db.add(entry)
        await db.commit()
        await db.refresh(entry)

        logger.info(
            f"Tracked searches: {web_search_calls} web, {file_search_calls} file, "
            f"${cost:.6f} for user {user_id}"
        )

        return entry

    async def get_usage_summary(
        self,
        db: AsyncSession,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get usage summary for user"""
        query = select(
            func.count(BudgetEntry.id).label("total_calls"),
            func.sum(BudgetEntry.cost).label("total_cost"),
            func.sum(BudgetEntry.tokens_used).label("total_tokens"),
            func.sum(BudgetEntry.web_search_calls).label("total_web_searches"),
            func.sum(BudgetEntry.file_search_calls).label("total_file_searches")
        ).where(BudgetEntry.user_id == user_id)

        if start_date:
            query = query.where(BudgetEntry.created_at >= start_date)

        if end_date:
            query = query.where(BudgetEntry.created_at <= end_date)

        result = await db.execute(query)
        row = result.first()

        return {
            "total_calls": row.total_calls or 0,
            "total_cost_usd": round(row.total_cost or 0.0, 6),
            "total_tokens": row.total_tokens or 0,
            "total_web_searches": row.total_web_searches or 0,
            "total_file_searches": row.total_file_searches or 0
        }

    async def check_budget_limit(
        self,
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """Check if user is within budget limits"""
        # Get budget limit
        result = await db.execute(
            select(BudgetLimit).where(
                BudgetLimit.user_id == user_id,
                BudgetLimit.is_active == True
            )
        )
        limit = result.scalar_one_or_none()

        if not limit:
            return {
                "within_budget": True,
                "message": "No budget limit configured"
            }

        # Calculate current usage
        now = datetime.utcnow()

        # Daily usage
        daily_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_usage = await self.get_usage_summary(
            db=db,
            user_id=user_id,
            start_date=daily_start
        )

        # Monthly usage
        monthly_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_usage = await self.get_usage_summary(
            db=db,
            user_id=user_id,
            start_date=monthly_start
        )

        # Total usage
        total_usage = await self.get_usage_summary(
            db=db,
            user_id=user_id
        )

        # Check limits
        violations = []

        if limit.daily_limit_usd:
            if daily_usage["total_cost_usd"] >= limit.daily_limit_usd:
                violations.append(f"Daily limit exceeded: ${daily_usage['total_cost_usd']:.2f} / ${limit.daily_limit_usd:.2f}")

        if limit.monthly_limit_usd:
            if monthly_usage["total_cost_usd"] >= limit.monthly_limit_usd:
                violations.append(f"Monthly limit exceeded: ${monthly_usage['total_cost_usd']:.2f} / ${limit.monthly_limit_usd:.2f}")

        if limit.total_limit_usd:
            if total_usage["total_cost_usd"] >= limit.total_limit_usd:
                violations.append(f"Total limit exceeded: ${total_usage['total_cost_usd']:.2f} / ${limit.total_limit_usd:.2f}")

        return {
            "within_budget": len(violations) == 0,
            "violations": violations,
            "usage": {
                "daily": daily_usage["total_cost_usd"],
                "monthly": monthly_usage["total_cost_usd"],
                "total": total_usage["total_cost_usd"]
            },
            "limits": {
                "daily": limit.daily_limit_usd,
                "monthly": limit.monthly_limit_usd,
                "total": limit.total_limit_usd
            }
        }

    async def set_budget_limit(
        self,
        db: AsyncSession,
        user_id: str,
        daily_limit: Optional[float] = None,
        monthly_limit: Optional[float] = None,
        total_limit: Optional[float] = None,
        warning_threshold: float = 80.0
    ) -> BudgetLimit:
        """Set or update budget limit"""
        # Check if limit exists
        result = await db.execute(
            select(BudgetLimit).where(BudgetLimit.user_id == user_id)
        )
        limit = result.scalar_one_or_none()

        if limit:
            # Update existing
            if daily_limit is not None:
                limit.daily_limit_usd = daily_limit
            if monthly_limit is not None:
                limit.monthly_limit_usd = monthly_limit
            if total_limit is not None:
                limit.total_limit_usd = total_limit
            limit.warning_threshold_percent = warning_threshold
            limit.updated_at = datetime.utcnow()
        else:
            # Create new
            limit = BudgetLimit(
                user_id=user_id,
                daily_limit_usd=daily_limit,
                monthly_limit_usd=monthly_limit,
                total_limit_usd=total_limit,
                warning_threshold_percent=warning_threshold
            )
            db.add(limit)

        await db.commit()
        await db.refresh(limit)

        logger.info(
            f"Set budget limit: daily=${daily_limit}, monthly=${monthly_limit}, "
            f"total=${total_limit} for user {user_id}"
        )

        return limit


# Singleton instance
budget_service = BudgetService()
