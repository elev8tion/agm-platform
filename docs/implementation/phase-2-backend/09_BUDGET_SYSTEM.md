# Phase 2 Backend: Budget Tracking & Enforcement

## Overview

This document implements a comprehensive budget tracking and enforcement system that ports the existing `budget.py` logic from the Python agents to a FastAPI service. The system monitors OpenAI API costs, enforces budget limits, and provides real-time cost visibility.

**Outcomes:**
- Real-time cost tracking per API call
- Budget limits per user/organization
- Token usage monitoring (GPT-4o, GPT-4o-mini)
- Web search and file search call tracking
- Budget enforcement middleware
- Admin dashboard for cost analytics

## Prerequisites

- Phase 1 completed (database setup)
- 06_AGENT_ENDPOINTS.md implemented
- 07_BACKGROUND_TASKS.md implemented
- Python 3.13+ installed

**Dependencies:**
```bash
pip install pydantic tiktoken loguru
```

## Architecture

```
Budget Flow:
┌─────────────┐
│   Request   │
│   /write    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Budget Check    │
│ Middleware      │
│ - Check limit   │
│ - Verify budget │
└──────┬──────────┘
       │ Allowed
       ▼
┌─────────────────┐
│ Execute Agent   │
│ - Track tokens  │
│ - Track searches│
│ - Calculate cost│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Budget Entry    │
│ - Save to DB    │
│ - Update total  │
│ - Check warnings│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Response        │
│ + Cost metadata │
└─────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create Budget Models

```python
# db/models.py (add to existing models)
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from datetime import datetime

class BudgetEntry(Base):
    """Track individual API call costs"""
    __tablename__ = "budget_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    job_id = Column(Integer, ForeignKey("agent_jobs.id"), nullable=True)

    # Operation details
    operation_type = Column(String, nullable=False)  # chat, web_search, file_search
    model = Column(String, nullable=True)  # gpt-4o, gpt-4o-mini, etc.

    # Token usage (for chat completions)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)

    # Search usage
    web_search_calls = Column(Integer, default=0)
    file_search_calls = Column(Integer, default=0)

    # Cost calculation
    cost_usd = Column(Float, nullable=False)

    # Metadata
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="budget_entries")
    organization = relationship("Organization", back_populates="budget_entries")
    job = relationship("AgentJob", back_populates="budget_entries")

    # Indexes for fast queries
    __table_args__ = (
        Index('ix_budget_user_date', 'user_id', 'created_at'),
        Index('ix_budget_org_date', 'organization_id', 'created_at'),
    )


class BudgetLimit(Base):
    """Budget limits per user/organization"""
    __tablename__ = "budget_limits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)

    # Limits
    daily_limit_usd = Column(Float, nullable=True)
    monthly_limit_usd = Column(Float, nullable=True)
    total_limit_usd = Column(Float, nullable=True)

    # Warnings
    warning_threshold_percent = Column(Integer, default=80)  # Warn at 80%

    # Status
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="budget_limit")
    organization = relationship("Organization", back_populates="budget_limit")


# Update existing models with relationships
User.budget_entries = relationship("BudgetEntry", back_populates="user")
User.budget_limit = relationship("BudgetLimit", back_populates="user", uselist=False)

Organization.budget_entries = relationship("BudgetEntry", back_populates="organization")
Organization.budget_limit = relationship("BudgetLimit", back_populates="organization", uselist=False)

AgentJob.budget_entries = relationship("BudgetEntry", back_populates="job")
```

### Step 2: Create Budget Service

```python
# services/budget_service.py
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from loguru import logger
import tiktoken

