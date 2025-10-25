# 🎯 Agentic Marketing Dashboard - Architectural Integration Map

**Vision**: Transform the CRM template UI into a unified marketing AI command center where buttons trigger AI agent workflows (slash commands) to execute marketing tasks.

---

## 🏗️ System Integration Architecture

### Current State Analysis

**System A: Agentic CRM Template** (React/Next.js 16)
- Modern dashboard UI with tabs, cards, stats
- Entity-based architecture (Properties → Leads → Transactions)
- Configuration-driven customization
- Mock data with TypeScript types
- Tailwind CSS styling system

**System B: Marketing AI Employees** (Python/OpenAI Agents)
- CLI-based slash commands (`/research`, `/write`, `/create-email`)
- 3 specialist agents (SEO Writer, Email Marketer, CMO)
- Budget-controlled AI operations
- Vector store knowledge base
- Polish pipeline with GPT-4o

### Target State: Unified Agentic Marketing Dashboard

**Architecture**: Next.js 16 frontend → FastAPI/Python backend → OpenAI Agents

---

## 📊 Entity Mapping: CRM → Marketing System

| CRM Entity | Marketing Equivalent | Description |
|------------|---------------------|-------------|
| **Property** | **Content Asset** | Blog posts, landing pages, email sequences |
| **Lead** | **Campaign** | Active marketing campaigns and initiatives |
| **Transaction** | **Task/Job** | In-progress AI agent tasks |
| **Contact** | **Audience Segment** | Target audiences and personas |
| **Agent (User)** | **AI Agent** | SEO Writer, Email Marketer, CMO |

---

## 🎨 UI/UX Layout Redesign

### Main Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Marketing AI Command Center                    [Profile ▼] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 🤖 AI Agents│ │ 📊 Campaigns│ │ ⚡ Quick    │           │
│  │   Active: 3 │ │   Running: 5│ │    Actions  │           │
│  │   Ready     │ │   $2.4k cost│ │   [+Launch] │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Content Assets (67)  │  Campaigns (12)  │  Tasks (4)   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📝 SEO Articles                        [+ Research]  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 🟢 "How to Grow Podcast on YouTube"            │  │   │
│  │  │    Status: Draft • 4,200 words • [Polish] [▶]  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 🟡 "Podcast Monetization Guide"                 │  │   │
│  │  │    Status: Researching... • AI Working [⏸]     │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✉️ Email Campaigns                  [+ Create Email]│   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │ 📧 "Product Launch Series" (6 emails)          │  │   │
│  │  │    Day 1-14 • Open Rate: 34% • [View] [Edit]   │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Agent Control Panel

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Agents Dashboard                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ 📝 SEO Writer    │  │ ✉️ Email         │  │ 🎯 CMO     ││
│  │    Status: Ready │  │    Marketer      │  │    Status: ││
│  │    Jobs: 2       │  │    Status: Busy  │  │    Ready   ││
│  │                  │  │    Jobs: 1       │  │    Jobs: 0 ││
│  │  [Research]      │  │                  │  │            ││
│  │  [Write Article] │  │  [Create Email]  │  │  [Analyze] ││
│  │  [Optimize]      │  │  [Create Series] │  │  [Review]  ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
│                                                               │
│  Budget Monitor: $234 / $500 (46%) [Reset] [Adjust]         │
│  ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Backend Architecture: Next.js 16 → Python Agents

### API Route Structure

**Next.js 16 Server Actions** (using new `updateTag` & `refresh` APIs)

```typescript
// app/actions/agents.ts
'use server'

import { updateTag, refresh } from 'next/cache'

export async function triggerSEOResearch(topic: string) {
  // Call Python FastAPI backend
  const response = await fetch('http://localhost:8000/agents/seo/research', {
    method: 'POST',
    body: JSON.stringify({ topic }),
    headers: { 'Content-Type': 'application/json' }
  })

  const result = await response.json()

  // Update cache and refresh UI immediately
  updateTag('content-assets')

  return result
}

export async function triggerSEOWrite(brief: string) {
  const response = await fetch('http://localhost:8000/agents/seo/write', {
    method: 'POST',
    body: JSON.stringify({ brief })
  })

  const job = await response.json()

  // Refresh to show new task in progress
  refresh()

  return job
}

export async function triggerEmailCreate(brief: string) {
  const response = await fetch('http://localhost:8000/agents/email/create', {
    method: 'POST',
    body: JSON.stringify({ brief })
  })

  updateTag('email-campaigns')
  return await response.json()
}
```

### Python FastAPI Backend

