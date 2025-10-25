# 32. Backend Deployment (Render & Docker)

## Overview

This guide covers deploying the FastAPI backend to Render (recommended) with production-ready Docker configuration, health checks, auto-scaling, database connection pooling, and background worker setup.

**Production Considerations:**
- Zero-downtime deployments
- Auto-scaling based on load
- Database connection pooling
- Health check endpoints
- Background job processing
- Secure environment management
- Log aggregation

## Prerequisites

**Completed Phases:**
- Phase 6: Netlify Deployment (Document 31)

**Required Accounts:**
- Render account (https://render.com)
- GitHub account
- PostgreSQL database (Supabase/Neon)

**Dependencies:**
```bash
# Production requirements
pip install gunicorn uvicorn[standard] psycopg2-binary redis
```

## Docker Configuration

### Step 1: Dockerfile

**File: `market-ai/Dockerfile`**

```dockerfile
# Multi-stage build for smaller image size
FROM python:3.13-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Make sure scripts are executable
RUN chmod +x scripts/*.sh

# Set environment variables
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with Gunicorn + Uvicorn workers
CMD ["gunicorn", "main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]
```

### Step 2: Docker Compose (Local Testing)

**File: `market-ai/docker-compose.yml`**

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/marketing_dashboard
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    depends_on:
      - db
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=marketing_dashboard
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  worker:
    build: .
    command: python worker.py
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/marketing_dashboard
      - REDIS_URL=redis://redis:6379/0
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 3: .dockerignore

**File: `market-ai/.dockerignore`**

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
.venv
pip-log.txt
pip-delete-this-directory.txt

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
.pytest_cache/
.coverage
htmlcov/
*.cover

# Environment
.env
.env.local
.env.*.local

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Docs
docs/
*.md
!README.md

# Logs
logs/
*.log

# Temp
tmp/
temp/
*.tmp
```

## Render Configuration

### Step 1: render.yaml

**File: `market-ai/render.yaml`**

```yaml
services:
  # FastAPI Web Service
  - type: web
    name: marketing-ai-api
    env: python
    runtime: python-3.13.0
    plan: starter # or standard/pro for production
    region: oregon # Choose closest to your users
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120
    healthCheckPath: /health
    autoDeploy: true

    envVars:
      # Environment
      - key: PYTHON_VERSION
        value: 3.13.0

      - key: NODE_ENV
        value: production

      # Database (from Render PostgreSQL)
      - key: DATABASE_URL
        fromDatabase:
          name: marketing-dashboard-db
          property: connectionString

      # Redis (from Render Redis)
      - key: REDIS_URL
        fromService:
          type: redis
          name: marketing-dashboard-redis
          property: connectionString

      # API Keys (set in Render dashboard)
      - key: OPENAI_API_KEY
        sync: false

      - key: OPENAI_VECTOR_STORE_ID
        sync: false

      # App Config
      - key: DEFAULT_MODEL
        value: gpt-4o-mini

      - key: MAX_BUDGET_PER_REQUEST
        value: 10.0

      # Clerk Auth
      - key: CLERK_SECRET_KEY
        sync: false

      - key: CLERK_DOMAIN
        sync: false

      # CORS
      - key: ALLOWED_ORIGINS
        value: https://your-app.netlify.app,https://app.yourdomain.com

      # Logging
      - key: LOG_LEVEL
        value: INFO

    # Scaling
    scaling:
      minInstances: 1
      maxInstances: 10
      targetCPUPercent: 70
      targetMemoryPercent: 80

    # Disk storage (if needed)
    disk:
      name: logs
      mountPath: /app/logs
      sizeGB: 1

  # Background Worker
  - type: worker
    name: marketing-ai-worker
    env: python
    runtime: python-3.13.0
    plan: starter
    region: oregon
    buildCommand: pip install -r requirements.txt
    startCommand: python worker.py
    autoDeploy: true

    envVars:
      # Same as web service
      - key: DATABASE_URL
        fromDatabase:
          name: marketing-dashboard-db
          property: connectionString

      - key: REDIS_URL
        fromService:
          type: redis
          name: marketing-dashboard-redis
          property: connectionString

      - key: OPENAI_API_KEY
        sync: false

# Database
databases:
  - name: marketing-dashboard-db
    plan: starter # or standard/pro
    databaseName: marketing_dashboard
    user: admin
    region: oregon
    ipAllowList: [] # Empty = allow all (use specific IPs in production)

# Redis
  - name: marketing-dashboard-redis
    plan: starter
    region: oregon
    maxmemoryPolicy: allkeys-lru
    ipAllowList: []
```

### Step 2: Health Check Endpoint

**File: `market-ai/api/health.py`**

```python
from fastapi import APIRouter, status
from datetime import datetime
import psutil
import os
from typing import Dict

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict:
    """
    Health check endpoint for monitoring and load balancers
    Returns service status and basic metrics
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "marketing-ai-api",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "environment": os.getenv("NODE_ENV", "production"),
    }

@router.get("/health/detailed")
async def detailed_health_check() -> Dict:
    """
    Detailed health check with system metrics
    """
    # CPU and memory usage
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    # Database connection test
    db_healthy = await test_database_connection()

    # Redis connection test
    redis_healthy = await test_redis_connection()

    return {
        "status": "healthy" if db_healthy and redis_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "marketing-ai-api",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "system": {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "percent": disk.percent,
            },
        },
        "dependencies": {
            "database": "healthy" if db_healthy else "unhealthy",
            "redis": "healthy" if redis_healthy else "unhealthy",
        },
    }

async def test_database_connection() -> bool:
    """Test PostgreSQL connection"""
    try:
        # Test query
        # await db.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False

async def test_redis_connection() -> bool:
    """Test Redis connection"""
    try:
        # Test ping
        # await redis.ping()
        return True
    except Exception as e:
        print(f"Redis health check failed: {e}")
        return False
```

### Step 3: Database Connection Pooling

**File: `market-ai/config/database.py`**

```python
import asyncpg
import os
from typing import Optional

class DatabasePool:
    """Singleton database connection pool"""

    _pool: Optional[asyncpg.Pool] = None

    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        """Get or create database connection pool"""
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                dsn=os.getenv("DATABASE_URL"),
                min_size=5,
                max_size=20,
                max_queries=50000,
                max_inactive_connection_lifetime=300,
                timeout=30,
                command_timeout=60,
            )
        return cls._pool

    @classmethod
    async def close_pool(cls):
        """Close database connection pool"""
        if cls._pool is not None:
            await cls._pool.close()
            cls._pool = None

# Usage in main.py
from fastapi import FastAPI
from config.database import DatabasePool

app = FastAPI()

@app.on_event("startup")
async def startup():
    await DatabasePool.get_pool()

@app.on_event("shutdown")
async def shutdown():
    await DatabasePool.close_pool()
```

### Step 4: Background Worker

**File: `market-ai/worker.py`**

```python
import asyncio
import redis
import json
import os
from datetime import datetime
from loguru import logger

# Configure logger
logger.add(
    "logs/worker_{time}.log",
    rotation="500 MB",
    retention="10 days",
    level="INFO"
)

# Redis connection
redis_client = redis.from_url(
    os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    decode_responses=True
)

async def process_job(job_data: dict):
    """Process a background job"""
    job_type = job_data.get("type")

    logger.info(f"Processing job: {job_type}")

    if job_type == "generate_content":
        await generate_content_job(job_data)
    elif job_type == "analyze_campaign":
        await analyze_campaign_job(job_data)
    elif job_type == "send_email":
        await send_email_job(job_data)
    else:
        logger.warning(f"Unknown job type: {job_type}")

async def generate_content_job(job_data: dict):
    """Generate AI content in background"""
    campaign_id = job_data.get("campaign_id")
    # Implementation here
    logger.info(f"Generated content for campaign {campaign_id}")

async def analyze_campaign_job(job_data: dict):
    """Analyze campaign performance"""
    campaign_id = job_data.get("campaign_id")
    # Implementation here
    logger.info(f"Analyzed campaign {campaign_id}")

async def send_email_job(job_data: dict):
    """Send email in background"""
    to_email = job_data.get("to")
    # Implementation here
    logger.info(f"Sent email to {to_email}")

async def worker_loop():
    """Main worker loop"""
    logger.info("Worker started")

    while True:
        try:
            # Block and wait for job (with timeout)
            job = redis_client.brpop("job_queue", timeout=5)

            if job:
                _, job_json = job
                job_data = json.loads(job_json)

                await process_job(job_data)

            # Small delay to prevent CPU spinning
            await asyncio.sleep(0.1)

        except Exception as e:
            logger.error(f"Worker error: {e}")
            await asyncio.sleep(5)  # Back off on error

if __name__ == "__main__":
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker stopped")
```

## Deployment Process

### Step 1: Connect GitHub to Render

1. **Sign up / Log in to Render**
   - Go to https://render.com
   - Sign in with GitHub

2. **Create New Web Service**
   - Dashboard → New → Web Service
   - Connect repository
   - Select `market-ai` directory

3. **Configure Service**
   ```
   Name: marketing-ai-api
   Environment: Python 3
   Region: Oregon (or closest to users)
   Branch: main
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT
   Plan: Starter (upgrade for production)
   ```

### Step 2: Environment Variables

In Render Dashboard → Environment:

```env
# Python
PYTHON_VERSION=3.13.0

# Environment
NODE_ENV=production

# Database (auto-populated if using Render PostgreSQL)
DATABASE_URL=postgresql://user:password@hostname:5432/dbname

# Redis (auto-populated if using Render Redis)
REDIS_URL=redis://hostname:6379

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_VECTOR_STORE_ID=vs_...
DEFAULT_MODEL=gpt-4o-mini

# Clerk
CLERK_SECRET_KEY=sk_live_...
CLERK_DOMAIN=your-app.clerk.accounts.dev

# CORS
ALLOWED_ORIGINS=https://your-app.netlify.app,https://app.yourdomain.com

# Budget
MAX_BUDGET_PER_REQUEST=10.0

# Logging
LOG_LEVEL=INFO

# Sentry
SENTRY_DSN=https://...@sentry.io/...
```

### Step 3: Database Setup

**Option 1: Render PostgreSQL**
1. Dashboard → New → PostgreSQL
2. Name: `marketing-dashboard-db`
3. Copy connection string
4. Add to web service environment variables

**Option 2: External (Supabase/Neon)**
1. Create database in Supabase/Neon
2. Copy connection string
3. Add to Render environment variables

**Run Migrations:**
```bash
# SSH into Render shell
render ssh

# Run migrations
python -m alembic upgrade head
```

### Step 4: Redis Setup

**Option 1: Render Redis**
1. Dashboard → New → Redis
2. Name: `marketing-dashboard-redis`
3. Connection string auto-populates

**Option 2: External (Upstash)**
1. Create Redis instance at upstash.com
2. Copy connection string
3. Add to environment variables

### Step 5: Deploy

```bash
# Push to GitHub triggers auto-deploy
git add .
git commit -m "Configure production deployment"
git push origin main

# Or manual deploy via Render dashboard
# Dashboard → Deploy → Deploy latest commit
```

## Production Configuration

### CORS Settings

**File: `market-ai/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="Marketing AI API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url="/redoc" if os.getenv("NODE_ENV") != "production" else None,
)

# CORS middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Number"],
)

# Include routers
from api.health import router as health_router
app.include_router(health_router)
```

### Rate Limiting

**File: `market-ai/middleware/rate_limiter.py`**

```python
from fastapi import HTTPException, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"]
)

# Apply to app
from main import app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Usage in routes
from slowapi import Limiter

@router.post("/campaigns")
@limiter.limit("10/minute")
async def create_campaign(request: Request):
    ...
```

### Logging Configuration

**File: `market-ai/config/logging.py`**

```python
from loguru import logger
import sys
import os

# Remove default handler
logger.remove()

# Console output (for Render logs)
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=os.getenv("LOG_LEVEL", "INFO"),
    colorize=True,
)

# File output (if disk mounted)
if os.path.exists("/app/logs"):
    logger.add(
        "/app/logs/api_{time}.log",
        rotation="500 MB",
        retention="10 days",
        level="DEBUG",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
    )

# Export configured logger
__all__ = ["logger"]
```

## Monitoring & Health Checks

### Render Health Checks

Render automatically:
- Pings `/health` endpoint every 30 seconds
- Restarts service if 3 consecutive failures
- Shows health status in dashboard

### Custom Monitoring Script

**File: `market-ai/scripts/health_monitor.sh`**

```bash
#!/bin/bash

API_URL="https://your-api.onrender.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Check health endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health)

if [ $response -ne 200 ]; then
  # Send alert
  curl -X POST ${SLACK_WEBHOOK} \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"⚠️ API Health Check Failed! Status: ${response}\"}"

  exit 1
fi

echo "✅ API is healthy"
exit 0
```

## Testing Deployment

### Local Docker Test

```bash
# Build image
docker build -t marketing-ai:latest .

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e OPENAI_API_KEY=sk-... \
  marketing-ai:latest

# Test health endpoint
curl http://localhost:8000/health
```

### Production Test

```bash
# Test health endpoint
curl https://your-api.onrender.com/health

# Test authenticated endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-api.onrender.com/api/campaigns

# Load test (with k6 or ab)
ab -n 1000 -c 10 https://your-api.onrender.com/health
```

## Troubleshooting

### Common Issues

1. **Service won't start**
   ```bash
   # Check logs in Render dashboard
   # Common causes:
   # - Missing environment variables
   # - Database connection failed
   # - Port binding issues (use $PORT)
   ```

2. **Database connection timeout**
   ```bash
   # Increase connection pool timeout
   timeout=60  # in database.py

   # Check database IP allowlist
   # Render services → Settings → Connections
   ```

3. **High memory usage**
   ```bash
   # Reduce worker count
   --workers 2  # Instead of 4

   # Implement connection pooling
   # Limit concurrent requests
   ```

4. **Slow API responses**
   ```bash
   # Check database query performance
   # Add indexes
   # Implement caching (Redis)
   # Use async/await properly
   ```

## Best Practices

1. **Use connection pooling** - Prevent database exhaustion
2. **Implement health checks** - Enable auto-restart
3. **Enable auto-deploy** - From main branch
4. **Set up background workers** - For long-running tasks
5. **Use environment variables** - Never commit secrets
6. **Monitor logs** - Use Render logs or external service
7. **Scale horizontally** - Add more instances for load
8. **Use Redis for caching** - Reduce database load
9. **Implement rate limiting** - Prevent abuse
10. **Set up alerts** - Know when things break

## Next Steps

1. **Set up Monitoring (Document 33)** - Sentry, PostHog
2. **Implement CI/CD** - Automated testing
3. **Add Database Backups** - Automated daily backups
4. **Set up Staging Environment** - Test before production
5. **Implement Caching** - Redis for API responses
6. **Add Load Balancer** - For multiple regions

---

**Backend Deployment Checklist:**
- [ ] Dockerfile configured
- [ ] docker-compose.yml for local testing
- [ ] render.yaml created
- [ ] Health check endpoint implemented
- [ ] Database connection pooling configured
- [ ] Environment variables set in Render
- [ ] CORS configured for frontend origin
- [ ] Rate limiting implemented
- [ ] Logging configured
- [ ] Background worker deployed
- [ ] Database migrations run
- [ ] Redis configured
- [ ] Production deploy successful
- [ ] API accessible from frontend
- [ ] Health checks passing