from db.models import BudgetEntry, BudgetLimit, User, Organization


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
        """
        Calculate cost for chat completion

        Args:
            model: Model name (gpt-4o, gpt-4o-mini, etc.)
            prompt_tokens: Number of prompt tokens
            completion_tokens: Number of completion tokens

        Returns:
            Cost in USD
        """
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
        """
        Calculate cost for search operations

        Args:
            web_search_calls: Number of web search calls
            file_search_calls: Number of file search calls

        Returns:
            Cost in USD
        """
        web_cost = web_search_calls * PRICING["web_search"]
        file_cost = file_search_calls * PRICING["file_search"]

        return web_cost + file_cost

    async def track_chat_completion(
        self,
        db: AsyncSession,
        user_id: int,
        job_id: Optional[int],
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        organization_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> BudgetEntry:
        """
        Track a chat completion API call

        Args:
            db: Database session
            user_id: User ID
            job_id: Optional job ID
            model: Model name
            prompt_tokens: Prompt token count
            completion_tokens: Completion token count
            organization_id: Optional organization ID
            metadata: Additional metadata

        Returns:
            Created BudgetEntry
        """
        total_tokens = prompt_tokens + completion_tokens
        cost = self.calculate_chat_cost(model, prompt_tokens, completion_tokens)

        entry = BudgetEntry(
            user_id=user_id,
            organization_id=organization_id,
            job_id=job_id,
            operation_type="chat",
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost,
            metadata=metadata or {}
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
        user_id: int,
        job_id: Optional[int],
        web_search_calls: int = 0,
        file_search_calls: int = 0,
        organization_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> BudgetEntry:
        """
        Track search API calls

        Args:
            db: Database session
            user_id: User ID
            job_id: Optional job ID
            web_search_calls: Number of web searches
            file_search_calls: Number of file searches
            organization_id: Optional organization ID
            metadata: Additional metadata

        Returns:
            Created BudgetEntry
        """
        cost = self.calculate_search_cost(web_search_calls, file_search_calls)

        entry = BudgetEntry(
            user_id=user_id,
            organization_id=organization_id,
            job_id=job_id,
            operation_type="search",
            web_search_calls=web_search_calls,
            file_search_calls=file_search_calls,
            cost_usd=cost,
            metadata=metadata or {}
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
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get usage summary for user or organization

        Args:
            db: Database session
            user_id: Filter by user
            organization_id: Filter by organization
            start_date: Start of date range
            end_date: End of date range

        Returns:
            Usage summary dictionary
        """
        query = select(
            func.count(BudgetEntry.id).label("total_calls"),
            func.sum(BudgetEntry.cost_usd).label("total_cost"),
            func.sum(BudgetEntry.total_tokens).label("total_tokens"),
            func.sum(BudgetEntry.web_search_calls).label("total_web_searches"),
            func.sum(BudgetEntry.file_search_calls).label("total_file_searches")
        )

        if user_id:
            query = query.where(BudgetEntry.user_id == user_id)

        if organization_id:
            query = query.where(BudgetEntry.organization_id == organization_id)

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
        user_id: int,
        organization_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Check if user/organization is within budget limits

        Args:
            db: Database session
            user_id: User ID
            organization_id: Optional organization ID

        Returns:
            Dictionary with budget status
        """
        # Get budget limit
        if organization_id:
            limit_query = select(BudgetLimit).where(
                BudgetLimit.organization_id == organization_id,
                BudgetLimit.is_active == True
            )
        else:
            limit_query = select(BudgetLimit).where(
                BudgetLimit.user_id == user_id,
                BudgetLimit.is_active == True
            )

        result = await db.execute(limit_query)
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
            user_id=user_id if not organization_id else None,
            organization_id=organization_id,
            start_date=daily_start
        )

        # Monthly usage
        monthly_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_usage = await self.get_usage_summary(
            db=db,
            user_id=user_id if not organization_id else None,
            organization_id=organization_id,
            start_date=monthly_start
        )

        # Total usage
        total_usage = await self.get_usage_summary(
            db=db,
            user_id=user_id if not organization_id else None,
            organization_id=organization_id
        )

        # Check limits
        violations = []

        if limit.daily_limit_usd:
            daily_pct = (daily_usage["total_cost_usd"] / limit.daily_limit_usd) * 100
            if daily_usage["total_cost_usd"] >= limit.daily_limit_usd:
                violations.append(f"Daily limit exceeded: ${daily_usage['total_cost_usd']:.2f} / ${limit.daily_limit_usd:.2f}")
            elif daily_pct >= limit.warning_threshold_percent:
                logger.warning(f"Daily budget at {daily_pct:.1f}% for user {user_id}")

        if limit.monthly_limit_usd:
            monthly_pct = (monthly_usage["total_cost_usd"] / limit.monthly_limit_usd) * 100
            if monthly_usage["total_cost_usd"] >= limit.monthly_limit_usd:
                violations.append(f"Monthly limit exceeded: ${monthly_usage['total_cost_usd']:.2f} / ${limit.monthly_limit_usd:.2f}")
            elif monthly_pct >= limit.warning_threshold_percent:
                logger.warning(f"Monthly budget at {monthly_pct:.1f}% for user {user_id}")

        if limit.total_limit_usd:
            total_pct = (total_usage["total_cost_usd"] / limit.total_limit_usd) * 100
            if total_usage["total_cost_usd"] >= limit.total_limit_usd:
                violations.append(f"Total limit exceeded: ${total_usage['total_cost_usd']:.2f} / ${limit.total_limit_usd:.2f}")
            elif total_pct >= limit.warning_threshold_percent:
                logger.warning(f"Total budget at {total_pct:.1f}% for user {user_id}")

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
        user_id: Optional[int] = None,
        organization_id: Optional[int] = None,
        daily_limit: Optional[float] = None,
        monthly_limit: Optional[float] = None,
        total_limit: Optional[float] = None,
        warning_threshold: int = 80
    ) -> BudgetLimit:
        """
        Set or update budget limit

        Args:
            db: Database session
            user_id: User ID (either user_id or organization_id required)
            organization_id: Organization ID
            daily_limit: Daily limit in USD
            monthly_limit: Monthly limit in USD
            total_limit: Total lifetime limit in USD
            warning_threshold: Warning threshold percentage (1-100)

        Returns:
            Created or updated BudgetLimit
        """
        # Check if limit exists
        if organization_id:
            query = select(BudgetLimit).where(
                BudgetLimit.organization_id == organization_id
            )
        else:
            query = select(BudgetLimit).where(
                BudgetLimit.user_id == user_id
            )

        result = await db.execute(query)
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
                organization_id=organization_id,
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
            f"total=${total_limit} for {'org' if organization_id else 'user'} "
            f"{organization_id or user_id}"
        )

        return limit


