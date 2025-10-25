# Phase 1.3: Database Schema Setup (PostgreSQL)

## Overview

This document guides you through setting up a PostgreSQL database with Supabase (or Neon as an alternative), creating tables for campaigns, content assets, agent jobs, and budget tracking.

**Outcomes:**
- PostgreSQL database configured (Supabase or Neon)
- Complete database schema implemented
- Alembic migrations configured
- Seed data for development
- Database connection verified from backend

## Prerequisites

**Required:**
- Completed [01_PROJECT_SETUP.md](./01_PROJECT_SETUP.md)
- Completed [02_BACKEND_SETUP.md](./02_BACKEND_SETUP.md)
- Supabase account (preferred) OR Neon account
- PostgreSQL client (psql) or GUI tool (optional: TablePlus, pgAdmin)

**Recommended:**
- Basic SQL knowledge
- Understanding of database migrations
- Familiarity with ORMs (SQLAlchemy)

## Step-by-Step Instructions

### Step 1: Choose Database Provider

**Option A: Supabase (Recommended)**
- ✅ Free tier: 500MB database + 1GB file storage
- ✅ Built-in Auth, Storage, and Realtime
- ✅ Auto-generated API
- ✅ Great for MVP and scaling

**Option B: Neon**
- ✅ Free tier: 3GB storage
- ✅ Serverless Postgres
- ✅ Auto-scaling
- ✅ Branch-based development

We'll use **Supabase** as the primary option with Neon instructions provided as alternative.

### Step 2: Set Up Supabase Project

#### Create Supabase Project

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (recommended)
4. Click "New project"
5. Configure:
   - **Organization**: Select or create
   - **Name**: `agentic-marketing`
   - **Database Password**: Generate strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier

6. Click "Create new project" (takes ~2 minutes)

#### Get Connection Details

