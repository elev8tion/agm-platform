# 33. Monitoring & Observability

## Overview

This guide implements comprehensive monitoring for the Agentic Marketing Dashboard using Sentry (error tracking), PostHog (analytics), and log aggregation. Proactive monitoring ensures reliability and helps identify issues before users report them.

**Production Considerations:**
- Real-time error tracking
- User behavior analytics
- Performance monitoring (Core Web Vitals)
- Server health metrics
- Alert configuration
- Log aggregation and search

## Prerequisites

**Completed Phases:**
- Phase 6: Frontend and Backend Deployment (Documents 31-32)

**Required Accounts:**
- Sentry account (https://sentry.io)
- PostHog account (https://posthog.com)
- Loguru (included in Python)

## Sentry Error Tracking

### Step 1: Sentry Setup

**Create Sentry Projects:**
1. Sign up at https://sentry.io
2. Create project for Next.js (frontend)
3. Create project for Python (backend)
4. Copy DSN for each project

### Step 2: Frontend Sentry Integration

**Install Dependencies:**
```bash
cd agentic-crm-template
npm install @sentry/nextjs
```

**File: `agentic-crm-template/sentry.client.config.ts`**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",

  // Performance Monitoring
  tracesSampleRate: 0.1, // 10% of transactions

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        /^https:\/\/your-app\.netlify\.app/,
        /^https:\/\/your-api\.onrender\.com/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out noise
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    "moz-extension://",

    // Network errors
    "Network request failed",
    "NetworkError",
    "Failed to fetch",

    // Common React errors
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",

    // Non-Error promise rejections
    "Non-Error promise rejection captured",
  ],

  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],

  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event (dev):', event);
      return null;
    }

    // Filter out events from bots
    const userAgent = event.request?.headers?.['User-Agent'] || '';
    if (/bot|crawler|spider/i.test(userAgent)) {
      return null;
    }

    return event;
  },

  beforeBreadcrumb(breadcrumb, hint) {
    // Don't log console.log breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },
});
```

**File: `agentic-crm-template/sentry.server.config.ts`**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",

  tracesSampleRate: 0.1,

  // Server-specific config
  debug: false,

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  beforeSend(event) {
    // Don't send in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

**File: `agentic-crm-template/sentry.edge.config.ts`**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "production",
  tracesSampleRate: 0.1,
});
```

### Step 3: Manual Error Capturing (Frontend)

**File: `agentic-crm-template/lib/monitoring/sentry.ts`**

```typescript
import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}
```

**Usage Example:**

```typescript
import { captureException, addBreadcrumb, startTransaction } from '@/lib/monitoring/sentry';

async function createCampaign(data: CampaignData) {
  const transaction = startTransaction('create-campaign', 'http');

  try {
    addBreadcrumb('Creating campaign', 'campaign', 'info', { data });

    const response = await fetch('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create campaign');

    return await response.json();
  } catch (error) {
    captureException(error as Error, {
      campaignData: data,
      action: 'create-campaign',
    });
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### Step 4: Backend Sentry Integration

**Install Dependencies:**
```bash
cd market-ai
pip install sentry-sdk[fastapi]
```

**File: `market-ai/config/sentry.py`**

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.asyncpg import AsyncPGIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os

def init_sentry():
    """Initialize Sentry for error tracking"""
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        environment=os.getenv("NODE_ENV", "production"),

        # Performance monitoring
        traces_sample_rate=0.1,

        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            AsyncPGIntegration(),
            RedisIntegration(),
            LoggingIntegration(
                level=None,  # Capture all levels
                event_level=None,  # Don't send logs as events
            ),
        ],

        # Send PII (Personally Identifiable Information)
        send_default_pii=False,

        # Before send hook
        before_send=before_send_hook,

        # Before breadcrumb hook
        before_breadcrumb=before_breadcrumb_hook,
    )

def before_send_hook(event, hint):
    """Filter events before sending to Sentry"""
    # Don't send in development
    if os.getenv("NODE_ENV") == "development":
        return None

    # Filter out specific errors
    if "exception" in event:
        exc_type = event["exception"]["values"][0]["type"]
        if exc_type in ["KeyboardInterrupt", "SystemExit"]:
            return None

    return event

def before_breadcrumb_hook(crumb, hint):
    """Filter breadcrumbs before adding"""
    # Don't log SQL queries with sensitive data
    if crumb.get("category") == "query":
        if "password" in crumb.get("message", "").lower():
            return None

    return crumb

# Manual error capturing
from sentry_sdk import capture_exception, capture_message, set_user, add_breadcrumb

def log_error(error: Exception, context: dict = None):
    """Capture an exception with context"""
    capture_exception(error, extras=context or {})

def log_message(message: str, level: str = "info", context: dict = None):
    """Capture a message with context"""
    capture_message(message, level=level, extras=context or {})
```