# Singleton instance
budget_service = BudgetService()
```

### Step 3: Create Budget Middleware

```python
# api/middleware/budget.py
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
from loguru import logger

from db.session import AsyncSessionLocal
from services.budget_service import budget_service


class BudgetEnforcementMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce budget limits before processing requests"""

    async def dispatch(self, request: Request, call_next: Callable):
        # Only check budget for agent endpoints
        if not request.url.path.startswith("/api/agents/"):
            return await call_next(request)

        # Skip for GET requests (read-only)
        if request.method == "GET":
            return await call_next(request)

        # Get user from request state (set by auth middleware)
        user = getattr(request.state, "user", None)

        if not user:
            # No user authenticated, continue
            return await call_next(request)

        # Check budget
        async with AsyncSessionLocal() as db:
            budget_status = await budget_service.check_budget_limit(
                db=db,
                user_id=user.id,
                organization_id=user.organization_id
            )

            if not budget_status["within_budget"]:
                logger.warning(
                    f"Budget limit exceeded for user {user.id}: "
                    f"{budget_status['violations']}"
                )

                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail={
                        "message": "Budget limit exceeded",
                        "violations": budget_status["violations"],
                        "usage": budget_status["usage"],
                        "limits": budget_status["limits"]
                    }
                )

        # Budget OK, proceed with request
        response = await call_next(request)
        return response
```

### Step 4: Create Budget Tracking Wrapper

```python
# services/budget_tracker.py
from typing import Dict, Any, Optional, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import functools

from services.budget_service import budget_service


class BudgetTracker:
    """Context manager for tracking budget during agent execution"""

    def __init__(
        self,
        db: AsyncSession,
        user_id: int,
        job_id: Optional[int] = None,
        organization_id: Optional[int] = None
    ):
        self.db = db
        self.user_id = user_id
        self.job_id = job_id
        self.organization_id = organization_id
        self.total_cost = 0.0

    async def track_completion(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Track a chat completion"""
        entry = await budget_service.track_chat_completion(
            db=self.db,
            user_id=self.user_id,
            job_id=self.job_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            organization_id=self.organization_id,
            metadata=metadata
        )

        self.total_cost += entry.cost_usd
        return entry

    async def track_searches(
        self,
        web_search_calls: int = 0,
        file_search_calls: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Track search calls"""
        entry = await budget_service.track_search_calls(
            db=self.db,
            user_id=self.user_id,
            job_id=self.job_id,
            web_search_calls=web_search_calls,
            file_search_calls=file_search_calls,
            organization_id=self.organization_id,
            metadata=metadata
        )

        self.total_cost += entry.cost_usd
        return entry

    def get_total_cost(self) -> float:
        """Get total cost tracked so far"""
        return self.total_cost


def track_budget(func: Callable):
    """Decorator to automatically track budget for agent methods"""

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract db and user_id from args/kwargs
        db = kwargs.get('db') or args[1] if len(args) > 1 else None
        user_id = kwargs.get('user_id')
        job_id = kwargs.get('job_id')

        if not db or not user_id:
            logger.warning("Cannot track budget: missing db or user_id")
            return await func(*args, **kwargs)

        # Create tracker
        tracker = BudgetTracker(db, user_id, job_id)

        # Add tracker to kwargs
        kwargs['budget_tracker'] = tracker

        # Execute function
        result = await func(*args, **kwargs)

        # Log total cost
        logger.info(
            f"Function {func.__name__} cost: ${tracker.get_total_cost():.6f} "
            f"for user {user_id}"
        )

        return result

    return wrapper
```

### Step 5: Integrate Budget Tracking into Agents

```python
# agents/seo_writer.py (example integration)
from services.budget_tracker import BudgetTracker

class SEOWriter(BaseAgent):
    async def write(
        self,
        brief: str,
        keyword: Optional[str] = None,
        word_count: int = 1500,
        budget_tracker: Optional[BudgetTracker] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Write SEO content with budget tracking"""

        # Draft with GPT-4o-mini
        draft_response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self.get_system_prompt()},
                {"role": "user", "content": f"Write about: {brief}"}
            ]
        )

        # Track cost
        if budget_tracker:
            await budget_tracker.track_completion(
                model="gpt-4o-mini",
                prompt_tokens=draft_response.usage.prompt_tokens,
                completion_tokens=draft_response.usage.completion_tokens,
                metadata={"stage": "draft", "brief": brief[:100]}
            )

        draft = draft_response.choices[0].message.content

        # Polish with GPT-4o
        polish_response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "Polish this content"},
                {"role": "user", "content": draft}
            ]
        )

        # Track polish cost
        if budget_tracker:
            await budget_tracker.track_completion(
                model="gpt-4o",
                prompt_tokens=polish_response.usage.prompt_tokens,
                completion_tokens=polish_response.usage.completion_tokens,
                metadata={"stage": "polish"}
            )

        return {
            "content": polish_response.choices[0].message.content,
            "word_count": len(polish_response.choices[0].message.content.split()),
            "total_cost": budget_tracker.get_total_cost() if budget_tracker else 0.0
        }
