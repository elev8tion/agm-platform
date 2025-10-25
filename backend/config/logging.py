"""
Logging configuration using Loguru
"""
import sys
from loguru import logger
from config.settings import settings

# Remove default handler
logger.remove()

# Add console handler with custom format
logger.add(
    sys.stdout,
    format=settings.LOG_FORMAT,
    level=settings.LOG_LEVEL,
    colorize=True,
)

# Add file handler with rotation
logger.add(
    "logs/app_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="30 days",
    compression="zip",
    level=settings.LOG_LEVEL,
    format=settings.LOG_FORMAT,
)

__all__ = ["logger"]
