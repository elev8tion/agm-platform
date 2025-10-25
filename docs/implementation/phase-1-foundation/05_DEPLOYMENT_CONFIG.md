# Phase 1.5: Deployment Configuration

## Overview

This document provides complete deployment configuration for hosting the frontend on Netlify and backend on Render, including build scripts, environment variables, and health checks.

**Outcomes:**
- Frontend configured for Netlify deployment
- Backend configured for Render deployment
- Build scripts optimized for production
- Environment variables mapped correctly
- Health checks and monitoring configured
- SSL/HTTPS configured automatically

## Prerequisites

**Required:**
- Completed [01_PROJECT_SETUP.md](./01_PROJECT_SETUP.md)
- Completed [02_BACKEND_SETUP.md](./02_BACKEND_SETUP.md)
- Completed [03_DATABASE_SCHEMA.md](./03_DATABASE_SCHEMA.md)
- Completed [04_ENVIRONMENT_CONFIG.md](./04_ENVIRONMENT_CONFIG.md)
- GitHub account with repository
- Netlify account (free tier)
- Render account (free tier)

**Recommended:**
- Custom domain (optional, can use Netlify/Render subdomains)
- Understanding of CI/CD concepts

## Step-by-Step Instructions

### Step 1: Prepare Git Repository

```bash
# Navigate to project root
cd /Users/kcdacre8tor/agentic-marketing-dashboard

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Phase 1 Foundation complete"

# Create GitHub repository (via GitHub CLI or web)
# Using GitHub CLI:
gh repo create agentic-marketing-dashboard --public --source=. --remote=origin

# Or create manually on GitHub and add remote:
git remote add origin https://github.com/YOUR-USERNAME/agentic-marketing-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Configure Frontend for Netlify

#### Create `netlify.toml`

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template

cat > netlify.toml << 'EOF'
# Netlify configuration for Next.js 16
# Docs: https://docs.netlify.com/configure-builds/file-based-configuration/

[build]
  # Build command
  command = "npm run build"

  # Directory with build output
  publish = ".next"

  # Base directory for build
  base = "agentic-crm-template"

  # Node version
  [build.environment]
    NODE_VERSION = "18.17.0"
    NPM_VERSION = "9.6.7"

# Next.js specific settings
[[plugins]]
  package = "@netlify/plugin-nextjs"

# Headers for security and performance
[[headers]]
  for = "/*"
  [headers.values]
    # Security headers
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"

    # Cache control
    Cache-Control = "public, max-age=31536000, immutable"

# Cache static assets aggressively
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Don't cache HTML pages
[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

# Redirects
[[redirects]]
  from = "/home"
  to = "/"
  status = 301
  force = true

# Catch-all redirect for SPA (if needed)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false

# Environment-specific settings
[context.production]
  command = "npm run build"
  [context.production.environment]
    NODE_ENV = "production"
    NEXT_PUBLIC_APP_URL = "https://your-domain.netlify.app"

[context.deploy-preview]
  command = "npm run build"
  [context.deploy-preview.environment]
    NODE_ENV = "production"

[context.branch-deploy]
  command = "npm run build"
  [context.branch-deploy.environment]
    NODE_ENV = "development"

# Functions (for API routes if needed)
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# Dev server settings
[dev]
  command = "npm run dev"
  port = 3000
  publish = ".next"
  autoLaunch = false
EOF
```

#### Update `package.json` for Netlify

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template

# Update package.json scripts section
cat > package.json.patch << 'EOF'
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postbuild": "next-sitemap",
    "analyze": "ANALYZE=true npm run build"
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.6.7"
  }
}
EOF

