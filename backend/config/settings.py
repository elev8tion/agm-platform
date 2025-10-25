"""
Application configuration using Pydantic Settings
Loads from environment variables with .env file support
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    APP_NAME: str = "Agentic Marketing AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - Allow Netlify frontend
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.netlify.app",
        "https://your-production-domain.com",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/agentic_marketing"
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_ORG_ID: str | None = None
    OPENAI_DEFAULT_MODEL: str = "gpt-4o-mini"
    OPENAI_VECTOR_STORE_ID: str | None = None

    # Agent Configuration
    AGENT_MAX_ITERATIONS: int = 10
    AGENT_TIMEOUT: int = 300  # 5 minutes
    AGENT_BUDGET_WEB_SEARCH: float = 5.0
    AGENT_BUDGET_FILE_SEARCH: float = 2.0

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance
    Uses lru_cache to avoid reading .env file multiple times
    """
    return Settings()


# Export settings instance
settings = get_settings()
