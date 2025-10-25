# Phase 1.2: Backend Setup (FastAPI + Python 3.13)

## Overview

This document guides you through setting up a FastAPI backend with Python 3.13, configured for deployment on Render and communication with the Next.js frontend on Netlify.

**Outcomes:**
- FastAPI application with Python 3.13
- CORS configured for Netlify frontend
- Virtual environment properly configured
- OpenAI Agents SDK integrated
- Agent system structure ready
- Development server running on http://localhost:8000

## Prerequisites

**Required Tools:**
- Python 3.13+ (verify: `python3 --version`)
- pip 23+ (verify: `pip3 --version`)
- virtualenv or venv module
- Git installed and configured

**Recommended:**
- VS Code with extensions:
  - Python
  - Pylance
  - Python Debugger

**Required Knowledge:**
- Basic Python syntax
- Understanding of REST APIs
- Familiarity with async/await

## Step-by-Step Instructions

### Step 1: Create Backend Directory Structure

```bash
# Navigate to project root
cd /Users/kcdacre8tor/agentic-marketing-dashboard

# Create backend directory
mkdir -p market-ai
cd market-ai

# Create directory structure
mkdir -p agents
mkdir -p agents/tools
mkdir -p agents/prompts
mkdir -p api
mkdir -p api/routes
mkdir -p api/middleware
mkdir -p core
mkdir -p models
mkdir -p schemas
mkdir -p services
mkdir -p config
mkdir -p utils
mkdir -p tests
mkdir -p logs

# Create __init__.py files to make packages
touch agents/__init__.py
touch agents/tools/__init__.py
touch agents/prompts/__init__.py
touch api/__init__.py
touch api/routes/__init__.py
touch api/middleware/__init__.py
touch core/__init__.py
touch models/__init__.py
touch schemas/__init__.py
touch services/__init__.py
touch config/__init__.py
touch utils/__init__.py
touch tests/__init__.py
```

**Directory Structure Explained:**
```
market-ai/
├── agents/              # AI agent implementations
│   ├── tools/          # Agent tools (functions)
│   └── prompts/        # Reusable prompts
├── api/                # FastAPI routes and middleware
│   ├── routes/         # API endpoints
│   └── middleware/     # CORS, auth, logging
├── core/               # Core business logic
├── models/             # Database models (SQLAlchemy)
├── schemas/            # Pydantic schemas (validation)
├── services/           # Business services
├── config/             # Configuration files
├── utils/              # Utility functions
├── logs/               # Application logs
└── tests/              # Test files
```

### Step 2: Create Python Virtual Environment

```bash
# Create virtual environment with Python 3.13
python3.13 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Verify Python version
python --version
# Expected: Python 3.13.x

# Upgrade pip
pip install --upgrade pip
```

**Good to know:** Always activate the virtual environment before running any Python commands:
```bash
source venv/bin/activate
```

### Step 3: Create requirements.txt

Create `requirements.txt`:

```txt
# FastAPI and server
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-multipart==0.0.20

# CORS and middleware
python-dotenv==1.0.1

# OpenAI Agents SDK
openai-agents==0.1.0
openai==1.59.5

# Database
asyncpg==0.30.0
sqlalchemy==2.0.36
alembic==1.14.0
psycopg2-binary==2.9.10

# Validation and serialization
pydantic==2.10.4
pydantic-settings==2.7.0

# HTTP client
httpx==0.28.1
aiohttp==3.11.11

# Date/time handling
python-dateutil==2.9.0

# Utilities
python-slugify==8.0.4
loguru==0.7.3

# Testing
pytest==8.3.4
pytest-asyncio==0.24.0
pytest-cov==6.0.0
httpx==0.28.1  # For testing API endpoints

# Development
black==24.10.0
flake8==7.1.1
mypy==1.14.0
isort==5.13.2
```

### Step 4: Install Dependencies

```bash
# Install all dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep fastapi
pip list | grep openai
```