# Manually merge this into your package.json
```

#### Install Netlify Plugin

```bash
npm install -D @netlify/plugin-nextjs
```

### Step 3: Configure Backend for Render

#### Create `render.yaml`

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai

cat > render.yaml << 'EOF'
# Render Blueprint for FastAPI Backend
# Docs: https://render.com/docs/blueprint-spec

services:
  # FastAPI Web Service
  - type: web
    name: agentic-marketing-api
    env: python
    region: oregon
    plan: free  # Change to 'starter' ($7/month) for production
    branch: main
    rootDir: market-ai

    # Build command
    buildCommand: |
      pip install --upgrade pip
      pip install -r requirements.txt

    # Start command
    startCommand: |
      alembic upgrade head
      uvicorn main:app --host 0.0.0.0 --port $PORT

    # Health check
    healthCheckPath: /health

    # Environment variables (set in Render dashboard)
    envVars:
      - key: PYTHON_VERSION
        value: 3.13.0

      - key: ENVIRONMENT
        value: production

      - key: DEBUG
        value: false

      - key: DATABASE_URL
        fromDatabase:
          name: agentic-marketing-db
          property: connectionString

      - key: OPENAI_API_KEY
        sync: false  # Set manually in dashboard

      - key: OPENAI_VECTOR_STORE_ID
        sync: false  # Set manually in dashboard

      - key: SECRET_KEY
        generateValue: true

      - key: CORS_ORIGINS
        value: https://your-domain.netlify.app,https://*.netlify.app

      - key: LOG_LEVEL
        value: INFO

# Database
databases:
  - name: agentic-marketing-db
    databaseName: agentic_marketing
    plan: free  # Change to 'starter' for production
    region: oregon
EOF
```

#### Create Production Requirements

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai

cat > requirements-prod.txt << 'EOF'
# Production requirements
# Optimized for Render deployment

# Core (same as development)
fastapi==0.115.6
uvicorn[standard]==0.34.0
python-multipart==0.0.20
python-dotenv==1.0.1

# OpenAI
openai-agents==0.1.0
openai==1.59.5

# Database
asyncpg==0.30.0
sqlalchemy==2.0.36
alembic==1.14.0
psycopg2-binary==2.9.10

# Validation
pydantic==2.10.4
pydantic-settings==2.7.0

# HTTP
httpx==0.28.1
aiohttp==3.11.11

# Utilities
python-dateutil==2.9.0
python-slugify==8.0.4
loguru==0.7.3

# Production-only
gunicorn==23.0.0  # WSGI server for production
EOF
```

**Note:** For Render, we'll use the main `requirements.txt` which already includes all dependencies.

#### Create Render Build Script

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai

mkdir -p scripts

cat > scripts/render_build.sh << 'EOF'
#!/bin/bash
# Render build script
# Runs during deployment on Render

set -e  # Exit on error

echo "🚀 Starting Render build..."

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️  Running database migrations..."
alembic upgrade head

echo "✅ Build complete!"
EOF

chmod +x scripts/render_build.sh
```

#### Create Health Check Endpoints (already done in 02_BACKEND_SETUP.md)

Verify `api/routes/health.py` exists with these endpoints:
- `/health` - Basic health check
- `/health/ready` - Readiness check (includes database)

### Step 4: Create Deployment Scripts

#### Frontend Deploy Script

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/agentic-crm-template

cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
# Deploy frontend to Netlify

set -e

echo "🚀 Deploying frontend to Netlify..."

# Type check
echo "🔍 Type checking..."
npm run type-check

# Lint
echo "🔍 Linting..."
npm run lint

# Build
echo "🏗️  Building..."
npm run build

# Deploy with Netlify CLI
echo "📤 Deploying..."
netlify deploy --prod

echo "✅ Frontend deployed successfully!"
EOF

chmod +x scripts/deploy.sh
```

#### Backend Deploy Script

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard/market-ai

cat > scripts/deploy.sh << 'EOF'
#!/bin/bash
# Deploy backend to Render via git push

set -e

echo "🚀 Deploying backend to Render..."

# Run tests
echo "🧪 Running tests..."
# pytest tests/  # Uncomment when tests are added

# Push to main branch (triggers Render deploy)
echo "📤 Pushing to main..."
git push origin main

echo "✅ Backend deploy triggered!"
echo "📊 Check deploy status: https://dashboard.render.com"
EOF

chmod +x scripts/deploy.sh
```

