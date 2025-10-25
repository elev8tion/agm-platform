# Project Structure Documentation

## Overview

This repository contains the **Agentic Marketing Platform** - an AI-powered marketing command center with autonomous agents. The project is organized into distinct folders that serve different purposes in the overall architecture.

---

## Folder Structure

```
agentic-marketing-dashboard/
├── agentic-crm-template/          # ✅ Reference template (user-provided)
├── market-ai/                     # ✅ Marketing AI employees (user-provided)
├── frontend/                      # 🆕 Next.js 16 application (created)
├── backend/                       # 🆕 FastAPI application (created)
├── docs/                          # 📚 Implementation documentation
├── .gitignore                     # Git exclusions
└── README.md                      # Project overview
```

---

## Detailed Folder Breakdown

### 1. `/agentic-crm-template/` ✅ **USER-PROVIDED (Carried Over)**

**Purpose**: Reference template for professional styling and component structure

**Technology Stack**:
- Next.js 14+ with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Configuration-driven design with JSON files

**Key Files Used as Reference**:
- `src/app/page.tsx` - Clean, professional homepage layout
- `config/theme.json` - Design tokens (colors, typography, spacing)
- `tailwind.config.ts` - Brand color definition (#5B5FC7)
- `src/app/globals.css` - Minimal CSS structure

**Why It Exists**: Provides the **professional styling standard** that the new platform replicates. All UI decisions reference this template to maintain consistency.

---

### 2. `/market-ai/` ✅ **USER-PROVIDED (Carried Over)**

**Purpose**: Original OpenAI Agents-based marketing AI employees

**Technology Stack**:
- Python 3.13
- OpenAI Agents SDK (Responses API)
- Vector Store integration

**Key Components**:
- `agents/cmo_agent.py` - Chief Marketing Officer orchestrator
- `agents/seo_writer.py` - SEO content specialist
- `agents/email_marketer.py` - Email marketing specialist
- `tools/` - Google Analytics, Search Console, DataForSEO integrations
- `context/` - Brand voice, guidelines, examples

**Why It Exists**: Contains the **original AI marketing employees** that may be integrated or referenced during later phases.

---

### 3. `/frontend/` 🆕 **CREATED (Phase 1 Subagent)**

**Purpose**: Next.js 16 web application for the marketing dashboard

**Technology Stack**:
- **Framework**: Next.js 16 with App Router
- **Bundler**: Turbopack (default in Next.js 16)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Deployment Target**: Netlify

**Key Directories**:
```
frontend/
├── app/
│   ├── layout.tsx              # Root layout (dark mode, fonts)
│   ├── page.tsx                # Homepage with stats and features
│   ├── globals.css             # Tailwind v4 with @theme design tokens
│   ├── dashboard/              # Dashboard pages (pending Phase 3)
│   ├── campaigns/              # Campaign management (pending)
│   └── agents/                 # Agent management (pending)
├── components/                 # Reusable React components (pending Phase 3)
├── lib/                        # Utilities and helpers
├── config/
│   └── theme.json              # Design tokens matching CRM template
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
└── netlify.toml                # Deployment configuration
```

**Current Status**:
- ✅ Foundation setup complete
- ✅ Homepage with professional styling
- ✅ Design tokens system
- ✅ Dark theme with brand colors (#5B5FC7)
- ⏳ Dashboard components pending (Phase 3)
- ⏳ Server actions pending (Phase 4)
- ⏳ Real-time features pending (Phase 5)

**Key Scripts**:
```bash
npm run dev         # Start development server (Turbopack)
npm run build       # Production build
npm run lint        # ESLint check
```

---

### 4. `/backend/` 🆕 **CREATED (Phase 1 Subagent)**

**Purpose**: FastAPI backend API for marketing operations

**Technology Stack**:
- **Framework**: FastAPI (async Python web framework)
- **Database**: SQLite (dev) → PostgreSQL (production)
- **ORM**: SQLAlchemy with async support
- **Migrations**: Alembic
- **Deployment Target**: Render

**Key Directories**:
```
backend/
├── models/
│   ├── campaign.py             # Campaign model (id, name, status, budget, etc.)
│   ├── content_asset.py        # Content asset model (type, title, content, etc.)
│   ├── agent_job.py            # Agent job model (agent_type, status, result, etc.)
│   └── budget_entry.py         # Budget tracking model (cost, service, etc.)
├── alembic/
│   └── versions/
│       └── 06014daac687_initial_schema.py  # Initial migration
├── config/
│   └── database.py             # SQLAlchemy async configuration
├── scripts/
│   └── seed_data.py            # Sample data (3 campaigns, 3 assets, 3 jobs)
├── main.py                     # FastAPI app entry point
├── requirements.txt            # Python dependencies
└── render.yaml                 # Deployment configuration
```

**Database Schema** (Phase 1 Complete):
- ✅ `campaigns` - Marketing campaigns with budget tracking
- ✅ `content_assets` - Generated content (blog, email, social)
- ✅ `agent_jobs` - AI agent task tracking
- ✅ `budget_entries` - API cost tracking

**Current Status**:
- ✅ Models and migrations created
- ✅ Seed data script
- ✅ Database configuration
- ⏳ API endpoints pending (Phase 2)
- ⏳ Agent integration pending (Phase 2)
- ⏳ WebSocket support pending (Phase 5)

**Key Scripts**:
```bash
pip install -r requirements.txt     # Install dependencies
alembic upgrade head                # Run migrations
python scripts/seed_data.py         # Load sample data
uvicorn main:app --reload           # Start dev server
```

---

### 5. `/docs/` 📚 **IMPLEMENTATION DOCUMENTATION**

**Purpose**: 42 implementation documents across 6 phases

**Structure**:
```
docs/
├── phase-1-foundation/         # Documents 01-05 (✅ Complete)
├── phase-2-backend/            # Documents 06-10 (⏳ Pending)
├── phase-3-frontend/           # Documents 11-17 (⏳ Pending)
├── phase-4-integration/        # Documents 18-22 (⏳ Pending)
├── phase-5-realtime/           # Documents 23-27 (⏳ Pending)
├── phase-6-production/         # Documents 28-37 (⏳ Pending)
├── PROJECT_STRUCTURE.md        # This file
└── CURRENT_STATUS.md           # Phase progress tracking
```

**Phase 1 Completed Documents**:
1. ✅ **01_Next_js_Frontend_Setup.md** - Frontend scaffolding
2. ✅ **02_FastAPI_Backend_Setup.md** - Backend scaffolding
3. ✅ **03_Database_Schema_Design.md** - SQLAlchemy models
4. ✅ **04_Environment_Configuration.md** - .env files and secrets
5. ✅ **05_Deployment_Configuration.md** - Netlify + Render configs

---

## What Was Carried Over vs Created

### ✅ **Carried Over (User-Provided)**:
1. **`/agentic-crm-template/`** - Reference template for styling
2. **`/market-ai/`** - Original marketing AI employees

### 🆕 **Created (Subagent Execution)**:
1. **`/frontend/`** - Next.js 16 application
2. **`/backend/`** - FastAPI application
3. **`/docs/`** - Implementation documentation
4. **Design tokens** (`frontend/config/theme.json`)
5. **Deployment configs** (`netlify.toml`, `render.yaml`)
6. **Git repository** (`.gitignore`, initial commit)

---

## How We're Building This Project

### **Reference-Driven Development**

The project follows a **configuration-driven, template-based approach**:

1. **Styling Reference**: All UI components reference `/agentic-crm-template/` for professional styling
   - Brand color: `#5B5FC7` (indigo/purple)
   - Dark theme: `slate-950` backgrounds with `white/10` borders
   - Clean, minimal design without gradients
   - Subtle accent colors on hover states

2. **Design Tokens**: Centralized in `frontend/config/theme.json`
   - Colors, typography, spacing, shadows
   - Matches CRM template structure
   - Consumed by Tailwind CSS v4 `@theme` block

3. **Agent Orchestration**: Building in phases using subagent execution
   - Each phase has detailed implementation documents
   - Subagents execute documents autonomously
   - Human review and approval between phases

### **Technology Decisions**

| Component | Technology | Reason |
|-----------|-----------|--------|
| Frontend Framework | Next.js 16 | App Router, server components, Turbopack |
| Bundler | Turbopack | Default in Next.js 16, faster than Webpack |
| Styling | Tailwind CSS v4 | Utility-first, `@theme` design tokens |
| Backend Framework | FastAPI | Async Python, auto API docs, type safety |
| Database | SQLite → PostgreSQL | SQLite for dev, PostgreSQL for production |
| ORM | SQLAlchemy | Async support, type hints, migrations |
| Deployment | Netlify + Render | Netlify for frontend, Render for backend |

### **Build Process**

**Phase 1** (✅ Complete):
- Foundation setup
- Database schema
- Environment configuration
- Deployment configs

**Phase 2** (⏳ Next):
- Backend API endpoints
- Agent integration layer
- FastAPI route handlers

**Phase 3** (⏳ Pending):
- Frontend dashboard components
- Campaign management UI
- Agent control panel

**Phase 4** (⏳ Pending):
- Server actions
- API integration
- Form handling

**Phase 5** (⏳ Pending):
- Real-time features
- WebSocket connections
- Live agent status

**Phase 6** (⏳ Pending):
- Production optimization
- Security hardening
- Deployment automation

---

## Quick Reference

### **Start Development**:
```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && uvicorn main:app --reload
```

### **Key URLs**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- GitHub: https://github.com/elev8tion/agm-platform.git

### **Design Standards**:
- Brand color: `#5B5FC7`
- Dark theme: Always enabled
- No gradients: Use solid colors with subtle accents
- Icon badges: `bg-brand/10` with `text-brand` icons
- Hover states: `border-brand/40` on cards