**Expected output:**
```
fastapi                 0.115.6
openai                  1.59.5
openai-agents           0.1.0
```

### Step 5: Create Configuration Files

**`config/settings.py`** (Application settings):

```python
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
```

**`config/database.py`** (Database configuration):

```python
"""
Database configuration and session management
Uses SQLAlchemy 2.0+ async engine
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from config.settings import settings

# Convert postgres:// to postgresql+asyncpg:// for async support
DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before using
)

# Create async session maker
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """
    Dependency for getting async database session
    Usage in FastAPI:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connection"""
    await engine.dispose()
```

**`config/logging.py`** (Logging configuration):

```python
"""
Logging configuration using Loguru
Provides structured logging with colors and file rotation
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
    rotation="00:00",  # New file at midnight
    retention="30 days",  # Keep logs for 30 days
    compression="zip",  # Compress old logs
    level=settings.LOG_LEVEL,
    format=settings.LOG_FORMAT,
)

# Export configured logger
__all__ = ["logger"]
```

### Step 6: Create Core Agent System

**`agents/base_agent.py`** (Base agent class):

```python
"""
Base agent class for all AI agents
Provides common functionality and interface
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from openai import AsyncOpenAI
from config.settings import settings
from config.logging import logger


class BaseAgent(ABC):
    """
    Abstract base class for all AI agents
    Enforces consistent interface across agent types
    """

    def __init__(
        self,
        name: str,
        model: str = settings.OPENAI_DEFAULT_MODEL,
        temperature: float = 0.7,
    ):
        """
        Initialize base agent

        Args:
            name: Agent name for identification
            model: OpenAI model to use
            temperature: Creativity level (0.0-1.0)
        """
        self.name = name
        self.model = model
        self.temperature = temperature
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        logger.info(f"Initialized agent: {name} with model: {model}")

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent task

        Args:
            input_data: Input parameters for the task

        Returns:
            Task results with metadata
        """
        pass

    async def _call_openai(
        self,
        messages: list[Dict[str, str]],
        tools: Optional[list] = None,
    ) -> Any:
        """
        Make OpenAI API call with error handling

        Args:
            messages: Chat messages
            tools: Optional function tools

        Returns:
            OpenAI completion response
        """
        try:
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
            }

            if tools:
                kwargs["tools"] = tools

            response = await self.client.chat.completions.create(**kwargs)
            return response

        except Exception as e:
            logger.error(f"OpenAI API error in {self.name}: {str(e)}")
            raise

    def get_status(self) -> Dict[str, Any]:
        """Get agent status"""
        return {
            "name": self.name,
            "model": self.model,
            "temperature": self.temperature,
            "status": "ready",
        }
```

**`agents/seo_writer.py`** (SEO Writer agent):