### Step 5: Set Up Netlify Deployment

#### Deploy via Netlify UI

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Choose **GitHub** and authorize
4. Select your repository: `agentic-marketing-dashboard`
5. Configure build settings:
   - **Base directory**: `agentic-crm-template`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Branch**: `main`

6. Click **Add environment variables**:
   ```
   NEXT_PUBLIC_APP_NAME=Agentic Marketing Dashboard
   NEXT_PUBLIC_API_URL=https://agentic-marketing-api.onrender.com
   NEXT_PUBLIC_ENABLE_AGENTS=true
   NODE_VERSION=18.17.0
   ```

7. Click **Deploy site**

8. Wait for deploy (2-3 minutes)

9. Your site will be available at: `https://random-name-12345.netlify.app`

#### Configure Custom Domain (Optional)

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain: `yoursite.com`
4. Follow DNS configuration instructions
5. SSL certificate auto-generated (5-10 minutes)

### Step 6: Set Up Render Deployment

#### Deploy via Render Dashboard

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Connect GitHub repository: `agentic-marketing-dashboard`
4. Configure service:
   - **Name**: `agentic-marketing-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `market-ai`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

5. Add environment variables:
   ```
   PYTHON_VERSION=3.13.0
   ENVIRONMENT=production
   DEBUG=false
   DATABASE_URL=<your-supabase-url>
   OPENAI_API_KEY=<your-openai-key>
   OPENAI_VECTOR_STORE_ID=<your-vector-store-id>
   SECRET_KEY=<generate-with-openssl>
   CORS_ORIGINS=https://your-netlify-site.netlify.app
   LOG_LEVEL=INFO
   ```

6. Click **Create Web Service**

7. Wait for deploy (3-5 minutes)

8. Your API will be available at: `https://agentic-marketing-api.onrender.com`

#### Create Render Database (if not using Supabase)

1. In Render dashboard, click **New +** → **PostgreSQL**
2. Configure:
   - **Name**: `agentic-marketing-db`
   - **Region**: Oregon (same as web service)
   - **Plan**: Free
3. Click **Create Database**
4. Copy **Internal Database URL** and add to web service environment variables

### Step 7: Configure Environment Variables for Production

#### Update Frontend Environment Variables in Netlify

1. Go to Netlify dashboard → **Site settings** → **Environment variables**
2. Update `NEXT_PUBLIC_API_URL` with your Render backend URL:
   ```
   NEXT_PUBLIC_API_URL=https://agentic-marketing-api.onrender.com
   ```
3. Add production-specific variables:
   ```
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   NODE_ENV=production
   ```
4. Click **Save**
5. Trigger redeploy: **Deploys** → **Trigger deploy** → **Deploy site**

#### Update Backend CORS in Render

1. Go to Render dashboard → Your web service → **Environment**
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-site.netlify.app,https://*.netlify.app
   ```
3. Click **Save changes**
4. Service auto-redeploys

### Step 8: Set Up Monitoring and Logging

#### Netlify Monitoring

Netlify provides built-in monitoring:
- **Analytics**: Track page views, unique visitors
- **Deploy logs**: View build logs for each deploy
- **Function logs**: Monitor serverless functions (if used)

Access in Netlify dashboard → **Analytics** and **Deploys**

#### Render Monitoring

Render provides:
- **Metrics**: CPU, memory, request rate
- **Logs**: Real-time application logs
- **Health checks**: Automatic monitoring

Access in Render dashboard → **Metrics** and **Logs**

#### Set Up Log Retention

Backend logs are automatically written to `logs/` directory (configured in Phase 1.2).

**For production logging:**

1. Use Render's built-in logging (accessible via dashboard)
2. For long-term retention, configure external logging:
   - **Loguru** (already configured) writes to files
   - **Datadog**: Set up Datadog integration in Render
   - **Sentry**: Add Sentry SDK for error tracking

### Step 9: Create CI/CD Workflow (Optional)

#### GitHub Actions for Testing

```bash
cd /Users/kcdacre8tor/agentic-marketing-dashboard