**File: `market-ai/main.py`** (add Sentry init)

```python
from fastapi import FastAPI, Request
from config.sentry import init_sentry
import os

# Initialize Sentry
if os.getenv("NODE_ENV") == "production":
    init_sentry()

app = FastAPI()

# Sentry will automatically capture uncaught exceptions
# Manual capturing example:
from sentry_sdk import capture_exception

@app.post("/campaigns")
async def create_campaign(campaign: dict, request: Request):
    try:
        # Campaign creation logic
        result = await create_campaign_in_db(campaign)
        return result
    except Exception as e:
        # Capture error with context
        capture_exception(e)
        raise
```

## PostHog Analytics

### Step 1: PostHog Setup

**Create PostHog Project:**
1. Sign up at https://posthog.com (or self-host)
2. Create new project
3. Copy Project API Key
4. Copy Host URL

### Step 2: Frontend PostHog Integration

**Install Dependencies:**
```bash
npm install posthog-js
```

**File: `agentic-crm-template/lib/analytics/posthog.ts`**

```typescript
import posthog from 'posthog-js';

// Initialize PostHog
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug(); // Enable debug mode in development
      }
    },
    capture_pageview: false, // Disable automatic pageview capture (we'll do it manually)
    capture_pageleave: true,
    autocapture: true, // Automatically capture clicks
    session_recording: {
      recordCrossOriginIframes: false,
      maskAllInputs: true, // Mask sensitive inputs
      maskTextSelector: '.sensitive', // Mask elements with this class
    },
  });
}

export { posthog };

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}

/**
 * Reset user (on logout)
 */
export function resetUser() {
  posthog.reset();
}

/**
 * Track event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  posthog.capture(eventName, properties);
}

/**
 * Track page view
 */
export function trackPageView(path?: string) {
  posthog.capture('$pageview', {
    $current_url: path || window.location.href,
  });
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  posthog.people.set(properties);
}

/**
 * Create feature flag check
 */
export function isFeatureEnabled(flagKey: string): boolean {
  return posthog.isFeatureEnabled(flagKey);
}
```

**File: `agentic-crm-template/components/analytics/PostHogProvider.tsx`**

```typescript
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { posthog, identifyUser, trackPageView } from '@/lib/analytics/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();

  // Track page views
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      trackPageView(url);
    }
  }, [pathname, searchParams]);

  // Identify user
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt,
      });
    }
  }, [user]);

  return <>{children}</>;
}
```

**Add to root layout:**

```typescript
// app/layout.tsx
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PostHogProvider>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
```

### Step 3: Custom Event Tracking

**File: `agentic-crm-template/lib/analytics/events.ts`**

```typescript
import { trackEvent } from './posthog';

export const AnalyticsEvents = {
  // Campaign events
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_UPDATED: 'campaign_updated',
  CAMPAIGN_DELETED: 'campaign_deleted',
  CAMPAIGN_PUBLISHED: 'campaign_published',

  // Content events
  CONTENT_GENERATED: 'content_generated',
  CONTENT_EDITED: 'content_edited',
  CONTENT_APPROVED: 'content_approved',

  // Lead events
  LEAD_CREATED: 'lead_created',
  LEAD_CONVERTED: 'lead_converted',
  LEAD_EXPORTED: 'lead_exported',

  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_UPGRADED: 'user_upgraded',

  // Feature usage
  FEATURE_USED: 'feature_used',
  AI_GENERATED: 'ai_generated',
  REPORT_GENERATED: 'report_generated',
} as const;

/**
 * Track campaign event
 */
export function trackCampaignEvent(
  action: 'created' | 'updated' | 'deleted' | 'published',
  campaignId: string,
  properties?: Record<string, any>
) {
  trackEvent(`campaign_${action}`, {
    campaign_id: campaignId,
    ...properties,
  });
}

/**
 * Track AI generation
 */
export function trackAIGeneration(
  type: 'content' | 'email' | 'report',
  properties?: Record<string, any>
) {
  trackEvent(AnalyticsEvents.AI_GENERATED, {
    generation_type: type,
    ...properties,
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(featureName: string, properties?: Record<string, any>) {
  trackEvent(AnalyticsEvents.FEATURE_USED, {
    feature_name: featureName,
    ...properties,
  });
}
```

**Usage Example:**

```typescript
import { trackCampaignEvent, trackAIGeneration } from '@/lib/analytics/events';

async function handleCreateCampaign(data: CampaignData) {
  const campaign = await createCampaign(data);

  // Track the event
  trackCampaignEvent('created', campaign.id, {
    campaign_type: data.type,
    budget: data.budget,
  });

  return campaign;
}

async function generateContent(prompt: string) {
  const content = await aiGenerateContent(prompt);

  // Track AI usage
  trackAIGeneration('content', {
    prompt_length: prompt.length,
    content_length: content.length,
    model: 'gpt-4o-mini',
  });

  return content;
}
```

