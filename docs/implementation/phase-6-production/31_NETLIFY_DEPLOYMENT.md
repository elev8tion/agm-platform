# 31. Netlify Frontend Deployment

## Overview

This guide covers deploying the Next.js frontend to Netlify with production-grade configuration including automatic deployments, preview environments, custom domains, and performance optimizations.

**Production Considerations:**
- Automatic deployments from Git
- Preview deployments for pull requests
- Edge functions for dynamic content
- Custom headers and redirects
- CDN caching strategies
- Environment variable management

## Prerequisites

**Completed Phases:**
- Phase 6: Production Build (Document 30)

**Required Accounts:**
- Netlify account (https://netlify.com)
- GitHub account (for automatic deployments)
- Custom domain (optional)

## Netlify Configuration

### Step 1: netlify.toml Configuration

**File: `agentic-crm-template/netlify.toml`**

```toml
[build]
  # Build command
  command = "npm run build"

  # Publish directory (Next.js output)
  publish = ".next"

  # Build environment
  environment = { NODE_VERSION = "20.11.0" }

[build.processing]
  # Skip Netlify's image processing (Next.js handles this)
  skip_processing = false

[build.processing.css]
  bundle = true
  minify = true

[build.processing.js]
  bundle = true
  minify = true

[build.processing.html]
  pretty_urls = true

[build.processing.images]
  compress = true

# Redirect rules
[[redirects]]
  from = "/api/backend/*"
  to = "https://your-backend.onrender.com/:splat"
  status = 200
  force = true
  headers = {X-From = "Netlify"}
  conditions = {Role = ["admin", "user"]}

[[redirects]]
  from = "/home"
  to = "/"
  status = 301

[[redirects]]
  from = "/dashboard/*"
  to = "/dashboard/:splat"
  status = 200
  conditions = {Role = ["user"]}

# SPA fallback (for client-side routing)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Custom headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000" # 30 days

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Type = "application/javascript; charset=utf-8"

[[headers]]
  for = "/*.css"
  [headers.values]
    Content-Type = "text/css; charset=utf-8"

# Content Security Policy
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' data: https://fonts.gstatic.com;
      connect-src 'self' https://*.clerk.accounts.dev https://api.yourdomain.com https://your-backend.onrender.com;
      frame-src 'self' https://challenges.cloudflare.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    '''

# Plugin configuration
[[plugins]]
  package = "@netlify/plugin-nextjs"

[[plugins]]
  package = "netlify-plugin-cache"
  [plugins.inputs]
    paths = [
      "node_modules",
      ".next/cache"
    ]

# Context-specific settings
[context.production]
  command = "npm run build"
  environment = { NODE_ENV = "production" }

[context.deploy-preview]
  command = "npm run build"
  environment = { NODE_ENV = "production", CONTEXT = "deploy-preview" }

[context.branch-deploy]
  command = "npm run build"

# Development context
[context.dev]
  command = "npm run dev"
  environment = { NODE_ENV = "development" }
  targetPort = 3000
  autoLaunch = false

# Functions configuration (if using Netlify Functions)
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  external_node_modules = ["sharp"]

# Edge Functions configuration
[[edge_functions]]
  path = "/api/edge/*"
  function = "hello"

# Forms (if using Netlify Forms)
```

### Step 2: Custom Headers File

**File: `agentic-crm-template/public/_headers`**

```
# Global headers
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

# Cache static assets aggressively
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/static/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=2592000

# Don't cache API routes
/api/*
  Cache-Control: no-cache, no-store, must-revalidate

# Security headers for API
/api/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
```

### Step 3: Redirects File

**File: `agentic-crm-template/public/_redirects`**

```
# API proxy to backend
/api/backend/*  https://your-backend.onrender.com/:splat  200

# Legacy URL redirects
/home           /                                          301
/login          /sign-in                                   301
/register       /sign-up                                   301

# Redirect old campaign URLs
/campaign/*     /campaigns/:splat                          301

# SPA fallback for client-side routing
/*              /index.html                                200
```

## Deployment Setup

### Step 1: Connect GitHub Repository

1. **Sign up / Log in to Netlify**
   - Go to https://netlify.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select your repository
   - Authorize Netlify

3. **Configure Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   Base directory: agentic-crm-template
   ```

### Step 2: Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables:

```env
# Production Environment Variables

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
NEXT_PUBLIC_API_URL=https://your-api.onrender.com

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

**Setting Scoped Variables:**
- Production: All variables above
- Deploy Preview: Same as production (use test keys)
- Branch deploys: Development settings

### Step 3: Build Hooks

Create build hooks for manual deployments:

1. Go to Site Settings → Build & Deploy → Build Hooks
2. Create hook: "Production Deploy"
3. Copy webhook URL
4. Trigger with:
   ```bash
   curl -X POST -d '{}' https://api.netlify.com/build_hooks/YOUR_HOOK_ID
   ```

## Netlify Edge Functions (Optional)

### Edge Function Example

**File: `agentic-crm-template/netlify/edge-functions/hello.ts`**

```typescript
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);

  // Geo-location example
  const country = context.geo?.country?.name || "Unknown";

  return new Response(
    JSON.stringify({
      message: "Hello from the edge!",
      location: country,
      path: url.pathname,
    }),
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
};

export const config = { path: "/api/edge/*" };
```

## Custom Domain Setup

### Step 1: Add Domain

1. **In Netlify Dashboard**
   - Go to Site Settings → Domain Management
   - Click "Add domain"
   - Enter your domain: `app.yourdomain.com`

2. **DNS Configuration**

   **Option A: Netlify DNS (Recommended)**
   ```
   Point nameservers to Netlify:
   - dns1.p01.nsone.net
   - dns2.p01.nsone.net
   - dns3.p01.nsone.net
   - dns4.p01.nsone.net
   ```

   **Option B: External DNS**
   ```
   Add CNAME record:
   Type: CNAME
   Name: app
   Value: your-site.netlify.app
   TTL: 3600
   ```

3. **SSL Certificate**
   - Netlify auto-provisions Let's Encrypt SSL
   - Enable HTTPS redirect
   - Enable HTTP/2

### Step 2: Domain Verification

**File: `agentic-crm-template/public/.well-known/security.txt`**

```
Contact: mailto:security@yourdomain.com
Expires: 2025-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://app.yourdomain.com/.well-known/security.txt
```

## Deployment Workflows

### Automatic Deployments

**Netlify automatically deploys when:**
- Code pushed to `main` branch → Production
- Pull request opened → Deploy Preview
- Code pushed to other branches → Branch Deploy

### Deploy Preview Comments

Netlify automatically comments on PRs with preview URLs:

```
✅ Deploy Preview ready!

🔍 Inspect: https://app.netlify.com/sites/your-site/deploys/xxx
🌎 Preview: https://deploy-preview-123--your-site.netlify.app

Built without sensitive environment variables
```

### Production Deploy Workflow

1. **Merge to main**
   ```bash
   git checkout main
   git pull origin main
   git merge feature/new-feature
   git push origin main
   ```

2. **Netlify Build Process**
   - Detects push to main
   - Starts build
   - Runs `npm run build`
   - Publishes to production
   - Invalidates CDN cache

3. **Post-Deploy**
   - Verify deployment: https://your-app.netlify.app
   - Check deploy logs
   - Monitor errors in Sentry

## Performance Optimizations

### Asset Optimization

Netlify automatically:
- Compresses CSS/JS with Brotli/Gzip
- Optimizes images (if configured)
- Minifies HTML
- Bundles assets

### CDN Configuration

```toml
# netlify.toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000, s-maxage=2592000"
```

### Prerendering

```javascript
// next.config.ts
export default {
  // Generate static pages at build time
  output: 'export', // For fully static sites
  // OR
  generateStaticParams: true, // For ISR
};
```

## Monitoring Deployment

### Build Logs

Access in Netlify Dashboard → Deploys → Click deploy → View logs

```
12:00:00 PM: Build ready to start
12:00:01 PM: Fetching cached dependencies
12:00:02 PM: Installing NPM modules using NPM version 10.2.4
12:00:30 PM: NPM modules installed
12:00:31 PM: Running build command: npm run build
12:01:45 PM: Build script success
12:01:46 PM: Deploying to CDN
12:01:50 PM: Deploy complete!
```

### Deploy Notifications

Configure in Site Settings → Build & Deploy → Deploy notifications:

1. **Email Notifications**
   - Deploy started
   - Deploy succeeded
   - Deploy failed

2. **Slack Integration**
   ```
   Add to Site:
   Settings → Build & Deploy → Deploy notifications
   → Add notification → Slack
   ```

3. **Webhook Notifications**
   ```bash
   # Custom webhook on deploy success
   curl -X POST https://your-webhook.com/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "event": "deploy_succeeded",
       "site_name": "your-app",
       "url": "https://your-app.netlify.app"
     }'
   ```

## Rollback Procedure

### Manual Rollback

1. **In Netlify Dashboard**
   - Go to Deploys
   - Find previous successful deploy
   - Click "Publish deploy"
   - Confirm rollback

2. **Automated Rollback (via CLI)**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # List deploys
   netlify deploy:list

   # Rollback to specific deploy
   netlify deploy --prod --alias=DEPLOY_ID
   ```

## Testing Deployment

### Pre-Deploy Checklist

```bash
# 1. Test production build locally
npm run build
npm run preview

# 2. Run all tests
npm run test

# 3. Check type safety
npm run type-check

# 4. Lint code
npm run lint

# 5. Check bundle size
npm run build:analyze
```

### Post-Deploy Verification

```bash
# Test production URL
curl -I https://your-app.netlify.app

# Check SSL certificate
openssl s_client -connect your-app.netlify.app:443 -servername your-app.netlify.app

# Test redirects
curl -I https://your-app.netlify.app/home

# Test API proxy
curl https://your-app.netlify.app/api/backend/health
```

## GitHub Actions Integration

**File: `agentic-crm-template/.github/workflows/netlify.yml`**

```yaml
name: Netlify Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: agentic-crm-template/package-lock.json

      - name: Install dependencies
        working-directory: agentic-crm-template
        run: npm ci

      - name: Type check
        working-directory: agentic-crm-template
        run: npm run type-check

      - name: Lint
        working-directory: agentic-crm-template
        run: npm run lint

      - name: Test
        working-directory: agentic-crm-template
        run: npm run test

      - name: Build
        working-directory: agentic-crm-template
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: 'agentic-crm-template/.next'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}

      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Deploy preview ready! Check Netlify for URL.'
            })