```python
# backend/main.py
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import asyncio
from agents.seo_writer import seo_writer
from agents.email_marketer import email_marketer
from agents import Runner

app = FastAPI()

class ResearchRequest(BaseModel):
    topic: str

class WriteRequest(BaseModel):
    brief: str

# Real-time streaming endpoint
@app.post("/agents/seo/research")
async def seo_research(req: ResearchRequest):
    """Trigger SEO research agent"""
    prompt = f"Slash:/research\nUser: {req.topic}"
    result = await Runner.run(seo_writer, prompt, max_turns=8)

    return {
        "status": "completed",
        "content": result.final_output,
        "cost": result.usage_cost if hasattr(result, 'usage_cost') else 0
    }

@app.post("/agents/seo/write")
async def seo_write(req: WriteRequest, background_tasks: BackgroundTasks):
    """Trigger SEO writing agent (long-running)"""

    # Create job entry in database
    job_id = create_job_entry("seo_write", req.brief)

    # Run in background
    background_tasks.add_task(execute_seo_write, job_id, req.brief)

    return {
        "job_id": job_id,
        "status": "processing",
        "estimated_time": "8-12 minutes"
    }

async def execute_seo_write(job_id: str, brief: str):
    """Background task for long article generation"""
    prompt = f"Slash:/write\nUser: {brief}"
    result = await Runner.run(seo_writer, prompt, max_turns=12)

    # Polish with GPT-4o
    polished = polish_text(result.final_output, model="gpt-4o")

    # Update job status in DB
    update_job_status(job_id, "completed", polished)

    # Trigger webhook to notify frontend
    notify_frontend(job_id)
```

---

## 🗂️ Database Schema

### Content Assets Table

```sql
CREATE TABLE content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'blog_post', 'landing_page', 'email'
  title VARCHAR(500),
  status VARCHAR(50), -- 'researching', 'draft', 'polishing', 'published'
  word_count INTEGER,
  content TEXT,
  metadata JSONB, -- SEO metadata, internal links, etc.
  agent_id VARCHAR(100), -- 'seo_writer', 'email_marketer'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP
);
```

### Campaigns Table

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50), -- 'seo', 'email', 'content_series'
  status VARCHAR(50), -- 'active', 'paused', 'completed'
  budget_allocated DECIMAL(10,2),
  budget_used DECIMAL(10,2),
  metrics JSONB, -- open_rates, conversions, traffic, etc.
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Agent Jobs Table

```sql
CREATE TABLE agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(50), -- 'seo_writer', 'email_marketer', 'cmo'
  command VARCHAR(100), -- '/research', '/write', '/create-email'
  input_params JSONB,
  status VARCHAR(50), -- 'queued', 'running', 'completed', 'failed'
  output TEXT,
  cost DECIMAL(10,4),
  tokens_used INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Budget Tracking Table

```sql
CREATE TABLE budget_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE,
  period_end DATE,
  total_budget DECIMAL(10,2),
  used_budget DECIMAL(10,2),
  web_search_calls INTEGER,
  file_search_calls INTEGER,
  gpt4o_tokens INTEGER,
  gpt4o_mini_tokens INTEGER,
  breakdown JSONB
);
```

---

## 🎛️ Component Architecture

### 1. Dashboard Component Mapping

**Old CRM Components** → **New Marketing Components**

```
PropertyCard.tsx      → ContentAssetCard.tsx
LeadCard.tsx          → CampaignCard.tsx
TransactionCard.tsx   → AgentJobCard.tsx
Dashboard.tsx         → MarketingDashboard.tsx
AgencyNav.tsx         → MarketingNav.tsx
```

### 2. New Core Components

#### ContentAssetCard.tsx
```tsx
interface ContentAsset {
  id: string
  type: 'blog_post' | 'landing_page' | 'email'
  title: string
  status: 'researching' | 'draft' | 'polishing' | 'published'
  wordCount: number
  agentId: string
  createdAt: Date
  metadata: {
    keywords?: string[]
    internalLinks?: Array<{anchor: string, url: string}>
    seoScore?: number
  }
}

// Displays content asset with action buttons:
// - [Research More] - triggers /research
// - [Polish] - triggers GPT-4o polish
// - [Publish] - publishes to CMS
// - [View Draft] - opens modal
```

#### AgentJobCard.tsx
```tsx
interface AgentJob {
  id: string
  agentType: 'seo_writer' | 'email_marketer' | 'cmo'
  command: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress?: number // 0-100
  estimatedTimeRemaining?: string
  cost: number
  startedAt: Date
}

// Real-time progress indicator
// Shows streaming output
// Cancel/Pause controls
```

#### AgentControlPanel.tsx
```tsx
// 3-column layout for each agent
// Quick action buttons that trigger server actions
// Budget meter
// Active jobs list
```

### 3. Action Button Components

```tsx
// app/components/agent-action-buttons.tsx
'use client'

