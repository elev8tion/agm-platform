"""
Base Agent Class
All OpenAI Agents inherit from this base class
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from openai import OpenAI
from loguru import logger
import os


class BaseAgent(ABC):
    """Base class for all OpenAI Agents"""

    def __init__(self, model: str = None, vector_store_id: str = None):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.client = OpenAI(api_key=api_key)
        self.model = model or os.getenv("DEFAULT_MODEL", "gpt-4o-mini")
        self.vector_store_id = vector_store_id or os.getenv("VECTOR_STORE_ID")

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