```python
"""
SEO Writer Agent
Generates SEO-optimized content using OpenAI
"""
from typing import Any, Dict
from agents.base_agent import BaseAgent
from config.logging import logger


class SEOWriterAgent(BaseAgent):
    """
    Agent specialized in writing SEO-optimized content
    Handles blog posts, articles, and web copy
    """

    def __init__(self):
        super().__init__(
            name="SEO Writer",
            model="gpt-4o-mini",  # Fast and cost-effective for drafts
            temperature=0.8,  # Higher creativity for content
        )

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate SEO-optimized content

        Args:
            input_data: {
                "topic": str,
                "keywords": list[str],
                "tone": str,
                "length": int (words)
            }

        Returns:
            {
                "content": str,
                "title": str,
                "meta_description": str,
                "keywords_used": list[str]
            }
        """
        topic = input_data.get("topic", "")
        keywords = input_data.get("keywords", [])
        tone = input_data.get("tone", "professional")
        target_length = input_data.get("length", 1000)

        logger.info(f"SEO Writer generating content for: {topic}")

        # Create system and user messages
        system_message = {
            "role": "system",
            "content": f"""You are an expert SEO content writer. You create engaging,
            high-quality content optimized for search engines while maintaining readability
            and value for human readers. Write in a {tone} tone.""",
        }

        user_message = {
            "role": "user",
            "content": f"""Write a {target_length}-word SEO-optimized article about: {topic}

Target keywords: {', '.join(keywords)}

Include:
1. Compelling title with primary keyword
2. Meta description (150-160 characters)
3. Well-structured article with headers (H2, H3)
4. Natural keyword integration
5. Strong introduction and conclusion

Return the content in this exact format:
TITLE: [title here]
META_DESCRIPTION: [meta description here]
CONTENT:
[article content here]
""",
        }

        # Call OpenAI API
        response = await self._call_openai([system_message, user_message])
        content_text = response.choices[0].message.content

        # Parse response
        result = self._parse_response(content_text, keywords)

        logger.info(f"SEO Writer completed content for: {topic}")
        return result

    def _parse_response(self, text: str, keywords: list[str]) -> Dict[str, Any]:
        """Parse OpenAI response into structured format"""
        lines = text.split("\n")
        title = ""
        meta_description = ""
        content = []

        in_content = False

        for line in lines:
            if line.startswith("TITLE:"):
                title = line.replace("TITLE:", "").strip()
            elif line.startswith("META_DESCRIPTION:"):
                meta_description = line.replace("META_DESCRIPTION:", "").strip()
            elif line.startswith("CONTENT:"):
                in_content = True
            elif in_content:
                content.append(line)

        content_str = "\n".join(content).strip()

        # Check which keywords were used
        keywords_used = [kw for kw in keywords if kw.lower() in content_str.lower()]

        return {
            "title": title,
            "meta_description": meta_description,
            "content": content_str,
            "keywords_used": keywords_used,
            "word_count": len(content_str.split()),
        }
```

**`agents/email_marketer.py`** (Email Marketer agent):

```python
"""
Email Marketer Agent
Creates email marketing campaigns and sequences
"""
from typing import Any, Dict
from agents.base_agent import BaseAgent
from config.logging import logger


class EmailMarketerAgent(BaseAgent):
    """
    Agent specialized in email marketing
    Handles single emails and drip sequences
    """

    def __init__(self):
        super().__init__(
            name="Email Marketer",
            model="gpt-4o-mini",
            temperature=0.75,
        )

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate email marketing content

        Args:
            input_data: {
                "type": "single" | "sequence",
                "goal": str,
                "audience": str,
                "sequence_length": int (if type=sequence)
            }

        Returns:
            {
                "emails": list[{
                    "subject": str,
                    "preview_text": str,
                    "body": str,
                    "cta": str
                }]
            }
        """
        email_type = input_data.get("type", "single")
        goal = input_data.get("goal", "")
        audience = input_data.get("audience", "general")

        logger.info(f"Email Marketer generating {email_type} for: {goal}")

        if email_type == "sequence":
            return await self._create_sequence(input_data)
        else:
            return await self._create_single_email(input_data)

    async def _create_single_email(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create single email"""
        goal = input_data.get("goal", "")
        audience = input_data.get("audience", "general")

        system_message = {
            "role": "system",
            "content": """You are an expert email marketer. You create compelling
            emails that drive engagement and conversions while respecting the reader's
            time and inbox.""",
        }

        user_message = {
            "role": "user",
            "content": f"""Create a marketing email for:
Goal: {goal}
Audience: {audience}

Include:
1. Compelling subject line (40-50 characters)
2. Preview text (80-100 characters)
3. Email body (short and scannable)
4. Clear call-to-action

Format:
SUBJECT: [subject line]
PREVIEW: [preview text]
BODY:
[email body]
CTA: [call to action]
""",
        }

        response = await self._call_openai([system_message, user_message])
        email_data = self._parse_email(response.choices[0].message.content)

        logger.info(f"Email Marketer completed single email")
        return {"emails": [email_data]}

    async def _create_sequence(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create email drip sequence"""
        # Implementation for sequence creation
        # This would generate multiple emails in a sequence
        pass

    def _parse_email(self, text: str) -> Dict[str, str]:
        """Parse email response into structured format"""
        lines = text.split("\n")
        subject = ""
        preview = ""
        cta = ""
        body = []
        in_body = False

        for line in lines:
            if line.startswith("SUBJECT:"):
                subject = line.replace("SUBJECT:", "").strip()
            elif line.startswith("PREVIEW:"):
                preview = line.replace("PREVIEW:", "").strip()
            elif line.startswith("CTA:"):
                cta = line.replace("CTA:", "").strip()
            elif line.startswith("BODY:"):
                in_body = True
            elif in_body and not line.startswith("CTA:"):
                body.append(line)

        return {
            "subject": subject,
            "preview_text": preview,
            "body": "\n".join(body).strip(),
            "cta": cta,
        }
```

