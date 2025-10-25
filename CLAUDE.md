# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a dual-project repository containing:

1. **agentic-crm-template** - Multi-industry CRM template system (React/TypeScript/Next.js)
2. **market-ai** - OpenAI Agents-based marketing AI employees (Python)

Both projects are independent and have their own build/run processes.

---

## Agentic CRM Template

### Technology Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Testing**: Vitest

### Key Commands

```bash
# Working directory: agentic-crm-template/

# Industry setup (interactive wizard)
./scripts/setup-industry.sh

# Development
npm install
npm run dev                    # Start dev server (http://localhost:5173)

# Build & deployment
npm run build                  # Production build
npm run preview                # Preview production build (http://localhost:4173)

# Code quality
npm run lint                   # ESLint
npm run type-check             # TypeScript type checking
npm run format                 # Prettier formatting
npm run test                   # Run tests with Vitest
npm run test:ui                # Run tests with UI

# Configuration generation
npm run setup:industry         # Run industry setup script
npm run generate:theme         # Generate theme CSS from config
```

### Architecture

**Configuration-Driven Design**: The CRM adapts to different industries through JSON configuration files instead of code changes.

**Core Configuration Files**:
- `config/industry.json` - Active industry configuration (generated from templates)
- `config/theme.json` - Brand colors, typography, spacing
- `config/industries/*.json` - Pre-built industry templates (real-estate, insurance, recruiting, etc.)
- `config/fields/*.json` - Custom field definitions per entity

**Entity System** (5 core entities that map to any industry):
1. **Primary Entity** - Main product/asset (Property → Policy → Job Opening → Product)
2. **Lead Entity** - Potential customers in sales pipeline
3. **Transaction Entity** - Active deals/sales in progress
4. **Contact Entity** - People in the network
5. **Agent Entity** - Sales team members

**File Structure**:
- `src/app/` - Next.js App Router pages
- `src/components/` - React components (organized by entity)
- `src/lib/` - Utilities and helpers
- `src/data/mockData/` - Mock data for development
- `scripts/` - Setup and generation scripts

**TypeScript Paths**: Uses `@/*` alias mapping to project root (configured in `tsconfig.json`)

### Industry Customization Workflow

1. **Quick Setup**: Run `./scripts/setup-industry.sh` and select industry template
2. **Configuration**: Template copies to `config/industry.json`, which drives entity names, fields, and stages
3. **Theme Generation**: `npm run generate:theme` processes `config/theme.json` into CSS
4. **Type Updates**: When adding custom fields, update TypeScript interfaces in `src/types/`
5. **Component Mapping**: Rename component folders to match entity names (e.g., `properties/` → `policies/`)

### Important Notes

- Always run `npm run type-check` before committing to catch TypeScript errors
- The `setup-industry.sh` script requires `jq` (install: `brew install jq` on macOS)
- Mock data lives in `src/data/mockData/` - replace with real backend integration in production
- Theme changes require restarting the dev server to take effect

---

## Marketing AI Employees

### Technology Stack
- **Framework**: OpenAI Agents SDK (Responses API)
- **Language**: Python 3.13
- **Key Libraries**: openai-agents, python-dotenv, pydantic

### Key Commands

```bash
# Working directory: market-ai/marketing_ai_employees_growing_brand_bundle/

# Setup
pip install -r requirements.txt

# Configuration
cp .env.example .env
# Set OPENAI_API_KEY and VECTOR_STORE_ID in .env

# Run commands
python app.py /help                              # Show available commands
python app.py /research "topic"                  # Research & outline
python app.py /write "brief"                     # Write SEO article (auto-polished with gpt-4o)
python app.py /optimize "url"                    # Analyze & optimize existing content
python app.py /review                            # Review past performance
python app.py /create-email "brief"              # Create single email
python app.py /create-series "brief"             # Create email sequence
```

### Architecture

**Agent System**:
- `agents/cmo_agent.py` - Chief Marketing Officer orchestrator
- `agents/seo_writer.py` - SEO content specialist
- `agents/email_marketer.py` - Email marketing specialist

**Supporting Modules**:
- `tools/` - Function tools for GA, GSC, DataForSEO, internal linking, CMS operations
- `helpers/polish.py` - Final polish pass using gpt-4o for publication quality
- `budget.py` - Runtime cost tracking and budget enforcement
- `context/` - Brand voice, guidelines, examples (upload to OpenAI Vector Store)
- `prompts/` - Reusable prompt templates

**Configuration**:
- `.env` - API keys, model settings, vector store ID
- `config/budget.json` - Cost caps for web/file search

### Important Notes

- **Vector Store**: Create an OpenAI Vector Store and upload files from `context/` directory, then set `VECTOR_STORE_ID` in `.env`
- **Cost Control**: The `/write` command uses gpt-4o-mini for drafting, then escalates to gpt-4o for final polish
- **Budget Tracking**: `budget.py` monitors API costs in real-time and enforces limits
- **Default Model**: Set `DEFAULT_MODEL` in `.env` (defaults to gpt-4o-mini for cost efficiency)
- Tracing is disabled by default (`set_tracing_disabled(True)`)

---

## General Development Guidelines

### Working with Both Projects

These projects are independent - changes in one don't affect the other. Navigate to the appropriate subdirectory before running commands.

### Testing Changes

**CRM Template**:
- Test type safety: `npm run type-check`
- Test build: `npm run build`
- Preview production: `npm run preview`

**Marketing AI**:
- Test with `/help` command first
- Start with shorter commands like `/research` before longer `/write` operations
- Monitor console output for budget warnings

### Configuration Files

**Never commit**:
- `.env` files with API keys
- `config/industry.json` (generated file)
- Personal customizations in `config/theme.json`

**Always version control**:
- `config/industries/*.json` templates
- `.env.example` files
- Documentation in `docs/` directory