import { useState } from 'react'
import { triggerSEOResearch, triggerSEOWrite } from '@/app/actions/agents'

export function SEOActionButtons() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleResearch() {
    setLoading(true)
    const result = await triggerSEOResearch(topic)
    setLoading(false)
    // Show result in modal or redirect to asset page
  }

  return (
    <div className="space-y-4">
      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder="Enter topic to research..."
        className="w-full rounded-lg border border-white/10 bg-slate-900/50 px-4 py-2"
      />
      <button
        onClick={handleResearch}
        disabled={loading}
        className="rounded-lg bg-brand px-6 py-3 font-medium"
      >
        {loading ? '🤖 Researching...' : '📝 Research Topic'}
      </button>
    </div>
  )
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation Setup (Week 1)
- [ ] Initialize new Next.js 16 project with App Router
- [ ] Set up FastAPI backend structure
- [ ] Create database schema (PostgreSQL)
- [ ] Configure Turbopack and React Compiler
- [ ] Set up environment variables and secrets

### Phase 2: Backend Agent Integration (Week 1-2)
- [ ] Port Python agents to FastAPI endpoints
- [ ] Implement background task system for long-running jobs
- [ ] Set up WebSocket for real-time progress updates
- [ ] Implement budget tracking system
- [ ] Create job queue management

### Phase 3: Frontend Components (Week 2)
- [ ] Build ContentAssetCard component
- [ ] Build CampaignCard component
- [ ] Build AgentJobCard component
- [ ] Build AgentControlPanel
- [ ] Build budget monitoring dashboard

### Phase 4: Server Actions & API Integration (Week 2-3)
- [ ] Create server actions for all agent commands
- [ ] Implement `updateTag` for cache invalidation
- [ ] Implement `refresh()` for real-time UI updates
- [ ] Set up WebSocket client for streaming
- [ ] Build error handling and retry logic

### Phase 5: Real-time Features (Week 3)
- [ ] Streaming output display in UI
- [ ] Progress bars for long-running tasks
- [ ] Toast notifications for job completion
- [ ] Live budget meter
- [ ] Agent status indicators

### Phase 6: Polish & Production (Week 4)
- [ ] Implement authentication (Clerk/NextAuth)
- [ ] Add role-based access control
- [ ] Set up production deployment (Vercel + Railway)
- [ ] Configure monitoring (Sentry, PostHog)
- [ ] Write end-to-end tests

---

## 🎯 Key Technical Decisions

### 1. Why Next.js 16 App Router?
- **Server Actions**: Perfect for triggering agent commands without API routes
- **`updateTag()` & `refresh()`**: Immediate UI updates after agent completions
- **React Server Components**: Reduce client bundle, faster initial loads
- **Turbopack**: 5-10x faster dev experience
- **React Compiler**: Auto-memoization for better performance

### 2. Why FastAPI for Backend?
- **Async Native**: Perfect for OpenAI Agents SDK
- **Background Tasks**: Built-in support for long-running jobs
- **Type Safety**: Pydantic models match TypeScript interfaces
- **WebSocket Support**: Real-time streaming
- **Python Ecosystem**: Direct integration with existing agent code

### 3. Communication Patterns

**Short Tasks** (< 10 seconds):
```
User clicks button → Server Action → FastAPI → Agent executes → Return result → updateTag() → UI updates
```

**Long Tasks** (> 10 seconds):
```
User clicks button → Server Action → FastAPI creates job → Return job_id → refresh()
                                  ↓
WebSocket connection established → Stream progress → Update UI in real-time
                                  ↓
Job completes → Webhook → updateTag('content-assets') → Refresh list
```

### 4. State Management

- **Server State**: React Server Components + Server Actions (no Redux needed!)
- **Real-time State**: WebSocket + React Context for streaming
- **Optimistic Updates**: `useOptimistic` hook for instant feedback
- **Cache Management**: Next.js 16 native caching with `cacheTag` & `cacheLife`

---

## 📦 Tech Stack Final

### Frontend
- **Framework**: Next.js 16.0 (App Router)
- **Language**: TypeScript 5.1+
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod
- **State**: Server Components + useOptimistic
- **Real-time**: Socket.io-client

### Backend
- **Framework**: FastAPI 0.115+
- **Language**: Python 3.13
- **Agents**: OpenAI Agents SDK
- **Task Queue**: Celery + Redis (for production scale)
- **WebSockets**: Socket.io
- **Database ORM**: SQLAlchemy