## Performance Monitoring

### Step 1: Core Web Vitals Tracking

**File: `agentic-crm-template/lib/monitoring/performance.ts`**

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { trackEvent } from '@/lib/analytics/posthog';

/**
 * Report Core Web Vitals to PostHog
 */
export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onFID(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (err) {
    console.error('Error tracking web vitals:', err);
  }
}

function sendToAnalytics(metric: Metric) {
  // Send to PostHog
  trackEvent('web-vital', {
    metric_name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`${metric.name}:`, metric.value, metric.rating);
  }
}

/**
 * Measure custom performance metrics
 */
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  const start = performance.now();

  const finish = () => {
    const duration = performance.now() - start;

    trackEvent('performance-measurement', {
      measurement_name: name,
      duration,
    });

    console.log(`${name}: ${duration.toFixed(2)}ms`);
  };

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(finish);
  } else {
    finish();
    return result;
  }
}
```

**Add to app:**

```typescript
// app/layout.tsx
import { reportWebVitals } from '@/lib/monitoring/performance';

export default function RootLayout({ children }) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return <html><body>{children}</body></html>;
}
```

### Step 2: API Performance Tracking

**File: `market-ai/middleware/performance.py`**

```python
from fastapi import Request
from time import time
from loguru import logger
import sentry_sdk

async def track_request_performance(request: Request, call_next):
    """Middleware to track API request performance"""
    start_time = time()

    # Add request ID
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

    # Process request
    response = await call_next(request)

    # Calculate duration
    duration = (time() - start_time) * 1000  # ms

    # Log performance
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.2f}ms",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration,
        }
    )

    # Track in Sentry
    with sentry_sdk.start_transaction(
        op="http.server",
        name=f"{request.method} {request.url.path}",
    ) as transaction:
        transaction.set_measurement("http.response_time", duration, "millisecond")

    # Add header to response
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time"] = f"{duration:.2f}ms"

    return response

# Add to main.py
from middleware.performance import track_request_performance
app.middleware("http")(track_request_performance)
```

## Log Aggregation

### Step 1: Structured Logging (Backend)

**File: `market-ai/config/logging.py`**

```python
from loguru import logger
import sys
import json
import os

# Remove default handler
logger.remove()

# JSON formatter for production
def serialize(record):
    """Serialize log record to JSON"""
    subset = {
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "logger": record["name"],
        "function": record["function"],
        "line": record["line"],
        "message": record["message"],
    }

    # Add extra fields
    if record["extra"]:
        subset["extra"] = record["extra"]

    return json.dumps(subset)

# Console output
if os.getenv("NODE_ENV") == "production":
    # JSON format for log aggregation
    logger.add(
        sys.stdout,
        format=serialize,
        level=os.getenv("LOG_LEVEL", "INFO"),
    )
else:
    # Human-readable format for development
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
        level="DEBUG",
        colorize=True,
    )

# File output (if disk mounted)
if os.path.exists("/app/logs"):
    logger.add(
        "/app/logs/api_{time}.log",
        rotation="500 MB",
        retention="10 days",
        level="DEBUG",
        format=serialize,
    )

# Export configured logger
__all__ = ["logger"]
```

### Step 2: Log Context

**File: `market-ai/utils/logging_context.py`**

```python
from contextvars import ContextVar
from typing import Dict, Any

# Context variables for request tracking
request_context: ContextVar[Dict[str, Any]] = ContextVar('request_context', default={})

def set_request_context(user_id: str = None, request_id: str = None):
    """Set context for current request"""
    context = {}
    if user_id:
        context['user_id'] = user_id
    if request_id:
        context['request_id'] = request_id

    request_context.set(context)

def get_request_context() -> Dict[str, Any]:
    """Get context for current request"""
    return request_context.get()

def log_with_context(logger, message: str, **kwargs):
    """Log message with request context"""
    context = get_request_context()
    logger.bind(**context).info(message, **kwargs)
```

## Uptime Monitoring

### Third-Party Services

**UptimeRobot (Free):**
1. Sign up at https://uptimerobot.com
2. Create HTTP(S) monitor
3. URL: `https://your-api.onrender.com/health`
4. Interval: 5 minutes
5. Alert contacts: Email, Slack, SMS

**Pingdom:**
1. Sign up at https://pingdom.com
2. Create uptime check
3. Configure alerts

### Custom Health Checks

**File: `market-ai/scripts/health_check.sh`**