1. Go to **Project Settings** → **Database**
2. Find **Connection string** section
3. Copy the URI (format: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...`)

**Save these values:**
```
Database Host: db.[PROJECT-REF].supabase.co
Database Name: postgres
Database User: postgres
Database Password: [your-password]
Database Port: 5432

Connection String:
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Create Database Models

Navigate to backend directory:
```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate
```

**`models/base.py`** (Base model with common fields):

```python
"""
Base model with common fields
All models inherit from this
"""
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from config.database import Base
import uuid


class BaseModel(Base):
    """
    Abstract base model with common fields
    - id: UUID primary key
    - created_at: Timestamp when record was created
    - updated_at: Timestamp when record was last updated
    """

    __abstract__ = True

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        unique=True,
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
```

**`models/campaign.py`** (Campaign model):

```python
"""
Campaign model
Represents marketing campaigns
"""
from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class CampaignStatus(str, enum.Enum):
    """Campaign status enum"""

    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Campaign(BaseModel):
    """
    Marketing campaign entity

    Tracks campaigns with budgets, dates, and performance metrics
    """

    __tablename__ = "campaigns"

    name = Column(String(255), nullable=False, index=True)
    description = Column(String(1000))
    status = Column(
        SQLEnum(CampaignStatus),
        nullable=False,
        default=CampaignStatus.DRAFT,
        index=True,
    )

    # Budget and spend
    budget = Column(Float, nullable=False, default=0.0)
    spend = Column(Float, nullable=False, default=0.0)

    # Dates
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True))

    # Performance metrics (updated by analytics)
    impressions = Column(Float, default=0.0)
    clicks = Column(Float, default=0.0)
    conversions = Column(Float, default=0.0)
    roi = Column(Float, default=0.0)  # Return on investment

    # Relationships
    content_assets = relationship(
        "ContentAsset",
        back_populates="campaign",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<Campaign(id={self.id}, name='{self.name}', status={self.status})>"

    @property
    def budget_remaining(self) -> float:
        """Calculate remaining budget"""
        return self.budget - self.spend

    @property
    def budget_used_percentage(self) -> float:
        """Calculate percentage of budget used"""
        if self.budget == 0:
            return 0.0
        return (self.spend / self.budget) * 100
```

**`models/content_asset.py`** (Content Asset model):

```python
"""
Content Asset model
Represents content created by AI agents
"""
from sqlalchemy import Column, String, Text, Enum as SQLEnum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from models.base import BaseModel


class ContentType(str, enum.Enum):
    """Content type enum"""

    BLOG = "blog"
    EMAIL = "email"
    SOCIAL = "social"
    VIDEO_SCRIPT = "video_script"
    AD_COPY = "ad_copy"
    LANDING_PAGE = "landing_page"


class ContentStatus(str, enum.Enum):
    """Content status enum"""

    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ContentAsset(BaseModel):
    """
    Content asset entity

    Represents content created by AI agents (blog posts, emails, etc.)
    """

    __tablename__ = "content_assets"

    title = Column(String(500), nullable=False, index=True)
    content = Column(Text, nullable=False)
    content_type = Column(
        SQLEnum(ContentType),
        nullable=False,
        index=True,
    )
    status = Column(
        SQLEnum(ContentStatus),
        nullable=False,
        default=ContentStatus.DRAFT,
        index=True,
    )

    # Metadata (SEO, keywords, etc.)
    metadata = Column(JSON, default={})

    # Foreign keys
    campaign_id = Column(
        UUID(as_uuid=True),
        ForeignKey("campaigns.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    agent_job_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_jobs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Relationships
    campaign = relationship("Campaign", back_populates="content_assets")
    agent_job = relationship("AgentJob", back_populates="content_assets")

    def __repr__(self):
        return f"<ContentAsset(id={self.id}, title='{self.title}', type={self.content_type})>"
```

**`models/agent_job.py`** (Agent Job model):

```python
"""
Agent Job model
Tracks AI agent task execution
"""
from sqlalchemy import Column, String, Text, Float, DateTime, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class AgentType(str, enum.Enum):
    """Agent type enum"""

    SEO_WRITER = "seo_writer"
    EMAIL_MARKETER = "email_marketer"
    SOCIAL_MEDIA = "social_media"
    ANALYST = "analyst"
    OPTIMIZER = "optimizer"


class JobStatus(str, enum.Enum):
    """Job status enum"""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AgentJob(BaseModel):
    """
    Agent job entity

    Tracks execution of AI agent tasks with inputs, outputs, and costs
    """

    __tablename__ = "agent_jobs"

    agent_type = Column(
        SQLEnum(AgentType),
        nullable=False,
        index=True,
    )

    status = Column(
        SQLEnum(JobStatus),
        nullable=False,
        default=JobStatus.PENDING,
        index=True,
    )

    # Job data
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON)

    # Execution tracking
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))

    # Error handling
    error_message = Column(Text)
    retry_count = Column(Float, default=0)

    # Cost tracking
    tokens_used = Column(Float, default=0)
    cost = Column(Float, default=0.0)

    # Relationships
    content_assets = relationship(
        "ContentAsset",
        back_populates="agent_job",
        cascade="all, delete-orphan",
    )

    budget_entries = relationship(
        "BudgetEntry",
        back_populates="agent_job",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<AgentJob(id={self.id}, type={self.agent_type}, status={self.status})>"

    @property
    def duration_seconds(self) -> float | None:
        """Calculate job duration in seconds"""
        if not self.started_at or not self.completed_at:
            return None
        delta = self.completed_at - self.started_at
        return delta.total_seconds()
```

**`models/budget_entry.py`** (Budget tracking model):

```python
"""
Budget Entry model
Tracks API costs and spending
"""
from sqlalchemy import Column, String, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum
from models.base import BaseModel


class ResourceType(str, enum.Enum):
    """Resource type enum"""

    OPENAI_API = "openai_api"
    WEB_SEARCH = "web_search"
    FILE_SEARCH = "file_search"
    IMAGE_GENERATION = "image_generation"
    EMBEDDING = "embedding"


class BudgetEntry(BaseModel):
    """
    Budget entry entity

    Tracks individual API costs and resource usage
    """

    __tablename__ = "budget_entries"

    resource_type = Column(
        SQLEnum(ResourceType),
        nullable=False,
        index=True,
    )

    # Cost details
    cost = Column(Float, nullable=False)
    tokens_used = Column(Float, default=0)
    model_used = Column(String(100))

    # Context
    description = Column(String(500))

    # Foreign keys
    agent_job_id = Column(
        UUID(as_uuid=True),
        ForeignKey("agent_jobs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Relationships
    agent_job = relationship("AgentJob", back_populates="budget_entries")

    def __repr__(self):
        return f"<BudgetEntry(id={self.id}, type={self.resource_type}, cost=${self.cost:.4f})>"
```

**`models/__init__.py`** (Export all models):

```python
"""
Database models package
"""
from models.base import BaseModel
from models.campaign import Campaign, CampaignStatus
from models.content_asset import ContentAsset, ContentType, ContentStatus
from models.agent_job import AgentJob, AgentType, JobStatus
from models.budget_entry import BudgetEntry, ResourceType

__all__ = [
    "BaseModel",
    "Campaign",
    "CampaignStatus",
    "ContentAsset",
    "ContentType",
    "ContentStatus",
    "AgentJob",
    "AgentType",
    "JobStatus",
    "BudgetEntry",
    "ResourceType",
]
```

### Step 4: Set Up Alembic for Migrations

Initialize Alembic:

```bash
# Make sure you're in market-ai directory with venv activated
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate

# Initialize Alembic
alembic init alembic
```

**`alembic/env.py`** (Configure Alembic):

```python
"""
Alembic environment configuration
"""
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import asyncio

# Import models
from models import Base
from config.settings import settings

# Alembic Config object
config = context.config

# Set database URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.DATABASE_URL.replace(
        "postgresql://", "postgresql+asyncpg://"
    )

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

**`alembic.ini`** (Update database URL):

```ini
# alembic.ini (generated file - update these sections)

[alembic]
script_location = alembic
prepend_sys_path = .
version_path_separator = os

# Database URL - will be overridden by env.py from settings
sqlalchemy.url = postgresql://user:pass@localhost/dbname

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### Step 5: Create Initial Migration

Generate migration from models:

```bash
# Create initial migration
alembic revision --autogenerate -m "initial_schema"

# This creates a file in alembic/versions/
# Example: alembic/versions/abc123_initial_schema.py
```

**Review the generated migration file** in `alembic/versions/`:

```python
"""initial_schema

Revision ID: abc123def456
Revises:
Create Date: 2025-10-25 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic ###
    # (Alembic will generate CREATE TABLE statements here)
    # ### end Alembic commands ###
    pass


def downgrade() -> None:
    # ### commands auto generated by Alembic ###
    # (Alembic will generate DROP TABLE statements here)
    # ### end Alembic commands ###
    pass
```

Apply migration to database:

```bash
# Apply all pending migrations
alembic upgrade head
```

### Step 6: Create Seed Data Script

**`scripts/seed_data.py`** (Populate development data):

```python
"""
Seed database with development data
Run: python scripts/seed_data.py
"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from config.database import AsyncSessionLocal
from models import (
    Campaign,
    CampaignStatus,
    ContentAsset,
    ContentType,
    ContentStatus,
    AgentJob,
    AgentType,
    JobStatus,
)


async def seed_campaigns(db: AsyncSession):
    """Create sample campaigns"""
    campaigns = [
        Campaign(
            name="Q4 Product Launch",
            description="Launch campaign for new AI product",
            status=CampaignStatus.ACTIVE,
            budget=10000.0,
            spend=2500.0,
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow() + timedelta(days=60),
            impressions=125000,
            clicks=3200,
            conversions=145,
            roi=2.3,
        ),
        Campaign(
            name="Holiday Email Series",
            description="Holiday-themed email marketing campaign",
            status=CampaignStatus.ACTIVE,
            budget=5000.0,
            spend=1200.0,
            start_date=datetime.utcnow() - timedelta(days=15),
            end_date=datetime.utcnow() + timedelta(days=45),
            impressions=45000,
            clicks=1800,
            conversions=67,
            roi=1.8,
        ),
        Campaign(
            name="Content Marketing 2025",
            description="Year-long content marketing strategy",
            status=CampaignStatus.DRAFT,
            budget=25000.0,
            spend=0.0,
            start_date=datetime.utcnow() + timedelta(days=30),
        ),
    ]

    db.add_all(campaigns)
    await db.commit()
    print(f"✓ Created {len(campaigns)} campaigns")
    return campaigns


async def seed_content_assets(db: AsyncSession, campaigns: list[Campaign]):
    """Create sample content assets"""
    assets = [
        ContentAsset(
            title="10 Ways AI is Transforming Marketing in 2025",
            content="<p>AI is revolutionizing marketing...</p>",
            content_type=ContentType.BLOG,
            status=ContentStatus.PUBLISHED,
            campaign_id=campaigns[0].id,
            metadata={
                "meta_description": "Discover how AI is changing marketing",
                "keywords": ["AI", "marketing", "automation"],
                "word_count": 1200,
            },
        ),
        ContentAsset(
            title="Holiday Sale Announcement",
            content="Dear valued customer, our holiday sale...",
            content_type=ContentType.EMAIL,
            status=ContentStatus.APPROVED,
            campaign_id=campaigns[1].id,
            metadata={
                "subject": "🎄 Holiday Sale - Up to 50% Off!",
                "preview_text": "Don't miss our biggest sale of the year",
            },
        ),
        ContentAsset(
            title="Product Launch Teaser",
            content="Something amazing is coming...",
            content_type=ContentType.SOCIAL,
            status=ContentStatus.DRAFT,
            campaign_id=campaigns[0].id,
            metadata={
                "platform": "twitter",
                "character_count": 240,
            },
        ),
    ]

    db.add_all(assets)
    await db.commit()
    print(f"✓ Created {len(assets)} content assets")
    return assets


async def seed_agent_jobs(db: AsyncSession, assets: list[ContentAsset]):
    """Create sample agent jobs"""
    jobs = [
        AgentJob(
            agent_type=AgentType.SEO_WRITER,
            status=JobStatus.COMPLETED,
            input_data={
                "topic": "AI in Marketing",
                "keywords": ["AI", "marketing"],
                "length": 1200,
            },
            output_data={
                "title": "10 Ways AI is Transforming Marketing in 2025",
                "word_count": 1200,
            },
            started_at=datetime.utcnow() - timedelta(hours=2),
            completed_at=datetime.utcnow() - timedelta(hours=1, minutes=55),
            tokens_used=2500,
            cost=0.025,
        ),
        AgentJob(
            agent_type=AgentType.EMAIL_MARKETER,
            status=JobStatus.COMPLETED,
            input_data={
                "type": "single",
                "goal": "Holiday sale announcement",
            },
            output_data={
                "subject": "🎄 Holiday Sale - Up to 50% Off!",
            },
            started_at=datetime.utcnow() - timedelta(hours=1),
            completed_at=datetime.utcnow() - timedelta(minutes=55),
            tokens_used=1200,
            cost=0.012,
        ),
        AgentJob(
            agent_type=AgentType.SEO_WRITER,
            status=JobStatus.RUNNING,
            input_data={
                "topic": "Content Strategy for 2025",
                "keywords": ["content", "strategy"],
            },
            started_at=datetime.utcnow() - timedelta(minutes=5),
            tokens_used=500,
            cost=0.005,
        ),
    ]

    # Link first two jobs to content assets
    if len(assets) > 0:
        assets[0].agent_job_id = jobs[0].id
    if len(assets) > 1:
        assets[1].agent_job_id = jobs[1].id

    db.add_all(jobs)
    await db.commit()
    print(f"✓ Created {len(jobs)} agent jobs")


async def main():
    """Run all seed functions"""
    print("🌱 Seeding database...")

    async with AsyncSessionLocal() as db:
        try:
            campaigns = await seed_campaigns(db)
            assets = await seed_content_assets(db, campaigns)
            await seed_agent_jobs(db, assets)

            print("✅ Database seeded successfully!")

        except Exception as e:
            print(f"❌ Error seeding database: {e}")
            await db.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(main())
```

Run seed script:

```bash
python scripts/seed_data.py
```

### Step 7: Create Database Management Scripts

**`scripts/db_reset.py`** (Reset database):

```python
"""
Reset database (drop all tables and recreate)
⚠️ WARNING: This deletes all data!
Run: python scripts/db_reset.py
"""
import asyncio
from config.database import engine, Base
from models import *  # Import all models


async def reset_database():
    """Drop all tables and recreate"""
    print("⚠️  WARNING: This will delete all data!")
    response = input("Continue? (yes/no): ")

    if response.lower() != "yes":
        print("Cancelled.")
        return

    print("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("✓ Dropped all tables")

    print("Creating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✓ Created all tables")

    print("✅ Database reset complete!")


if __name__ == "__main__":
    asyncio.run(reset_database())
```

## Verification

### Step 1: Verify Database Connection

```bash
# Test connection with psql (if installed)
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# List tables
\dt

# Expected output:
# List of relations
#  Schema |       Name       | Type  |  Owner
# --------+------------------+-------+----------
#  public | agent_jobs       | table | postgres
#  public | budget_entries   | table | postgres
#  public | campaigns        | table | postgres
#  public | content_assets   | table | postgres

# Exit psql
\q
```

### Step 2: Verify Tables in Supabase Dashboard

1. Go to Supabase dashboard
2. Click **Table Editor** in sidebar
3. You should see:
   - `campaigns`
   - `content_assets`
   - `agent_jobs`
   - `budget_entries`
   - `alembic_version` (migration tracking)

### Step 3: Test Database from Backend

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate

# Create test script
cat > test_db.py << 'EOF'
import asyncio
from sqlalchemy import select
from config.database import AsyncSessionLocal
from models import Campaign

async def test_db():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Campaign))
        campaigns = result.scalars().all()
        print(f"Found {len(campaigns)} campaigns:")
        for c in campaigns:
            print(f"  - {c.name} ({c.status})")

