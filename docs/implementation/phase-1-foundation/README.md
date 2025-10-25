# Phase 1: Foundation Setup - Complete Guide

## Overview

This phase establishes the complete foundation for the Agentic Marketing Dashboard project. It covers frontend setup (Next.js 16), backend setup (FastAPI + Python 3.13), database configuration (PostgreSQL), environment variables, and deployment to Netlify and Render.

**Total Time**: 4-6 hours
**Difficulty**: Intermediate
**Prerequisites**: Node.js 18+, Python 3.13+, Git

## Documents in This Phase

### [01_PROJECT_SETUP.md](./01_PROJECT_SETUP.md)
**Frontend Setup with Next.js 16**

✅ What you'll accomplish:
- Initialize Next.js 16 project with App Router
- Configure TypeScript with strict mode
- Set up Tailwind CSS v4
- Install all dependencies
- Create project structure
- Configure ESLint and Prettier
- Create core utility files

⏱️ **Time**: 60-90 minutes

---

### [02_BACKEND_SETUP.md](./02_BACKEND_SETUP.md)
**Backend Setup with FastAPI**

✅ What you'll accomplish:
- Create FastAPI application structure
- Set up Python 3.13 virtual environment
- Configure CORS for frontend communication
- Implement base agent system
- Create API routes and health checks
- Set up logging with Loguru

⏱️ **Time**: 60-90 minutes

---

### [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
**PostgreSQL Database Configuration**

✅ What you'll accomplish:
- Set up Supabase PostgreSQL database
- Create complete database schema (campaigns, content_assets, agent_jobs, budget_entries)
- Configure Alembic for migrations
- Create and run migrations
- Seed database with development data
- Verify database connectivity

⏱️ **Time**: 45-60 minutes

---

### [04_ENVIRONMENT_CONFIG.md](./04_ENVIRONMENT_CONFIG.md)
**Environment Variables & API Setup**

✅ What you'll accomplish:
- Configure OpenAI API key
- Create and configure Vector Store
- Set up frontend environment variables
- Set up backend environment variables
- Create environment templates
- Test all connections

⏱️ **Time**: 30-45 minutes

---

### [05_DEPLOYMENT_CONFIG.md](./05_DEPLOYMENT_CONFIG.md)
**Production Deployment Configuration**

✅ What you'll accomplish:
- Configure Netlify deployment
- Configure Render deployment
- Set up production environment variables
- Create deployment scripts
- Set up monitoring and logging
- Deploy to production

⏱️ **Time**: 60-90 minutes

---

## Quick Start

Follow these documents **in order**:

```bash
# 1. Frontend Setup (Next.js 16)
cd agentic-marketing-dashboard
# Follow: 01_PROJECT_SETUP.md

# 2. Backend Setup (FastAPI)
cd market-ai
# Follow: 02_BACKEND_SETUP.md

# 3. Database Setup (PostgreSQL)
# Follow: 03_DATABASE_SCHEMA.md

# 4. Environment Configuration
# Follow: 04_ENVIRONMENT_CONFIG.md

# 5. Deployment Configuration
# Follow: 05_DEPLOYMENT_CONFIG.md
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: Tailwind CSS v4
- **State**: Zustand + SWR
- **UI Components**: Radix UI
- **Deployment**: Netlify

### Backend
- **Framework**: FastAPI 0.115+
- **Language**: Python 3.13
- **AI**: OpenAI Agents SDK
- **Database ORM**: SQLAlchemy 2.0 (async)
- **Migrations**: Alembic
- **Deployment**: Render

### Database
- **Database**: PostgreSQL 15+
- **Hosting**: Supabase (or Neon)
- **Connection**: asyncpg (async driver)

### DevOps
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (optional)
- **Monitoring**: Netlify Analytics, Render Metrics
- **Logging**: Loguru (structured logging)

## Project Structure

After completing Phase 1, your project will look like this:

```
agentic-marketing-dashboard/
├── agentic-crm-template/          # Next.js frontend
│   ├── app/                       # App Router pages
│   ├── components/                # React components
│   ├── lib/                       # Utilities and hooks
│   ├── config/                    # Configuration files
│   ├── types/                     # TypeScript types
│   ├── public/                    # Static assets
│   ├── .env.local                 # Frontend environment variables
│   ├── next.config.ts             # Next.js configuration
│   ├── tailwind.config.ts         # Tailwind configuration
│   ├── tsconfig.json              # TypeScript configuration
│   └── netlify.toml               # Netlify deployment config
│
├── market-ai/                     # FastAPI backend
│   ├── agents/                    # AI agent implementations
│   │   ├── seo_writer.py
│   │   ├── email_marketer.py
│   │   └── base_agent.py
│   ├── api/                       # API routes
│   │   └── routes/
│   │       ├── health.py
│   │       └── agents.py
│   ├── models/                    # Database models
│   │   ├── campaign.py
│   │   ├── content_asset.py
│   │   ├── agent_job.py
│   │   └── budget_entry.py
│   ├── config/                    # Configuration
│   │   ├── settings.py
│   │   ├── database.py
│   │   └── logging.py
│   ├── alembic/                   # Database migrations
│   ├── scripts/                   # Utility scripts
│   ├── context/                   # Vector Store context files
│   ├── venv/                      # Python virtual environment
│   ├── .env                       # Backend environment variables
│   ├── requirements.txt           # Python dependencies
│   ├── main.py                    # FastAPI application
│   └── render.yaml                # Render deployment config
│
└── docs/                          # Documentation
    └── implementation/
        └── phase-1-foundation/    # This directory
            ├── 01_PROJECT_SETUP.md
            ├── 02_BACKEND_SETUP.md
            ├── 03_DATABASE_SCHEMA.md
            ├── 04_ENVIRONMENT_CONFIG.md
            ├── 05_DEPLOYMENT_CONFIG.md
            └── README.md (this file)