mkdir -p .github/workflows

cat > .github/workflows/test.yml << 'EOF'
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  # Frontend tests
  frontend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./agentic-crm-template

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.17'
          cache: 'npm'
          cache-dependency-path: './agentic-crm-template/package-lock.json'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  # Backend tests
  backend-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./market-ai

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: 'pip'
          cache-dependency-path: './market-ai/requirements.txt'

      - name: Install dependencies
        run: |
          pip install --upgrade pip
          pip install -r requirements.txt

      - name: Run tests
        run: pytest tests/ -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      # - name: Upload coverage
      #   uses: codecov/codecov-action@v4
      #   with:
      #     file: ./coverage.xml
EOF
```

### Step 10: Create Deployment Checklist

Create `docs/deployment-checklist.md`:

```markdown
# Deployment Checklist

Use this checklist before each deployment.

## Pre-Deploy

### Frontend
- [ ] All environment variables configured in Netlify
- [ ] `NEXT_PUBLIC_API_URL` points to production backend
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds locally
- [ ] Test production build: `npm run start`

### Backend
- [ ] All environment variables configured in Render
- [ ] Database migrations ready: `alembic upgrade head`
- [ ] OpenAI API key has sufficient credits
- [ ] Vector Store files uploaded and processed
- [ ] CORS origins include frontend URL
- [ ] Health checks responding: `curl https://your-api.onrender.com/health`

### Database
- [ ] Backup created (if production)
- [ ] Migrations tested locally
- [ ] Connection string verified

## Deploy

### Frontend (Netlify)
- [ ] Push code to `main` branch
- [ ] Wait for auto-deploy (or trigger manually)
- [ ] Check deploy logs for errors
- [ ] Verify site loads: https://your-site.netlify.app

### Backend (Render)
- [ ] Push code to `main` branch
- [ ] Wait for auto-deploy
- [ ] Check deploy logs for errors
- [ ] Verify health check: https://your-api.onrender.com/health
- [ ] Test API endpoint: https://your-api.onrender.com/api/agents/status

## Post-Deploy

- [ ] Test frontend → backend communication
- [ ] Test agent execution
- [ ] Check error logs (first 30 minutes)
- [ ] Verify SSL certificates (both sites)
- [ ] Test from mobile device
- [ ] Update documentation with new URLs

## Rollback (if needed)

### Netlify
- [ ] Go to Deploys → Click on previous deploy → Publish deploy

### Render
- [ ] Go to service → Events → Revert to previous deploy
```

## Verification

### Step 1: Verify Frontend Deployment

```bash
# Check if site is live
curl -I https://your-site.netlify.app

# Expected: HTTP/2 200
```

Visit your Netlify URL in browser and verify:
- ✓ Site loads
- ✓ No console errors
- ✓ API calls work (check Network tab)

### Step 2: Verify Backend Deployment

```bash
# Check health endpoint
curl https://agentic-marketing-api.onrender.com/health

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-25T...",
#   "service": "Agentic Marketing AI",
#   "version": "1.0.0"
# }

# Check agents endpoint
curl https://agentic-marketing-api.onrender.com/api/agents/status

# Expected: JSON with agent statuses
```

### Step 3: Verify CORS

Open browser console on your Netlify site:

```javascript
// Test API call
fetch('https://agentic-marketing-api.onrender.com/api/agents/status')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

Expected: No CORS errors, successful response

### Step 4: Verify Database Connection

```bash
# Check if migrations ran
curl https://agentic-marketing-api.onrender.com/api/campaigns

# Should return campaigns (or empty array if no data)
```

### Step 5: Test Full Workflow

1. Visit frontend
2. Navigate to agents page
3. Trigger agent execution
4. Verify result appears
5. Check Render logs for agent activity

## Troubleshooting

### Issue: Netlify build fails

