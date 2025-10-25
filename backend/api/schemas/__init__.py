"""
API Schemas Package
"""
from .agent_requests import (
    ResearchRequest,
    WriteRequest,
    OptimizeRequest,
    ReviewRequest,
    CreateEmailRequest,
    CreateSeriesRequest,
    CMOAnalyzeRequest,
    CMOReviewRequest,
)
from .agent_responses import (
    AgentResponseBase,
    ResearchResponse,
    WriteResponse,
    OptimizeResponse,
    ReviewResponse,
    EmailResponse,
    SeriesResponse,
    CMOResponse,
)

__all__ = [
    # Request schemas
    "ResearchRequest",
    "WriteRequest",
    "OptimizeRequest",
    "ReviewRequest",
    "CreateEmailRequest",
    "CreateSeriesRequest",
    "CMOAnalyzeRequest",
    "CMOReviewRequest",
    # Response schemas
    "AgentResponseBase",
    "ResearchResponse",
    "WriteResponse",
    "OptimizeResponse",
    "ReviewResponse",
    "EmailResponse",
    "SeriesResponse",
    "CMOResponse",
]
