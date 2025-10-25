"""
Health check endpoints for monitoring
"""
from fastapi import APIRouter
from config.settings import settings
from datetime import datetime

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    """
    Basic health check endpoint
    Returns 200 if service is running
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes/Render
    """
    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
    }