### Step 7: Create API Routes

**`api/routes/health.py`** (Health check endpoint):

```python
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
    Checks if service can accept traffic
    """
    # Add database connection check here
    # Add external service checks here

    return {
        "status": "ready",
        "timestamp": datetime.utcnow().isoformat(),
    }
```

**`api/routes/agents.py`** (Agent endpoints):

```python
"""
Agent API endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from agents.seo_writer import SEOWriterAgent
from agents.email_marketer import EmailMarketerAgent
from config.logging import logger

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Initialize agents (singleton pattern)
seo_writer = SEOWriterAgent()
email_marketer = EmailMarketerAgent()


class AgentJobRequest(BaseModel):
    """Request schema for agent job"""

    agent_type: str  # "seo_writer" | "email_marketer"
    input_data: Dict[str, Any]


class AgentJobResponse(BaseModel):
    """Response schema for agent job"""

    job_id: str
    status: str
    result: Dict[str, Any] | None = None
    error: str | None = None


@router.post("/execute", response_model=AgentJobResponse)
async def execute_agent_job(request: AgentJobRequest):
    """
    Execute agent job synchronously
    For async jobs, use /api/jobs endpoints instead
    """
    try:
        logger.info(f"Executing {request.agent_type} agent")

        # Route to appropriate agent
        if request.agent_type == "seo_writer":
            result = await seo_writer.execute(request.input_data)
        elif request.agent_type == "email_marketer":
            result = await email_marketer.execute(request.input_data)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown agent type: {request.agent_type}")

        return AgentJobResponse(
            job_id="sync",  # For sync execution
            status="completed",
            result=result,
        )

    except Exception as e:
        logger.error(f"Agent execution error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_agents_status():
    """Get status of all available agents"""
    return {
        "agents": [
            seo_writer.get_status(),
            email_marketer.get_status(),
        ]
    }
```

### Step 8: Create Main FastAPI Application

**`main.py`** (FastAPI app):

```python
"""
FastAPI Application Entry Point
Main application with CORS, routing, and lifecycle management
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from config.database import init_db, close_db
from config.logging import logger
from api.routes import health, agents


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")

    # Initialize database
    await init_db()
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down application")
    await close_db()
    logger.info("Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered marketing agents API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Include routers
app.include_router(health.router)
app.include_router(agents.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
```

### Step 9: Create Development Scripts

**`run.py`** (Development server):

```python
"""
Development server runner
Starts FastAPI with hot reload
"""
import uvicorn
from config.settings import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Hot reload in development
        log_level="info",
    )
```

**`scripts/test_agents.py`** (Test agents locally):