```

## Troubleshooting

### Common Issues

1. **Build fails with "Module not found"**
   ```bash
   # Solution: Check netlify.toml base directory
   [build]
     base = "agentic-crm-template"
   ```

2. **Environment variables not working**
   ```bash
   # Solution: Check variable names match exactly (case-sensitive)
   # Must use NEXT_PUBLIC_ prefix for client-side variables
   ```

3. **404 on page refresh**
   ```bash
   # Solution: Add SPA fallback redirect
   # In _redirects:
   /* /index.html 200
   ```

4. **Large deploy times**
   ```bash
   # Solution: Enable build cache
   [[plugins]]
     package = "netlify-plugin-cache"
   ```

5. **API proxy not working**
   ```bash
   # Solution: Check redirect rule in netlify.toml
   [[redirects]]
     from = "/api/backend/*"
     to = "https://your-backend.onrender.com/:splat"
     status = 200
   ```

## Best Practices

1. **Use Deploy Previews** - Test before merging to main
2. **Enable Branch Deploys** - Test feature branches
3. **Set up Notifications** - Know when deploys fail
4. **Monitor Build Times** - Optimize if >5 minutes
5. **Use Build Plugins** - Cache dependencies
6. **Secure Environment Variables** - Never commit secrets
7. **Test Locally First** - `npm run preview`
8. **Enable HTTPS Redirect** - Force secure connections
9. **Set up Custom Domain** - Professional appearance
10. **Monitor Performance** - Use Netlify Analytics

## Monitoring & Alerts

### Netlify Analytics

Enable in Site Settings → Analytics:
- Page views
- Unique visitors
- Top pages
- Bandwidth usage
- Form submissions

### Custom Monitoring

```javascript
// Monitor deploy success
fetch('https://your-monitoring.com/api/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    site: 'your-app',
    status: 'deployed',
    url: 'https://your-app.netlify.app',
    timestamp: new Date().toISOString(),
  }),
});
```

## Next Steps

1. **Deploy Backend to Render (Document 32)** - Complete the stack
2. **Set up Monitoring (Document 33)** - Track errors and performance
3. **Configure CDN** - Cloudflare (optional)
4. **Set up Staging Environment** - Pre-production testing
5. **Implement CI/CD** - Automated testing and deployment

---

**Netlify Deployment Checklist:**
- [ ] netlify.toml configured
- [ ] _headers file created
- [ ] _redirects file created
- [ ] GitHub repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Custom domain added (optional)
- [ ] SSL certificate enabled
- [ ] Deploy previews working
- [ ] Production deploy successful
- [ ] API proxy functioning
- [ ] Static assets cached properly
- [ ] Security headers present
- [ ] Performance optimized (Lighthouse 90+)
- [ ] Build notifications configured
