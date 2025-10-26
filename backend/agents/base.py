"""
Base Agent Class
All OpenAI Agents inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from openai import AsyncOpenAI
from loguru import logger
from config.settings import settings


class BaseAgent(ABC):
    """Base class for all OpenAI Agents"""

    def __init__(self, model: str = None, vector_store_id: str = None):
        api_key = settings.OPENAI_API_KEY

        # Log if using production key
        if api_key and api_key.startswith("sk-proj-"):
            logger.info(f"{self.__class__.__name__}: Initialized with OpenAI API key")

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model or settings.OPENAI_DEFAULT_MODEL
        self.vector_store_id = vector_store_id or settings.OPENAI_VECTOR_STORE_ID

        if not self.vector_store_id:
            logger.warning(f"{self.__class__.__name__}: No vector store ID configured")

    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the agent's primary function"""
        pass

    def get_tools(self) -> list:
        """Override to return agent-specific tools"""
        return []

    def get_system_prompt(self) -> str:
        """Override to return agent-specific system prompt"""
        return "You are a helpful AI assistant."