**Common causes:**
- Missing environment variables
- Node version mismatch
- Dependency installation failed

**Solution:**
1. Check build logs in Netlify dashboard
2. Verify `netlify.toml` configuration
3. Test build locally: `npm run build`
4. Clear cache and retry: **Options** → **Clear cache and retry deploy**

### Issue: Render deploy fails

**Common causes:**
- Python version mismatch
- Missing dependencies
- Database migration failed

**Solution:**
1. Check deploy logs in Render dashboard
2. Verify `render.yaml` configuration
3. Test locally with production settings
4. Check environment variables are set

### Issue: CORS errors in production

**Solution:**
1. Verify `CORS_ORIGINS` in Render includes full Netlify URL (with https://)
2. Don't use wildcards (`*`) - list specific domains
3. Restart Render service after changing CORS settings
4. Clear browser cache

### Issue: Database connection errors

**Solution:**
1. Verify `DATABASE_URL` format is correct
2. Check Supabase project is active (not paused)
3. Test connection with psql from Render shell:
   ```bash
   psql $DATABASE_URL
   ```
4. Verify firewall rules (Supabase has none by default)

### Issue: OpenAI API errors in production

**Solution:**
1. Verify `OPENAI_API_KEY` is set in Render
2. Check API key has credits
3. Verify Vector Store ID is correct
4. Test with curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

### Issue: 500 errors from backend

**Solution:**
1. Check Render logs: **Logs** tab in dashboard
2. Look for Python exceptions
3. Verify all environment variables are set
4. Check database connectivity
5. Restart service: **Manual Deploy** → **Deploy latest commit**

### Issue: Slow response times

**Solution:**
- Render free tier spins down after 15 min inactivity
- First request after spindown takes 30-60 seconds
- Upgrade to paid plan ($7/mo) for always-on service
- Or implement keep-alive ping every 10 minutes

## Performance Optimization

### Frontend (Netlify)

1. **Enable caching** (already in `netlify.toml`)
2. **Image optimization**:
   - Use Next.js `Image` component
   - Serve images from CDN
3. **Code splitting**:
   - Use dynamic imports
   - Lazy load components
4. **Analytics**:
   - Enable Netlify Analytics
   - Set up Google Analytics

### Backend (Render)

1. **Database connection pooling** (already configured)
2. **Caching**:
   - Cache frequent queries
   - Use Redis (Render add-on)
3. **Rate limiting**:
   - Limit requests per IP
   - Prevent abuse
4. **Background jobs**:
   - Use Celery for long tasks
   - Implement job queue

## Cost Estimation

### Free Tier Limits

**Netlify:**
- ✓ 100GB bandwidth/month
- ✓ 300 build minutes/month
- ✓ Unlimited sites
- **Cost**: $0/month

**Render (Free):**
- ✓ 512MB RAM
- ✓ Spins down after 15min inactivity
- ✓ PostgreSQL 256MB storage
- **Cost**: $0/month
- **Limitations**: Slow cold starts

**Render (Starter - Recommended):**
- ✓ 512MB RAM
- ✓ Always-on (no spin down)
- ✓ PostgreSQL 1GB storage
- **Cost**: $7/month web service + $7/month database = $14/month

**OpenAI API:**
- gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- Estimated: $10-50/month depending on usage

**Total Monthly Cost:**
- Development: $0 (all free tiers)
- Production: $14-64/month (Render + OpenAI)

## Next Steps

✅ **Phase 1.5 Complete!** Your application is now deployed to production.

**Next Phases:**
- **Phase 2**: Build core UI components and layouts
- **Phase 3**: Implement agent management system
- **Phase 4**: Add campaign management features
- **Phase 5**: Implement analytics and reporting

**Good to know:**
- Both Netlify and Render auto-deploy on git push to `main`
- SSL certificates are automatic and free
- Use branch deploys for testing (Netlify: deploy previews, Render: PR previews)
- Monitor costs in OpenAI dashboard
- Set up alerts for high API usage
- Implement caching to reduce API calls