### Database & Infrastructure
- **Database**: PostgreSQL 16 (Supabase or Railway)
- **Cache**: Redis
- **File Storage**: S3-compatible (Cloudflare R2)
- **Vector Store**: OpenAI Vector Store
- **Deployment**: Vercel (Frontend) + Railway (Backend)

---

## 🎨 Design System

### Color Palette (Marketing Theme)

```css
/* Primary - Brand */
--brand: #6366f1 (Indigo 500)
--brand-foreground: #e0e7ff (Indigo 100)

/* Accent - Agent States */
--agent-ready: #10b981 (Green 500)
--agent-busy: #f59e0b (Amber 500)
--agent-error: #ef4444 (Red 500)

/* Content Status */
--status-research: #8b5cf6 (Purple 500)
--status-draft: #3b82f6 (Blue 500)
--status-polish: #f59e0b (Amber 500)
--status-published: #10b981 (Green 500)

/* Background */
--bg-primary: #0f172a (Slate 950)
--bg-secondary: #1e293b (Slate 900)
--bg-card: rgba(15, 23, 42, 0.5) (Slate 950/50)
```

### Component Variants

**Button Types:**
- Primary Action (Brand color): Trigger new agent task
- Secondary Action (Outline): View/Edit existing asset
- Danger Action (Red): Cancel/Delete
- Ghost Action (Transparent): Quick actions

**Card States:**
- Default: White/10 border
- Active: Brand border + glow
- Processing: Pulsing border animation
- Completed: Green accent border
- Error: Red accent border

---

## 📊 Example User Flows

### Flow 1: Create SEO Article

1. User clicks **"Research Topic"** button
2. Modal opens with topic input
3. User enters: "How to monetize a podcast"
4. Clicks **"Start Research"**
5. Server action triggers → FastAPI → SEO Writer agent
6. Progress bar shows: "🤖 Researching... (2/8 turns)"
7. After 30 seconds, research completes
8. New ContentAsset card appears in "Draft" status
9. Card shows: Title, word count estimate, outline preview
10. User clicks **"Write Full Article"**
11. Job starts in background (estimated 8-12 min)
12. WebSocket streams progress
13. When complete, notification: "✅ Article ready for review"
14. User clicks **"Polish with GPT-4o"**
15. Final polish happens (30 seconds)
16. Article ready to publish

### Flow 2: Create Email Series

1. User navigates to "Email Campaigns" tab
2. Clicks **"+ Create Series"**
3. Form appears:
   - Series goal
   - Number of emails
   - Tone/style
4. Clicks **"Generate Series"**
5. Email Marketer agent creates 6 emails
6. Each email shown as expandable card
7. User can edit subject lines, body variants
8. Clicks **"Approve & Schedule"**
9. Series saved to database
10. Integration with email platform (future)

---

## 🔒 Security Considerations

1. **API Key Management**: Never expose OpenAI keys to frontend
2. **Budget Caps**: Enforce per-user and global budget limits
3. **Rate Limiting**: Prevent agent abuse
4. **Authentication**: Require login for all agent actions
5. **Input Validation**: Sanitize all user inputs before agent processing
6. **Output Filtering**: Check agent outputs for sensitive data leaks

---

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Agent Performance**
   - Average completion time per command
   - Success/failure rates
   - Cost per job type
   - Token usage trends

2. **User Engagement**
   - Most used agents
   - Most created content types
   - Average tasks per user per day
   - Feature adoption rates

3. **System Health**
   - API response times
   - WebSocket connection stability
   - Database query performance
   - Cache hit rates

---

## ✅ Ready for Approval

This architectural map provides:

✅ Complete entity mapping (CRM → Marketing)
✅ UI/UX mockups with component layout
✅ Backend architecture (Next.js 16 → FastAPI)
✅ Database schema for all entities
✅ Component breakdown with code examples
✅ 6-phase implementation plan
✅ Tech stack decisions with justifications
✅ Example user flows
✅ Security & monitoring considerations

**Next Steps After Approval:**

1. Generate complete file structure
2. Create all TypeScript interfaces
3. Write all React components
4. Build FastAPI endpoints
5. Set up database migrations
6. Configure deployment pipelines

**Estimated Implementation**: 3-4 weeks with focused development

---

## 📝 Notes for Claude Code Orchestration

When you approve, I will:

1. Create a detailed file tree
2. Generate all boilerplate code
3. Provide step-by-step agent execution instructions
4. Include all configuration files
5. Set up environment templates
6. Create migration scripts

The sub-agents will receive:
- Strict component specifications
- Type definitions
- API contracts
- Styling guidelines
- Testing requirements

Ready to proceed? 🚀
