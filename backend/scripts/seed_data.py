"""
Seed database with development data
Run: python scripts/seed_data.py
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

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

    # Refresh to get IDs
    for campaign in campaigns:
        await db.refresh(campaign)

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
            content_metadata={
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
            content_metadata={
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
            content_metadata={
                "platform": "twitter",
                "character_count": 240,
            },
        ),
    ]

    db.add_all(assets)
    await db.commit()

    # Refresh to get IDs
    for asset in assets:
        await db.refresh(asset)

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

    db.add_all(jobs)
    await db.commit()

    # Refresh to get IDs
    for job in jobs:
        await db.refresh(job)

    # Link first two jobs to content assets
    if len(assets) > 0:
        assets[0].agent_job_id = jobs[0].id
    if len(assets) > 1:
        assets[1].agent_job_id = jobs[1].id

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