```bash
#!/bin/bash

# Configuration
API_URL="https://your-api.onrender.com"
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK"
MAX_RESPONSE_TIME=2000  # ms

# Check health endpoint
start=$(date +%s%N)
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health)
end=$(date +%s%N)

# Calculate response time
response_time=$(( ($end - $start) / 1000000 ))

# Check status
if [ $response -ne 200 ]; then
  # Send alert
  curl -X POST ${SLACK_WEBHOOK} \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"🚨 API is DOWN!\",
      \"attachments\": [{
        \"color\": \"danger\",
        \"fields\": [
          {\"title\": \"Status\", \"value\": \"${response}\", \"short\": true},
          {\"title\": \"URL\", \"value\": \"${API_URL}\", \"short\": false}
        ]
      }]
    }"

  exit 1
fi

# Check response time
if [ $response_time -gt $MAX_RESPONSE_TIME ]; then
  curl -X POST ${SLACK_WEBHOOK} \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"⚠️ API is SLOW!\",
      \"attachments\": [{
        \"color\": \"warning\",
        \"fields\": [
          {\"title\": \"Response Time\", \"value\": \"${response_time}ms\", \"short\": true},
          {\"title\": \"Threshold\", \"value\": \"${MAX_RESPONSE_TIME}ms\", \"short\": true}
        ]
      }]
    }"
fi

echo "✅ Health check passed (${response_time}ms)"
```

## Alert Configuration

### Sentry Alerts

**In Sentry Dashboard:**
1. Project Settings → Alerts
2. Create alert rule:
   - Condition: Error count > 10 in 1 hour
   - Action: Send to Slack / Email
3. Create performance alert:
   - Condition: p95 response time > 2s
   - Action: Notify team

### PostHog Alerts

**In PostHog Dashboard:**
1. Insights → Create Insight
2. Set metric (e.g., error rate)
3. Click "Set alert"
4. Configure threshold and notifications

## Dashboard & Reports

### Sentry Performance Dashboard

**Metrics to track:**
- Error rate
- Response time (p50, p95, p99)
- User impact (users affected)
- Error types distribution
- Transaction volume

### PostHog Analytics Dashboard

**Key metrics:**
- Daily active users (DAU)
- Weekly active users (WAU)
- Feature adoption rates
- Funnel conversion rates
- User retention
- Session duration

### Custom Monitoring Dashboard

**File: `agentic-crm-template/app/admin/monitoring/page.tsx`**

```typescript
export default function MonitoringDashboard() {
  return (
    <div className="space-y-6">
      <h1>System Monitoring</h1>

      <div className="grid grid-cols-4 gap-4">
        {/* Error Rate */}
        <MetricCard
          title="Error Rate"
          value="0.1%"
          change={-0.05}
          icon={AlertCircle}
        />

        {/* Response Time */}
        <MetricCard
          title="Avg Response Time"
          value="245ms"
          change={-12}
          icon={Zap}
        />

        {/* Uptime */}
        <MetricCard
          title="Uptime"
          value="99.9%"
          change={0}
          icon={CheckCircle}
        />

        {/* Active Users */}
        <MetricCard
          title="Active Users"
          value="1,234"
          change={156}
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <ResponseTimeChart />
        <ErrorRateChart />
      </div>
    </div>
  );
}
```

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors**
   - Check DSN is correct
   - Verify environment is production
   - Check beforeSend filter

2. **PostHog events not showing**
   - Check API key
   - Verify posthog.init() called
   - Check browser console for errors

3. **High error rates in Sentry**
   - Review error types
   - Add filters for known issues
   - Fix underlying bugs

## Best Practices

1. **Set up alerts early** - Know about issues before users
2. **Monitor Core Web Vitals** - Performance impacts SEO
3. **Track user journeys** - Understand drop-off points
4. **Use structured logging** - Easier to search and analyze
5. **Set error budgets** - Define acceptable error rates
6. **Create dashboards** - Visualize key metrics
7. **Test monitoring** - Trigger test errors
8. **Document incidents** - Learn from failures
9. **Review regularly** - Weekly/monthly metric reviews
10. **Optimize alerting** - Avoid alert fatigue

## Next Steps

1. **Implement Testing (Document 34)** - Automated test suite
2. **Set up Incident Response** - Runbooks for common issues
3. **Create SLA Dashboard** - Track service level objectives
4. **Implement Tracing** - Distributed tracing with Sentry
5. **Add Business Metrics** - Revenue, conversions, etc.

---

**Monitoring Checklist:**
- [ ] Sentry configured (frontend + backend)
- [ ] PostHog integrated
- [ ] Custom events tracked
- [ ] Core Web Vitals monitored
- [ ] Performance tracking implemented
- [ ] Structured logging configured
- [ ] Uptime monitoring enabled
- [ ] Alerts configured
- [ ] Dashboard created
- [ ] Error budgets defined
- [ ] Incident response plan documented
- [ ] Team trained on monitoring tools
