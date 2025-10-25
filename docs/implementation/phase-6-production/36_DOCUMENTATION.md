# 36. Documentation & Knowledge Base

## Overview

This guide covers creating comprehensive documentation for the Agentic Marketing Dashboard including user guides, API documentation, component documentation (Storybook), deployment guides, and troubleshooting resources.

**Production Considerations:**
- User-facing documentation (non-technical)
- Developer documentation (technical)
- API reference (auto-generated + custom)
- Component library (Storybook)
- Video tutorials (optional)
- Interactive documentation

## Prerequisites

**Completed Phases:**
- Phase 6: All previous documents (28-35)

**Dependencies:**
```bash
# Storybook for component documentation
npx storybook@latest init

# API documentation (FastAPI built-in)
# No additional dependencies needed
```

## User Documentation

### Step 1: User Guide Structure

**File: `docs/user-guide/README.md`**

```markdown
# Agentic Marketing Dashboard - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Campaign Management](#campaign-management)
4. [Content Generation](#content-generation)
5. [Lead Management](#lead-management)
6. [Analytics & Reports](#analytics-reports)
7. [Settings](#settings)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

## Getting Started

### Creating Your Account

1. Navigate to [app.yourdomain.com](https://app.yourdomain.com)
2. Click "Sign Up"
3. Enter your email and create a password
4. Verify your email address
5. Complete your profile

### First Login

After verification, you'll be redirected to the dashboard where you can:
- View your campaign overview
- Create your first campaign
- Generate AI-powered content
- Track leads and conversions

## Dashboard Overview

The dashboard provides a real-time snapshot of your marketing performance:

### Key Metrics (Top Row)
- **Total Campaigns**: Number of active campaigns
- **Total Leads**: Leads generated this month
- **Conversion Rate**: Percentage of leads converted
- **ROI**: Return on investment across all campaigns

### Recent Activity
- Latest campaign updates
- New leads captured
- Content approvals pending
- System notifications

### Quick Actions
- Create New Campaign
- Generate Content
- View Analytics Report
- Manage Team

## Campaign Management

### Creating a Campaign

1. Click "Create Campaign" button
2. Fill in campaign details:
   - **Name**: Descriptive campaign name
   - **Type**: Email, Social, Search, or Display
   - **Budget**: Total campaign budget
   - **Dates**: Start and end dates
3. Configure targeting options
4. Review and launch

### Managing Campaigns

**Edit Campaign**
1. Find campaign in list
2. Click three-dot menu
3. Select "Edit"
4. Make changes and save

**Pause/Resume Campaign**
- Click the pause icon to temporarily stop
- Click play icon to resume

**Delete Campaign**
- Click three-dot menu
- Select "Delete"
- Confirm deletion (cannot be undone)

### Campaign Analytics

Each campaign shows:
- **Impressions**: Number of times ad was shown
- **Clicks**: Number of clicks received
- **Cost**: Amount spent so far
- **Conversions**: Number of conversions
- **ROI**: Return on investment

## Content Generation

### AI-Powered Content

1. Navigate to Content tab
2. Click "Generate Content"
3. Select content type:
   - Blog Post
   - Email Campaign
   - Social Media Post
   - Ad Copy
4. Provide brief or keywords
5. Review AI-generated content
6. Edit as needed
7. Approve and publish

### Content Library

Access all generated content:
- **Drafts**: Unpublished content
- **Scheduled**: Content queued for publishing
- **Published**: Live content
- **Archived**: Historical content

### Editing Content

1. Click content item
2. Click "Edit"
3. Make changes in editor
4. Save draft or publish immediately

## Lead Management

### Viewing Leads

Access lead database:
- **All Leads**: Complete list
- **New**: Leads from last 7 days
- **Converted**: Leads that became customers
- **Lost**: Leads marked as lost

### Lead Details

Click any lead to view:
- Contact information
- Source campaign
- Interaction history
- Notes and tags
- Conversion status

### Importing Leads

1. Click "Import Leads"
2. Download CSV template
3. Fill in lead data
4. Upload CSV file
5. Review and confirm import

### Exporting Leads

1. Select leads to export
2. Click "Export"
3. Choose format (CSV or Excel)
4. Download file

## Analytics & Reports

### Pre-built Reports

Access standard reports:
- **Campaign Performance**: ROI by campaign
- **Lead Attribution**: Where leads come from
- **Content Engagement**: Top-performing content
- **Conversion Funnel**: Drop-off analysis

### Custom Reports

Create custom reports:
1. Click "New Report"
2. Select metrics to include
3. Choose date range
4. Apply filters
5. Save and schedule

### Scheduled Reports

Set up automatic reports:
- Daily summary email
- Weekly performance digest
- Monthly analytics report

## Settings

### Profile Settings

Update your account:
- Name and email
- Password
- Notification preferences
- Time zone

### Team Management

Invite team members:
1. Go to Settings → Team
2. Click "Invite Member"
3. Enter email and role
4. Send invitation

**Roles:**
- **Admin**: Full access
- **Manager**: Manage campaigns and content
- **User**: View and create content
- **Viewer**: Read-only access

### Integrations

Connect third-party tools:
- Google Analytics
- Google Ads
- Facebook Ads
- Mailchimp
- Salesforce

### Billing

Manage subscription:
- View current plan
- Upgrade/downgrade
- Update payment method
- View invoices

## Troubleshooting

### Common Issues

**Can't log in**
- Check email and password
- Try "Forgot Password"
- Clear browser cache
- Try different browser

**Campaign not showing**
- Check campaign status
- Verify dates are correct
- Refresh the page
- Contact support

**Content generation failed**
- Check your credit balance
- Try a different prompt
- Contact support if issue persists

**Data not updating**
- Allow 24 hours for data sync
- Refresh the page
- Check integration status

### Getting Help

**Support Channels:**
- Email: support@yourdomain.com
- Live Chat: Available 9am-5pm EST
- Help Center: help.yourdomain.com
- Video Tutorials: youtube.com/yourdomain

**Response Times:**
- Critical issues: < 1 hour
- High priority: < 4 hours
- Normal: < 24 hours

## FAQ

**How much does it cost?**
See our [pricing page](https://yourdomain.com/pricing) for current plans.

**Can I cancel anytime?**
Yes, cancel anytime from Settings → Billing.

**Is there a free trial?**
Yes, 14-day free trial with full access.

**How many campaigns can I create?**
Unlimited campaigns on all paid plans.

**Can I export my data?**
Yes, export anytime from Settings → Data Export.

**Is my data secure?**
Yes, we use industry-standard encryption and security practices.

**Do you offer refunds?**
See our [refund policy](https://yourdomain.com/refunds).
```

