# Phase 1.4: Environment Configuration

## Overview

This document provides complete environment variable configuration for both frontend (Next.js) and backend (FastAPI), including OpenAI API setup, database connections, and deployment-specific variables.

**Outcomes:**
- Frontend `.env.local` configured
- Backend `.env` configured
- OpenAI API and Vector Store set up
- All services connected and tested
- Environment variables documented

## Prerequisites

**Required:**
- Completed [01_PROJECT_SETUP.md](./01_PROJECT_SETUP.md)
- Completed [02_BACKEND_SETUP.md](./02_BACKEND_SETUP.md)
- Completed [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
- OpenAI API account with credits
- Database credentials from Supabase/Neon

**Required Accounts:**
- OpenAI Platform account (https://platform.openai.com)
- Supabase account (database already created)

## Step-by-Step Instructions

### Step 1: Get OpenAI API Key

1. Go to https://platform.openai.com
2. Sign in or create account
3. Click on your profile (top right) → **API keys**
4. Click **Create new secret key**
5. Name it: "Agentic Marketing Dashboard"
6. Copy the key (starts with `sk-proj-...`)
7. **Save this immediately** - you can't view it again!

**Check API Credits:**
1. Go to **Settings** → **Billing**
2. Verify you have credits or set up payment method
3. Set usage limits (recommended: $10-50/month for development)

### Step 2: Create OpenAI Vector Store

The Vector Store holds your brand voice, guidelines, and examples for context.

#### Using OpenAI Platform UI:

1. Go to https://platform.openai.com/storage
2. Click **Vector stores**
3. Click **Create vector store**
4. Name: "Marketing Brand Context"
5. Click **Create**
6. Copy the **Vector Store ID** (starts with `vs_...`)

#### Create Context Files:

Create these files to upload to your Vector Store:

**`context/brand_voice.md`**:
```markdown
# Brand Voice Guidelines

## Tone
- Professional yet approachable
- Confident without being arrogant
- Educational and helpful
- Modern and forward-thinking

## Style
- Use active voice
- Keep sentences concise (15-20 words average)
- Avoid jargon unless explained
- Use contractions for conversational tone

## Key Messages
- AI makes marketing more effective, not impersonal
- We help businesses scale with automation
- Quality content drives results

## Words to Use
- Empower, transform, optimize, streamline
- Intelligent, autonomous, efficient
- Growth, results, ROI

## Words to Avoid
- Cheap, guarantee, spam
- Revolutionary, groundbreaking (overused)
- Game-changer, ninja, guru
```

**`context/seo_guidelines.md`**:
```markdown
# SEO Writing Guidelines

## Structure
1. Title (50-60 characters)
   - Include primary keyword
   - Make it compelling

2. Meta Description (150-160 characters)
   - Include primary keyword
   - Call to action

3. Headers
   - H1: One per page (title)
   - H2: Main sections (3-5)
   - H3: Subsections

## Keyword Usage
- Primary keyword: 1-2% density
- Include in first 100 words
- Use in one H2 header
- Include in conclusion

## Content Length
- Blog posts: 1000-2000 words
- Landing pages: 500-800 words
- Product pages: 300-500 words

## Readability
- Flesch Reading Ease: 60-70
- 8th-grade reading level
- Short paragraphs (2-3 sentences)
- Use bullet points and lists

## Internal Linking
- 2-4 internal links per 1000 words
- Use descriptive anchor text
- Link to relevant, high-value pages
```

**`context/email_best_practices.md`**:
```markdown
# Email Marketing Best Practices

## Subject Lines
- 40-50 characters optimal
- Use personalization when possible
- Create urgency without being spammy
- A/B test different approaches
- Avoid ALL CAPS and excessive punctuation!!!

## Preview Text
- 80-100 characters
- Complement subject line, don't repeat
- Include benefit or value proposition

## Email Body
- Start with value (what's in it for them)
- One primary CTA
- Mobile-friendly (60% open on mobile)
- Scannable (headers, short paragraphs)

## Call to Action
- Use button (not just text link)
- Action-oriented language ("Get Started", "Download Now")
- Make it stand out visually
- Include only 1 primary CTA

## Timing
- Best days: Tuesday, Wednesday, Thursday
- Best times: 10am, 2pm, 8pm
- Avoid Mondays and Fridays
- Test for your specific audience
```

#### Upload Files to Vector Store:

1. In OpenAI Platform, go to your Vector Store
2. Click **Add files**
3. Upload the three context files created above
4. Wait for processing (1-2 minutes)
5. Verify files show "Completed" status

### Step 3: Configure Backend Environment

Navigate to backend directory:
```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
```

Create `.env` file:

```bash
# Create .env from template
cat > .env << 'EOF'
# =============================================================================
# APPLICATION SETTINGS
# =============================================================================
APP_NAME="Agentic Marketing AI"
APP_VERSION="1.0.0"
ENVIRONMENT="development"  # development | staging | production
DEBUG=True

# Server configuration
HOST="0.0.0.0"
PORT=8000

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
# Supabase PostgreSQL connection
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Connection pool settings
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20
DATABASE_ECHO=False  # Set True to log SQL queries

# =============================================================================
# OPENAI CONFIGURATION
# =============================================================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-proj-your-key-here"

# Optional: Organization ID (if using multiple orgs)
OPENAI_ORG_ID=""

# Default model for agents
OPENAI_DEFAULT_MODEL="gpt-4o-mini"  # Cost-effective for most tasks

# Vector Store ID for brand context
# Get from: https://platform.openai.com/storage/vector_stores
OPENAI_VECTOR_STORE_ID="vs_your-vector-store-id"

# =============================================================================
# AGENT CONFIGURATION
# =============================================================================
# Maximum iterations before timeout
AGENT_MAX_ITERATIONS=10

# Timeout in seconds
AGENT_TIMEOUT=300

# Budget limits (USD)
AGENT_BUDGET_WEB_SEARCH=5.0
AGENT_BUDGET_FILE_SEARCH=2.0

# =============================================================================
# CORS CONFIGURATION
# =============================================================================
# Allowed origins (comma-separated)
CORS_ORIGINS="http://localhost:3000,http://localhost:5173,https://*.netlify.app"

# =============================================================================
# LOGGING
# =============================================================================
LOG_LEVEL="INFO"  # DEBUG | INFO | WARNING | ERROR | CRITICAL

# =============================================================================
# SECURITY
# =============================================================================
# Secret key for JWT tokens (generate with: openssl rand -hex 32)
SECRET_KEY="your-secret-key-change-in-production-use-openssl-rand-hex-32"

# Access token expiration (minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=30

# =============================================================================
# EXTERNAL SERVICES (Optional - for Phase 2+)
# =============================================================================
# Google Analytics
# GOOGLE_ANALYTICS_CREDENTIALS=""
# GOOGLE_ANALYTICS_PROPERTY_ID=""

# Google Search Console
# GOOGLE_SEARCH_CONSOLE_CREDENTIALS=""
# GOOGLE_SEARCH_CONSOLE_PROPERTY_URL=""

# DataForSEO (SEO analytics)
# DATAFORSEO_LOGIN=""
# DATAFORSEO_PASSWORD=""

EOF
```

**Update the following values in `.env`:**

1. **DATABASE_URL**: Use your Supabase connection string from Step 3 in [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
2. **OPENAI_API_KEY**: Paste your OpenAI API key from Step 1
3. **OPENAI_VECTOR_STORE_ID**: Paste your Vector Store ID from Step 2
4. **SECRET_KEY**: Generate with: `openssl rand -hex 32`

### Step 4: Configure Frontend Environment

Navigate to frontend directory:
```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template
```

Create `.env.local` file:

```bash
cat > .env.local << 'EOF'
# =============================================================================
# NEXT.JS ENVIRONMENT VARIABLES
# =============================================================================
# Variables prefixed with NEXT_PUBLIC_ are exposed to the browser
# All others are server-side only

# =============================================================================
# APPLICATION
# =============================================================================
NEXT_PUBLIC_APP_NAME="Agentic Marketing Dashboard"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# =============================================================================
# API CONFIGURATION
# =============================================================================
# Backend API URL
NEXT_PUBLIC_API_URL="http://localhost:8000"

# API timeout (milliseconds)
NEXT_PUBLIC_API_TIMEOUT=30000

# =============================================================================
# FEATURE FLAGS
# =============================================================================
# Enable/disable features in development
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_AGENTS=true
NEXT_PUBLIC_ENABLE_CAMPAIGNS=true
NEXT_PUBLIC_ENABLE_BUDGET_TRACKING=true

# =============================================================================
# ANALYTICS (Optional - for production)
# =============================================================================
# Google Analytics
# NEXT_PUBLIC_GA_MEASUREMENT_ID=""

# Vercel Analytics (auto-enabled on Vercel)
# NEXT_PUBLIC_VERCEL_ANALYTICS=true

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================
# Supabase (if using for auth/storage)
# NEXT_PUBLIC_SUPABASE_URL=""
# NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# =============================================================================
# DEVELOPMENT
# =============================================================================
# Set to "production" when deploying
NODE_ENV="development"

# Enable Next.js debug mode
# DEBUG=true

EOF
```

**Good to know:**
- Variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Other variables are server-side only (safe for API keys)
- Next.js automatically loads `.env.local` in development
- Never commit `.env.local` to version control

### Step 5: Create Environment Templates

**Backend `.env.example`**:

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai

cat > .env.example << 'EOF'
# Copy this file to .env and fill in your values
# DO NOT commit .env to version control

# Application
APP_NAME="Agentic Marketing AI"
ENVIRONMENT="development"
DEBUG=True

# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI
OPENAI_API_KEY="sk-proj-..."
OPENAI_VECTOR_STORE_ID="vs_..."
OPENAI_DEFAULT_MODEL="gpt-4o-mini"

# Security
SECRET_KEY="generate-with-openssl-rand-hex-32"

# CORS
CORS_ORIGINS="http://localhost:3000"

EOF
```

**Frontend `.env.example`**:

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template

cat > .env.example << 'EOF'
# Copy this file to .env.local and fill in your values
# DO NOT commit .env.local to version control

# Application
NEXT_PUBLIC_APP_NAME="Agentic Marketing Dashboard"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_URL="http://localhost:8000"

# Feature Flags
NEXT_PUBLIC_ENABLE_AGENTS=true

EOF
```

### Step 6: Verify Environment Configuration

**Test Backend Environment:**

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate

# Create test script
cat > test_env.py << 'EOF'
from config.settings import settings

print("🔍 Testing Backend Environment Configuration\n")

print(f"✓ App Name: {settings.APP_NAME}")
print(f"✓ Environment: {settings.ENVIRONMENT}")
print(f"✓ Debug Mode: {settings.DEBUG}")
print(f"✓ Database URL: {settings.DATABASE_URL[:30]}...")
print(f"✓ OpenAI API Key: {settings.OPENAI_API_KEY[:20]}...")
print(f"✓ Default Model: {settings.OPENAI_DEFAULT_MODEL}")
print(f"✓ Vector Store: {settings.OPENAI_VECTOR_STORE_ID}")
print(f"✓ CORS Origins: {len(settings.CORS_ORIGINS)} origins configured")

print("\n✅ Backend environment configured successfully!")
EOF

python test_env.py
```

**Expected output:**
```
🔍 Testing Backend Environment Configuration

✓ App Name: Agentic Marketing AI
✓ Environment: development
✓ Debug Mode: True
✓ Database URL: postgresql://postgres.abc...
✓ OpenAI API Key: sk-proj-abc123defg...
✓ Default Model: gpt-4o-mini
✓ Vector Store: vs_abc123def456
✓ CORS Origins: 3 origins configured

✅ Backend environment configured successfully!
```

**Test Frontend Environment:**

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template

# Create test page
mkdir -p app/test-env
cat > app/test-env/page.tsx << 'EOF'
export default function TestEnvPage() {
  const config = {
    appName: process.env.NEXT_PUBLIC_APP_NAME,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    enableAgents: process.env.NEXT_PUBLIC_ENABLE_AGENTS,
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        🔍 Frontend Environment Test
      </h1>

      <div className="space-y-2">
        <p>✓ App Name: {config.appName}</p>
        <p>✓ App URL: {config.appUrl}</p>
        <p>✓ API URL: {config.apiUrl}</p>
        <p>✓ Agents Enabled: {config.enableAgents}</p>
      </div>

      <p className="mt-4 text-green-600 font-semibold">
        ✅ Frontend environment configured successfully!
      </p>
    </div>
  );
}
EOF

# Start dev server
pnpm run dev
```

Visit http://localhost:3000/test-env to verify.

### Step 7: Test OpenAI Connection

**Test OpenAI API:**

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai
source venv/bin/activate

cat > test_openai.py << 'EOF'
import asyncio
from openai import AsyncOpenAI
from config.settings import settings

async def test_openai():
    print("🔍 Testing OpenAI API Connection\n")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        # Test basic completion
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": "Say 'API connection successful!'"}
            ],
            max_tokens=20,
        )

        print(f"✓ OpenAI API: Connected")
        print(f"✓ Model: {response.model}")
        print(f"✓ Response: {response.choices[0].message.content}")
        print(f"✓ Tokens Used: {response.usage.total_tokens}")

        # Test Vector Store access (if ID provided)
        if settings.OPENAI_VECTOR_STORE_ID:
            vector_store = await client.beta.vector_stores.retrieve(
                settings.OPENAI_VECTOR_STORE_ID
            )
            print(f"✓ Vector Store: {vector_store.name}")
            print(f"  Files: {vector_store.file_counts.completed} completed")

        print("\n✅ OpenAI configuration verified!")

    except Exception as e:
        print(f"❌ Error: {e}")

asyncio.run(test_openai())
EOF

python test_openai.py
```

**Expected output:**
```
🔍 Testing OpenAI API Connection

✓ OpenAI API: Connected
✓ Model: gpt-4o-mini-2024-07-18
✓ Response: API connection successful!
✓ Tokens Used: 15
✓ Vector Store: Marketing Brand Context
  Files: 3 completed

✅ OpenAI configuration verified!
```

## Environment Variables Reference

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `APP_NAME` | Application name | No | "Agentic Marketing AI" |
| `ENVIRONMENT` | Environment (development/production) | No | "development" |
| `DEBUG` | Enable debug mode | No | False |
| `DATABASE_URL` | PostgreSQL connection string | **Yes** | - |
| `OPENAI_API_KEY` | OpenAI API key | **Yes** | - |
| `OPENAI_VECTOR_STORE_ID` | Vector Store ID | **Yes** | - |
| `OPENAI_DEFAULT_MODEL` | Default model | No | "gpt-4o-mini" |
| `SECRET_KEY` | JWT secret key | **Yes** | - |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | No | "http://localhost:3000" |
| `LOG_LEVEL` | Logging level | No | "INFO" |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_NAME` | Application name | No | "Agentic Marketing Dashboard" |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | No | "http://localhost:3000" |
| `NEXT_PUBLIC_API_URL` | Backend API URL | **Yes** | - |
| `NEXT_PUBLIC_ENABLE_AGENTS` | Enable agents feature | No | true |
| `NODE_ENV` | Node environment | No | "development" |

## Security Best Practices

### ✅ DO:
- Use strong, unique values for `SECRET_KEY`
- Store sensitive values in `.env` files (never in code)
- Use different API keys for development and production
- Set up usage limits on OpenAI account
- Use environment-specific values
- Rotate API keys periodically

### ❌ DON'T:
- Commit `.env` or `.env.local` to version control
- Share API keys in Slack, email, or tickets
- Use production credentials in development
- Hardcode secrets in source code
- Use default/weak SECRET_KEY values
- Expose backend-only variables in frontend

## Troubleshooting

### Issue: "Environment variable not found"

**Solution:**
```bash
# Backend: Verify .env file exists and is loaded
cd market-ai
cat .env

# Frontend: Verify .env.local exists
cd agentic-crm-template
cat .env.local

# Restart servers after changing .env files
```

### Issue: CORS errors in browser console

**Solution:**
1. Check `CORS_ORIGINS` in backend `.env` includes your frontend URL
2. Verify frontend is using correct `NEXT_PUBLIC_API_URL`
3. Restart backend server after changing CORS settings

### Issue: OpenAI API "authentication failed"

**Solution:**
1. Verify API key is correct in `.env`
2. Check for spaces or quotes around the key
3. Verify account has credits: https://platform.openai.com/account/billing
4. Generate new API key if needed

### Issue: "Vector Store not found"

**Solution:**
1. Verify Vector Store ID in `.env` is correct
2. Check Vector Store exists: https://platform.openai.com/storage
3. Ensure files in Vector Store are processed (status: "completed")

### Issue: Database connection fails

**Solution:**
1. Verify DATABASE_URL format: `postgresql://user:pass@host:5432/db`
2. Check Supabase project is not paused
3. Test connection with psql or GUI tool
4. URL-encode password if it contains special characters

## Next Steps

✅ **Phase 1.4 Complete!** All environment variables configured and tested.

**Continue to:**
- [05_DEPLOYMENT_CONFIG.md](./05_DEPLOYMENT_CONFIG.md) - Configure deployment to Netlify and Render

**Good to know:**
- Environment variables are loaded at build time in Next.js
- Changing `NEXT_PUBLIC_*` variables requires rebuilding frontend
- Backend `.env` changes require server restart
- Use `.env.production` for production-specific overrides
- Never commit API keys or secrets to version control