```python
"""
Script to test agents locally
Run: python scripts/test_agents.py
"""
import asyncio
from agents.seo_writer import SEOWriterAgent
from agents.email_marketer import EmailMarketerAgent


async def test_seo_writer():
    """Test SEO Writer agent"""
    agent = SEOWriterAgent()

    result = await agent.execute(
        {
            "topic": "Benefits of AI in Marketing",
            "keywords": ["AI marketing", "automation", "ROI"],
            "tone": "professional",
            "length": 800,
        }
    )

    print("SEO Writer Result:")
    print(f"Title: {result['title']}")
    print(f"Meta: {result['meta_description']}")
    print(f"Word Count: {result['word_count']}")
    print("\n" + "=" * 80 + "\n")


async def test_email_marketer():
    """Test Email Marketer agent"""
    agent = EmailMarketerAgent()

    result = await agent.execute(
        {
            "type": "single",
            "goal": "Promote new AI marketing course",
            "audience": "marketing professionals",
        }
    )

    print("Email Marketer Result:")
    print(f"Subject: {result['emails'][0]['subject']}")
    print(f"Preview: {result['emails'][0]['preview_text']}")
    print("\n" + "=" * 80 + "\n")


async def main():
    """Run all tests"""
    await test_seo_writer()
    await test_email_marketer()


if __name__ == "__main__":
    asyncio.run(main())
```

### Step 10: Create .gitignore for Backend

Create `market-ai/.gitignore`:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
*.egg-info/
dist/
build/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.sqlite

# Testing
.pytest_cache/
.coverage
htmlcov/

# OS
.DS_Store
Thumbs.db
```

## Verification

### Step 1: Activate Virtual Environment

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate
```

### Step 2: Verify Dependencies

```bash
pip list | grep -E "fastapi|openai|uvicorn"
```

**Expected output:**
```
fastapi                 0.115.6
openai                  1.59.5
openai-agents           0.1.0
uvicorn                 0.34.0
```

### Step 3: Start Development Server

```bash
python run.py
```

**Expected output:**
```
INFO:     Will watch for changes in these directories: ['/Users/kcdacre8tor/agentic-marketing-dashboard/market-ai']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345]
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 4: Test Health Endpoint

```bash
# In new terminal
curl http://localhost:8000/health
```

**Expected output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-25T12:00:00",
  "service": "Agentic Marketing AI",
  "version": "1.0.0"
}
```

### Step 5: Test API Documentation

Visit http://localhost:8000/docs in your browser. You should see:
- Interactive Swagger UI
- Health endpoints listed
- Agent endpoints listed
- Ability to test endpoints directly

### Step 6: Test Agent Execution (Optional)

```bash
# Test agents locally (requires OpenAI API key in .env)
python scripts/test_agents.py
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:**
```bash
# Verify virtual environment is activated
which python
# Should show: /Users/.../market-ai/venv/bin/python

# If not, activate it
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "ImportError: cannot import name 'Settings'"

**Solution:**
```bash
# Ensure all __init__.py files exist
find . -type d -exec touch {}/__init__.py \;

# Verify PYTHONPATH includes current directory
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue: Port 8000 already in use

**Solution:**
```bash
# Find process using port 8000
lsof -ti:8000

# Kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --port 8001
```

### Issue: CORS errors when testing from frontend

**Solution:**
1. Check `settings.py` CORS_ORIGINS includes your frontend URL
2. Restart FastAPI server after changing settings
3. Verify frontend is making requests to correct backend URL

### Issue: OpenAI API errors

**Solution:**
1. Verify API key is set in `.env` file
2. Check OpenAI account has credits
3. Test with simpler model (gpt-3.5-turbo) first
4. Check API key permissions

## Next Steps

✅ **Phase 1.2 Complete!** You now have a fully functional FastAPI backend.

**Continue to:**
- [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md) - Set up PostgreSQL database schema
- [04_ENVIRONMENT_CONFIG.md](./04_ENVIRONMENT_CONFIG.md) - Configure environment variables
- [05_DEPLOYMENT_CONFIG.md](./05_DEPLOYMENT_CONFIG.md) - Prepare for deployment

**Good to know:**
- Always activate virtual environment before running Python commands
- FastAPI auto-reloads on code changes in development mode
- Use `/docs` endpoint to test APIs interactively
- Logs are written to `logs/` directory with daily rotation
- Agent costs are tracked automatically (implement in Phase 2)