## API Documentation

### Step 1: FastAPI Auto-Generated Docs

**File: `market-ai/main.py`** (enhance OpenAPI config)

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="Marketing AI API",
        version="1.0.0",
        description="""
        # Marketing AI API

        The Marketing AI API provides AI-powered marketing automation capabilities.

        ## Authentication

        All endpoints require authentication using Bearer tokens:

        ```
        Authorization: Bearer YOUR_TOKEN_HERE
        ```

        Get your API token from the dashboard: Settings → API Keys

        ## Rate Limits

        - **Standard endpoints**: 100 requests/minute
        - **AI endpoints**: 10 requests/minute
        - **Bulk operations**: 5 requests/minute

        ## Error Responses

        The API uses standard HTTP status codes:

        - `200` - Success
        - `400` - Bad Request (validation error)
        - `401` - Unauthorized (invalid/missing token)
        - `403` - Forbidden (insufficient permissions)
        - `404` - Not Found
        - `429` - Too Many Requests (rate limit exceeded)
        - `500` - Internal Server Error

        ## Pagination

        List endpoints support pagination:

        ```
        GET /api/campaigns?page=1&limit=20
        ```

        Response includes pagination metadata:

        ```json
        {
          "data": [...],
          "pagination": {
            "page": 1,
            "limit": 20,
            "total": 150,
            "pages": 8
          }
        }
        ```

        ## Versioning

        The API version is included in the URL:

        ```
        https://api.yourdomain.com/v1/campaigns
        ```

        ## Support

        - Documentation: https://docs.yourdomain.com
        - Support: api-support@yourdomain.com
        """,
        routes=app.routes,
        contact={
            "name": "API Support",
            "email": "api-support@yourdomain.com",
            "url": "https://docs.yourdomain.com/support",
        },
        license_info={
            "name": "Proprietary",
        },
    )

    # Customize schemas
    openapi_schema["info"]["x-logo"] = {
        "url": "https://yourdomain.com/logo.png"
    }

    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }

    # Apply security globally
    openapi_schema["security"] = [{"BearerAuth": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app = FastAPI()
app.openapi = custom_openapi
```

### Step 2: API Examples

**File: `docs/api/examples.md`**

```markdown
# API Examples

## Authentication

### Get API Token

```bash
curl -X POST https://api.yourdomain.com/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

## Campaigns

### List Campaigns

```bash
curl https://api.yourdomain.com/v1/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Campaign

```bash
curl -X POST https://api.yourdomain.com/v1/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale 2024",
    "type": "email",
    "budget": 5000,
    "start_date": "2024-06-01T00:00:00Z",
    "end_date": "2024-08-31T23:59:59Z"
  }'
```

### Get Campaign

```bash
curl https://api.yourdomain.com/v1/campaigns/campaign-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Campaign

```bash
curl -X PATCH https://api.yourdomain.com/v1/campaigns/campaign-id \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budget": 7500
  }'
```

### Delete Campaign

```bash
curl -X DELETE https://api.yourdomain.com/v1/campaigns/campaign-id \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Content Generation

### Generate Content

```bash
curl -X POST https://api.yourdomain.com/v1/content/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "blog_post",
    "prompt": "Write about email marketing best practices",
    "length": "medium",
    "tone": "professional"
  }'
```

## Leads

### Create Lead

```bash
curl -X POST https://api.yourdomain.com/v1/leads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lead@example.com",
    "name": "Jane Doe",
    "source": "website",
    "campaign_id": "campaign-id"
  }'
```

### Export Leads

```bash
curl https://api.yourdomain.com/v1/leads/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: text/csv" \
  > leads.csv
```

## Error Handling

### Example Error Response

```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "budget",
      "message": "Budget must be a positive number"
    }
  ]
}
```

## Webhooks

### Configure Webhook

```bash
curl -X POST https://api.yourdomain.com/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["campaign.created", "lead.converted"]
  }'
```

### Webhook Payload Example

```json
{
  "event": "campaign.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "campaign-id",
    "name": "Summer Sale 2024",
    "status": "active"
  }
}
```
```

## Component Documentation (Storybook)

### Step 1: Storybook Configuration

**File: `agentic-crm-template/.storybook/main.ts`**

```typescript
import type { StorybookConfig } from '@storybook/nextjs';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
      };
    }
    return config;
  },
};