```

## Verification Checklist

Use this checklist to verify Phase 1 is complete:

### Frontend ✅
- [ ] Next.js 16 dev server runs: `pnpm run dev`
- [ ] TypeScript type check passes: `pnpm run type-check`
- [ ] ESLint passes: `pnpm run lint`
- [ ] Production build succeeds: `pnpm run build`
- [ ] Home page loads at http://localhost:3000
- [ ] All dependencies installed (check package.json)

### Backend ✅
- [ ] Virtual environment activated: `source venv/bin/activate`
- [ ] FastAPI dev server runs: `python run.py`
- [ ] Health check responds: `curl http://localhost:8000/health`
- [ ] Agents status responds: `curl http://localhost:8000/api/agents/status`
- [ ] OpenAI connection verified: `python test_openai.py`
- [ ] All dependencies installed: `pip list`

### Database ✅
- [ ] Supabase project created and active
- [ ] Database tables created (4 tables)
- [ ] Migrations applied: `alembic upgrade head`
- [ ] Seed data loaded: `python scripts/seed_data.py`
- [ ] Database connection from backend verified
- [ ] Can query campaigns: `curl http://localhost:8000/api/campaigns`

### Environment ✅
- [ ] Frontend `.env.local` configured
- [ ] Backend `.env` configured
- [ ] OpenAI API key set and tested
- [ ] Vector Store created and populated
- [ ] Database URL correct
- [ ] All environment variables documented

### Deployment ✅
- [ ] Git repository initialized
- [ ] Code pushed to GitHub
- [ ] Netlify site created
- [ ] Render web service created
- [ ] Frontend deployed to Netlify
- [ ] Backend deployed to Render
- [ ] Production environment variables set
- [ ] CORS configured correctly
- [ ] SSL certificates active

## Common Issues & Solutions

### Issue: TypeScript errors

**Solution:**
```bash
# Clear .next cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Run type check
pnpm run type-check
```

### Issue: Python module not found

**Solution:**
```bash
# Verify virtual environment is activated
which python  # Should show venv path

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: Database connection failed

**Solution:**
1. Check Supabase project is active (not paused)
2. Verify DATABASE_URL in `.env`
3. Test with psql: `psql $DATABASE_URL`
4. Check for firewall/network issues

### Issue: CORS errors

**Solution:**
1. Verify CORS_ORIGINS in backend `.env` includes frontend URL
2. Restart backend server
3. Clear browser cache
4. Check frontend is using correct API URL

### Issue: OpenAI API errors

**Solution:**
1. Verify API key is correct
2. Check account has credits
3. Test with curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

## Next Steps

After completing Phase 1, you're ready to move on to:

### Phase 2: Core UI Components
- Dashboard layout and navigation
- Data tables and charts
- Forms and modals
- Agent cards and status displays

### Phase 3: Agent Management
- Agent execution interface
- Real-time job tracking
- Cost monitoring
- Result display and editing

### Phase 4: Campaign Management
- Campaign creation and editing
- Content asset management
- Performance metrics
- Budget allocation

### Phase 5: Analytics & Optimization
- Performance dashboards
- SEO analytics integration
- Cost optimization
- ROI tracking

## Resources

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI Platform Docs](https://platform.openai.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Render Docs](https://render.com/docs)

### Tutorials
- [Next.js Learn Course](https://nextjs.org/learn)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [SQLAlchemy 2.0 Tutorial](https://docs.sqlalchemy.org/en/20/tutorial/)

### Community
- [Next.js Discord](https://discord.gg/nextjs)
- [FastAPI Discord](https://discord.gg/fastapi)
- [OpenAI Developer Forum](https://community.openai.com)

## Support

If you encounter issues:

1. **Check troubleshooting sections** in each document
2. **Review verification steps** to identify where setup failed
3. **Check logs**:
   - Frontend: Browser console + terminal
   - Backend: Terminal + `logs/` directory
4. **Test each component** independently before integration
5. **Use health check endpoints** to verify services

## Contributing

Found an issue with this documentation? Please:

1. Check if issue is already documented in troubleshooting
2. Verify it's not environment-specific
3. Open an issue with:
   - Document name and section
   - Steps to reproduce
   - Expected vs actual behavior
   - Your environment (OS, versions)

---

**Phase 1 Status**: ✅ Complete

**Estimated Completion Time**: 4-6 hours

**Next Phase**: Phase 2 - Core UI Components

---

Last Updated: 2025-10-25
Version: 1.0.0