asyncio.run(test_db())
EOF

python test_db.py
```

**Expected output:**
```
Found 3 campaigns:
  - Q4 Product Launch (CampaignStatus.ACTIVE)
  - Holiday Email Series (CampaignStatus.ACTIVE)
  - Content Marketing 2025 (CampaignStatus.DRAFT)
```

### Step 4: Verify Migrations

```bash
# Check migration status
alembic current

# Expected output:
# abc123def456 (head)

# View migration history
alembic history
```

## Troubleshooting

### Issue: "connection refused" or "could not connect to server"

**Solution:**
1. Verify database URL in `.env` is correct
2. Check Supabase project is not paused (free tier auto-pauses after 7 days inactivity)
3. Verify your IP is not blocked (Supabase has no IP restrictions by default)
4. Test connection with psql or GUI tool first

### Issue: "relation does not exist"

**Solution:**
```bash
# Run migrations
alembic upgrade head

# Or recreate tables
python scripts/db_reset.py
```

### Issue: "password authentication failed"

**Solution:**
1. Verify database password in `.env` matches Supabase
2. Reset password in Supabase dashboard: Settings → Database → Reset Password
3. Update `.env` with new password

### Issue: Alembic autogenerate not detecting models

**Solution:**
1. Ensure all models are imported in `models/__init__.py`
2. Verify `alembic/env.py` imports `from models import Base`
3. Check `target_metadata = Base.metadata` is set

### Issue: "asyncpg.exceptions.InvalidPasswordError"

**Solution:**
```bash
# URL encode password if it contains special characters
# Example: p@ssw0rd → p%40ssw0rd

# Or use connection parameters instead of URL:
DB_HOST=db.xxx.supabase.co
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password
DB_PORT=5432
```

## Next Steps

✅ **Phase 1.3 Complete!** You now have a fully configured PostgreSQL database.

**Continue to:**
- [04_ENVIRONMENT_CONFIG.md](./04_ENVIRONMENT_CONFIG.md) - Configure all environment variables
- [05_DEPLOYMENT_CONFIG.md](./05_DEPLOYMENT_CONFIG.md) - Prepare deployment configurations

**Good to know:**
- Always backup production database before running migrations
- Use `alembic downgrade -1` to rollback last migration
- Seed data script is for development only - don't run in production
- Supabase provides automatic backups on paid plans
- Use Supabase's built-in SQL editor for quick queries