export default config;
```

### Step 2: Component Stories

**File: `agentic-crm-template/src/components/ui/Button.stories.tsx`**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'Visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Cancel',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Item
      </>
    ),
  },
};
```

## Deployment Documentation

**File: `docs/deployment.md`**

```markdown
# Deployment Guide

## Prerequisites

- Node.js 20+
- Python 3.13+
- PostgreSQL 16+
- Redis 7+
- Git

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/marketing-dashboard.git
cd marketing-dashboard
```

### 2. Configure Environment Variables

**Frontend (.env.production):**
```env
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
# ... (see Document 30)
```

**Backend (.env):**
```env
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-xxx
# ... (see Document 32)
```

### 3. Install Dependencies

**Frontend:**
```bash
cd agentic-crm-template
npm ci
```

**Backend:**
```bash
cd market-ai
pip install -r requirements.txt
```

## Deployment Steps

### Frontend (Netlify)

1. **Connect Repository**
   - Log in to Netlify
   - New Site → Import from Git
   - Select repository

2. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Base directory: `agentic-crm-template`

3. **Set Environment Variables**
   - Add all variables from `.env.production`

4. **Deploy**
   - Click "Deploy site"
   - Monitor build logs

### Backend (Render)

1. **Create Web Service**
   - New → Web Service
   - Connect repository

2. **Configure Service**
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

3. **Add Environment Variables**
   - Copy from `.env`

4. **Deploy**
   - Click "Create Web Service"
   - Monitor logs

### Database Migration

```bash
# SSH into Render shell
render ssh

# Run migrations
python -m alembic upgrade head
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check frontend
curl https://your-app.netlify.app

# Check backend
curl https://your-api.onrender.com/health
```