```

### Step 6: Create Budget Admin Endpoints

```python
# api/routes/budget_routes.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional
from datetime import datetime, timedelta

from api.schemas.budget_requests import SetBudgetLimitRequest
from api.schemas.budget_responses import (
    UsageSummaryResponse,
    BudgetStatusResponse,
    BudgetLimitResponse
)
from db.session import get_db
from db.models import User
from api.dependencies import get_current_user, require_admin
from services.budget_service import budget_service
from loguru import logger


router = APIRouter(prefix="/api/budget", tags=["Budget"])


@router.get("/usage", response_model=UsageSummaryResponse)
async def get_usage(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query("month", enum=["day", "week", "month", "all"])
):
    """
    Get usage summary for current user

    Returns cost and token usage for specified period.
    """
    now = datetime.utcnow()

    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = None

    summary = await budget_service.get_usage_summary(
        db=db,
        user_id=current_user.id,
        start_date=start_date
    )

    return UsageSummaryResponse(**summary, period=period)


@router.get("/status", response_model=BudgetStatusResponse)
async def get_budget_status(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Check budget status for current user

    Returns whether user is within limits and current usage.
    """
    status = await budget_service.check_budget_limit(
        db=db,
        user_id=current_user.id,
        organization_id=current_user.organization_id
    )

    return BudgetStatusResponse(**status)


@router.post("/limits", response_model=BudgetLimitResponse)
async def set_budget_limits(
    request: SetBudgetLimitRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Set budget limits for current user

    Requires user to set their own spending limits.
    """
    limit = await budget_service.set_budget_limit(
        db=db,
        user_id=current_user.id,
        daily_limit=request.daily_limit_usd,
        monthly_limit=request.monthly_limit_usd,
        total_limit=request.total_limit_usd,
        warning_threshold=request.warning_threshold_percent
    )

    return BudgetLimitResponse(
        daily_limit_usd=limit.daily_limit_usd,
        monthly_limit_usd=limit.monthly_limit_usd,
        total_limit_usd=limit.total_limit_usd,
        warning_threshold_percent=limit.warning_threshold_percent
    )


@router.get("/limits", response_model=BudgetLimitResponse)
async def get_budget_limits(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current budget limits"""
    from sqlalchemy import select
    from db.models import BudgetLimit

    result = await db.execute(
        select(BudgetLimit).where(BudgetLimit.user_id == current_user.id)
    )
    limit = result.scalar_one_or_none()

    if not limit:
        return BudgetLimitResponse(
            daily_limit_usd=None,
            monthly_limit_usd=None,
            total_limit_usd=None,
            warning_threshold_percent=80
        )

    return BudgetLimitResponse(
        daily_limit_usd=limit.daily_limit_usd,
        monthly_limit_usd=limit.monthly_limit_usd,
        total_limit_usd=limit.total_limit_usd,
        warning_threshold_percent=limit.warning_threshold_percent
    )
```

## Database Integration

### Budget Queries

```sql
-- Get user's total spending
SELECT SUM(cost_usd) as total_spent
FROM budget_entries
WHERE user_id = :user_id;

-- Get spending by model
SELECT model,
       SUM(cost_usd) as cost,
       SUM(total_tokens) as tokens
FROM budget_entries
WHERE user_id = :user_id
  AND operation_type = 'chat'
GROUP BY model;

-- Get daily spending trend
SELECT DATE(created_at) as date,
       SUM(cost_usd) as daily_cost
FROM budget_entries
WHERE user_id = :user_id
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

## Testing

```bash
# Set budget limit
curl -X POST http://localhost:8000/api/budget/limits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_limit_usd": 10.0,
    "monthly_limit_usd": 100.0,
    "warning_threshold_percent": 80
  }'

# Check usage
curl http://localhost:8000/api/budget/usage?period=month \
  -H "Authorization: Bearer $TOKEN"

# Check budget status
curl http://localhost:8000/api/budget/status \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Issue: "Budget limit exceeded" but usage looks correct

**Solution:** Check timezone handling:
```python
# Ensure UTC for consistency
daily_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
```

### Issue: Token counts don't match OpenAI billing

**Solution:** Use official tokenizer:
```python
import tiktoken
enc = tiktoken.encoding_for_model("gpt-4o")
tokens = len(enc.encode(text))
```

## Performance Considerations

### 1. Index Budget Queries
```sql
CREATE INDEX ix_budget_user_date ON budget_entries(user_id, created_at);
CREATE INDEX ix_budget_org_date ON budget_entries(organization_id, created_at);
```

### 2. Cache Budget Status
```python
from functools import lru_cache
from datetime import datetime

@lru_cache(maxsize=1000)
def get_cached_budget_status(user_id: int, minute: int):
    # Cache refreshes every minute
    return budget_service.check_budget_limit(db, user_id)
```

## Next Steps

Proceed to:
1. **10_JOB_QUEUE.md** - Advanced queue management with priorities

**Production Checklist:**
- [ ] Pricing updated to current rates
- [ ] Budget limits configured per tier
- [ ] Alerts configured for limit violations
- [ ] Cost analytics dashboard deployed
- [ ] Billing integration tested