### 2. Configure DNS

- Add CNAME record for custom domain
- Enable SSL certificate

### 3. Set up Monitoring

- Configure Sentry alerts
- Enable uptime monitoring
- Set up log aggregation

## Rollback Procedure

### Frontend

1. Go to Netlify dashboard
2. Deploys tab
3. Find previous successful deploy
4. Click "Publish deploy"

### Backend

1. Go to Render dashboard
2. Find previous deploy
3. Redeploy from commit

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md)
```

## Troubleshooting Guide

**File: `docs/troubleshooting.md`**

```markdown
# Troubleshooting Guide

## Common Issues

### Build Failures

**Symptom:** Build fails with "Module not found"

**Solution:**
```bash
# Clear cache
npm run clean
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Rebuild
npm run build
```

### Authentication Errors

**Symptom:** "Invalid authentication credentials"

**Causes:**
- Expired JWT token
- Incorrect API key
- Missing Authorization header

**Solutions:**
1. Refresh token
2. Check API key in environment variables
3. Verify Authorization header format: `Bearer <token>`

### Database Connection Issues

**Symptom:** "Connection timeout" or "Connection refused"

**Solutions:**
1. Check DATABASE_URL is correct
2. Verify database is running
3. Check firewall/security group settings
4. Test connection:
   ```bash
   psql postgresql://user:pass@host:5432/dbname
   ```

### Rate Limit Exceeded

**Symptom:** 429 Too Many Requests

**Solutions:**
1. Implement exponential backoff
2. Reduce request frequency
3. Contact support for limit increase

### CORS Errors

**Symptom:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions:**
1. Add frontend origin to backend ALLOWED_ORIGINS
2. Check protocol (http vs https)
3. Verify credentials flag

## Error Messages

### "Campaign not found"

**Cause:** Invalid campaign ID or deleted campaign

**Solution:** Verify campaign ID exists

### "Insufficient permissions"

**Cause:** User doesn't have required role

**Solution:** Assign appropriate role from Settings → Team

### "Budget exceeded"

**Cause:** AI usage exceeded budget limit

**Solution:** Increase budget in settings or contact billing

## Performance Issues

### Slow Page Load

**Checks:**
1. Run Lighthouse audit
2. Check bundle size
3. Verify CDN caching
4. Check API response times

**Solutions:**
1. Optimize images
2. Enable code splitting
3. Implement lazy loading
4. Add caching headers

### Slow API Responses

**Checks:**
1. Check database query performance
2. Monitor server resources
3. Check for N+1 queries

**Solutions:**
1. Add database indexes
2. Implement caching
3. Optimize queries
4. Scale server resources

## Getting Help

**Before contacting support:**
1. Check this troubleshooting guide
2. Search documentation
3. Check system status page

**When contacting support, include:**
- Error message (exact text)
- Steps to reproduce
- Browser/OS version
- Screenshot (if applicable)
- User ID or email

**Contact:**
- Email: support@yourdomain.com
- Live Chat: Available 9am-5pm EST
- Emergency: (555) 123-4567
```

## Best Practices

1. **Keep docs up to date** - Update with code changes
2. **Include examples** - Real-world usage examples
3. **Add screenshots** - Visual aids for users
4. **Version documentation** - Match software versions
5. **Make searchable** - Good organization and indexing
6. **Test procedures** - Verify instructions work
7. **Get feedback** - User and developer input
8. **Translate** - Multiple languages for global users
9. **Video tutorials** - Supplement written docs
10. **Interactive demos** - Allow users to try features

## Next Steps

1. **Launch Checklist (Document 37)** - Final pre-launch steps
2. **Create Video Tutorials** - Screen recordings
3. **Set up Knowledge Base** - Searchable help center
4. **Implement In-App Help** - Context-sensitive guides
5. **Create Changelog** - Document version changes

---

**Documentation Checklist:**
- [ ] User guide written
- [ ] API documentation enhanced
- [ ] Storybook configured
- [ ] Component stories created
- [ ] Deployment guide documented
- [ ] Troubleshooting guide created
- [ ] Code examples provided
- [ ] Screenshots added
- [ ] FAQ compiled
- [ ] Support contacts listed
- [ ] Documentation reviewed
- [ ] Feedback collected
