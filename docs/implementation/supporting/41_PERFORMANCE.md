# Performance Optimization Guide

## Overview

This document defines performance optimization strategies for the Agentic Marketing Dashboard. It covers Core Web Vitals, code splitting, asset optimization, caching, and monitoring to ensure fast, responsive user experiences.

## Guiding Principles

1. **Measure First**: Use real metrics before optimizing
2. **User-Centric**: Optimize for perceived performance
3. **Progressive Enhancement**: Fast baseline, enhance progressively
4. **Code Splitting**: Load only what's needed
5. **Cache Aggressively**: Minimize redundant requests
6. **Optimize Assets**: Images, fonts, bundles
7. **Monitor Continuously**: Track performance over time

## Core Web Vitals Targets

### Performance Metrics

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **Largest Contentful Paint (LCP)** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **First Input Delay (FID)** | ≤ 100ms | 100ms - 300ms | > 300ms |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **First Contentful Paint (FCP)** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **Time to Interactive (TTI)** | ≤ 3.8s | 3.8s - 7.3s | > 7.3s |
| **Total Blocking Time (TBT)** | ≤ 200ms | 200ms - 600ms | > 600ms |

### Optimization Goals

```typescript
// Target performance budgets
const PERFORMANCE_BUDGETS = {
  // Bundle sizes
  mainBundle: 170 * 1024, // 170KB (gzipped)
  vendorBundle: 200 * 1024, // 200KB (gzipped)
  cssBundle: 50 * 1024, // 50KB (gzipped)

  // Page load metrics
  lcp: 2500, // 2.5s
  fid: 100, // 100ms
  cls: 0.1, // 0.1
  fcp: 1800, // 1.8s
  tti: 3800, // 3.8s

  // Asset sizes
  maxImageSize: 200 * 1024, // 200KB
  maxFontSize: 100 * 1024, // 100KB per font file
}
```

## Code Splitting Strategy

### Route-Based Code Splitting (Automatic)

```typescript
// Next.js automatically code-splits by route
// Each page is a separate bundle
app/
├── (dashboard)/
│   ├── agents/page.tsx           // agents.chunk.js
│   ├── campaigns/page.tsx        // campaigns.chunk.js
│   ├── content/page.tsx          // content.chunk.js
│   └── jobs/page.tsx             // jobs.chunk.js
```

### Component-Based Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

// Lazy load chart component
const AnalyticsChart = dynamic(
  () => import('@/components/analytics/AnalyticsChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Don't render on server
  }
)

// Lazy load modal
const AgentConfigModal = dynamic(
  () => import('@/components/agents/AgentConfigModal'),
  {
    loading: () => <Spinner />,
  }
)

export function Dashboard() {
  const [showModal, setShowModal] = useState(false)

  return (
    <div>
      <AnalyticsChart data={data} />
      {showModal && <AgentConfigModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
```

### Library Code Splitting

```typescript
// Split large libraries
const marked = dynamic(() => import('marked').then((mod) => mod.marked), {
  ssr: false,
})

const Prism = dynamic(() => import('prismjs'), {
  ssr: false,
})

// Use only when needed
export function ContentEditor() {
  const [content, setContent] = useState('')

  const handleFormat = async () => {
    const marked = await import('marked').then((mod) => mod.marked)
    const html = marked(content)
    return html
  }

  return <textarea onChange={(e) => setContent(e.target.value)} />
}
```

## Image Optimization

### Next.js Image Component

```typescript
// app/(dashboard)/campaigns/page.tsx
import Image from 'next/image'

export function CampaignCard({ campaign }) {
  return (
    <div className="relative">
      <Image
        src={campaign.imageUrl}
        alt={campaign.name}
        width={800}
        height={400}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={false} // Only for above-fold images
        quality={85} // 85 is a good balance
        placeholder="blur"
        blurDataURL={campaign.blurDataUrl}
      />
    </div>
  )
}
```

### Image Formats

```typescript
// Prefer modern formats
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
}
```

### Responsive Images

```typescript
// Use srcset for responsive images
<Image
  src="/campaign-hero.jpg"
  alt="Campaign"
  width={1200}
  height={600}
  sizes="(max-width: 640px) 640px,
         (max-width: 768px) 768px,
         (max-width: 1024px) 1024px,
         1200px"
/>

// Or use fill for container-based sizing
<div className="relative h-64 w-full">
  <Image
    src="/campaign-hero.jpg"
    alt="Campaign"
    fill
    className="object-cover"
    sizes="100vw"
  />
</div>
```

### Image Loading Strategies

```typescript
// Priority for above-fold images
<Image src="/hero.jpg" priority />

// Lazy load for below-fold images
<Image src="/footer.jpg" loading="lazy" />

// Eager load for critical images
<Image src="/logo.jpg" loading="eager" />
```

## Font Optimization

### Next.js Font Loading

```typescript
// app/layout.tsx
import { Inter, JetBrains_Mono } from 'next/font/google'

// Load variable font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevent FOIT
  preload: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  preload: false, // Only preload critical fonts
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Font Subsetting

```typescript
// Load only required characters
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'], // Only weights you use
  display: 'swap',
})

// For custom fonts
// next.config.js
module.exports = {
  experimental: {
    optimizeFonts: true,
  },
}
```

## Bundle Size Optimization

### Webpack Bundle Analyzer

```bash
# Install
npm install --save-dev @next/bundle-analyzer

# Configure
# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // Next.js config
})

# Run analysis
ANALYZE=true npm run build
```

### Tree Shaking

```typescript
// ✅ Good - Import only what you need
import { format } from 'date-fns'
import { debounce } from 'lodash-es'

// ❌ Bad - Imports entire library
import _ from 'lodash'
import * as dateFns from 'date-fns'
```

### External Dependencies

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizePackageImports: ['@/components/ui', 'date-fns', 'lodash-es'],
  },
}
```

## Server vs Client Component Decisions

### When to Use Server Components

```typescript
// ✅ Server Component - Default choice
async function AgentList() {
  const agents = await fetchAgents()
  return (
    <div>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  )
}

// Benefits:
// - No JavaScript sent to client
// - Direct database access
// - Server-side rendering
// - Better initial load
```

### When to Use Client Components

```typescript
// ✅ Client Component - Interactive UI
'use client'

function AgentForm() {
  const [formData, setFormData] = useState({})

  return (
    <form onSubmit={handleSubmit}>
      {/* Interactive form */}
    </form>
  )
}

// Use client components for:
// - Event handlers (onClick, onChange)
// - Browser APIs (localStorage, window)
// - State (useState, useReducer)
// - Effects (useEffect)
// - Custom hooks
```

### Hybrid Approach

```typescript
// Server Component wrapper
async function AgentPage() {
  const agents = await fetchAgents()

  return (
    <div>
      <StaticContent /> {/* Server Component */}
      <InteractiveList agents={agents} /> {/* Client Component */}
    </div>
  )
}

// Client Component for interactivity only
'use client'
function InteractiveList({ agents }) {
  const [filter, setFilter] = useState('')
  const filtered = agents.filter((a) => a.name.includes(filter))

  return (
    <>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} />
      {filtered.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </>
  )
}
```

## Lazy Loading Patterns

### Intersection Observer

```typescript
// hooks/useIntersectionObserver.ts
import { useEffect, useRef, useState } from 'react'

export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [options])

  return { ref, isIntersecting }
}

// Usage
function LazyContent() {
  const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.1 })

  return (
    <div ref={ref}>
      {isIntersecting ? <HeavyComponent /> : <Placeholder />}
    </div>
  )
}
```

### Infinite Scroll

```typescript
// components/content/InfiniteContentList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

export function InfiniteContentList({ initialContent }) {
  const [content, setContent] = useState(initialContent)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { ref, isIntersecting } = useIntersectionObserver()

  useEffect(() => {
    if (isIntersecting && hasMore) {
      fetchMoreContent(page + 1).then((newContent) => {
        if (newContent.length === 0) {
          setHasMore(false)
        } else {
          setContent((prev) => [...prev, ...newContent])
          setPage((p) => p + 1)
        }
      })
    }
  }, [isIntersecting, hasMore, page])

  return (
    <div>
      {content.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
      {hasMore && <div ref={ref}>Loading...</div>}
    </div>
  )
}
```

## Memoization Strategies

### React.memo

```typescript
// Memoize expensive components
import { memo } from 'react'

interface AgentCardProps {
  agent: Agent
  onEdit: (id: string) => void
}

export const AgentCard = memo(function AgentCard({ agent, onEdit }: AgentCardProps) {
  return (
    <div>
      <h3>{agent.name}</h3>
      <button onClick={() => onEdit(agent.id)}>Edit</button>
    </div>
  )
})

// Custom comparison
export const AgentCard = memo(
  AgentCard,
  (prevProps, nextProps) => prevProps.agent.id === nextProps.agent.id
)
```

### useMemo

```typescript
// Memoize expensive calculations
import { useMemo } from 'react'

function AnalyticsDashboard({ campaigns }) {
  const metrics = useMemo(() => {
    // Expensive calculation
    return campaigns.reduce((acc, campaign) => {
      acc.totalSpend += campaign.spend
      acc.totalRevenue += campaign.revenue
      return acc
    }, { totalSpend: 0, totalRevenue: 0 })
  }, [campaigns])

  return <MetricsDisplay metrics={metrics} />
}
```

### useCallback

```typescript
// Memoize callback functions
import { useCallback } from 'react'

function AgentList({ agents }) {
  const handleEdit = useCallback((id: string) => {
    // Edit logic
  }, [])

  const handleDelete = useCallback((id: string) => {
    // Delete logic
  }, [])

  return (
    <div>
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
```

## Database Query Optimization

### Efficient Queries

```python
# backend/services/agent_service.py
from sqlalchemy import select
from sqlalchemy.orm import joinedload

async def get_agent_with_runs(agent_id: str):
    # ✅ Good - Eager load relationships
    query = (
        select(Agent)
        .where(Agent.id == agent_id)
        .options(joinedload(Agent.runs))
    )
    result = await db.execute(query)
    return result.scalar_one()

    # ❌ Bad - N+1 query problem
    agent = await db.get(Agent, agent_id)
    runs = await db.execute(select(AgentRun).where(AgentRun.agent_id == agent_id))
```

### Pagination

```python
# backend/api/routes/content.py
from fastapi import Query

@router.get("/content")
async def list_content(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * page_size
    query = select(ContentAsset).offset(offset).limit(page_size)
    result = await db.execute(query)
    return result.scalars().all()
```

### Indexing

```python
# backend/models/content.py
from sqlalchemy import Index

class ContentAsset(Base):
    __tablename__ = "content_assets"

    id = Column(String, primary_key=True)
    title = Column(String, index=True)  # Index for search
    status = Column(String, index=True)  # Index for filtering
    created_at = Column(DateTime, index=True)  # Index for sorting

    __table_args__ = (
        Index('idx_status_created', 'status', 'created_at'),  # Composite index
    )
```

## API Response Caching

### HTTP Caching Headers

```typescript
// app/api/agents/route.ts
export async function GET() {
  const agents = await fetchAgents()

  return Response.json(agents, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
```

### Redis Caching

```python
# backend/services/cache_service.py
import json
from redis import Redis

redis = Redis(host='localhost', port=6379, decode_responses=True)

async def get_cached_agents():
    # Try cache first
    cached = redis.get('agents:all')
    if cached:
        return json.loads(cached)

    # Fetch from database
    agents = await fetch_agents_from_db()

    # Cache for 5 minutes
    redis.setex('agents:all', 300, json.dumps(agents))

    return agents
```

## WebSocket Optimization

### Debouncing Updates

```typescript
// hooks/useWebSocket.ts
import { useRef } from 'react'

export function useWebSocket({ onMessage }) {
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const handleMessage = (data) => {
    // Debounce updates to avoid excessive re-renders
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onMessage(data)
    }, 100)
  }

  // ... WebSocket setup
}
```

### Batching Updates

```typescript
// Batch multiple updates into single render
const [jobs, setJobs] = useState<Job[]>([])
const batchRef = useRef<Job[]>([])

useWebSocket({
  onMessage: (update) => {
    batchRef.current.push(update.job)

    // Flush batch every 500ms
    setTimeout(() => {
      if (batchRef.current.length > 0) {
        setJobs((prev) => {
          const updated = [...prev]
          batchRef.current.forEach((job) => {
            const index = updated.findIndex((j) => j.id === job.id)
            if (index !== -1) {
              updated[index] = job
            }
          })
          batchRef.current = []
          return updated
        })
      }
    }, 500)
  },
})
```

## Performance Monitoring

### Web Vitals

```typescript
// app/layout.tsx
import { sendToAnalytics } from '@/lib/analytics'

export function reportWebVitals(metric) {
  sendToAnalytics({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    label: metric.label,
  })
}
```

### Custom Performance Marks

```typescript
// Mark performance milestones
performance.mark('data-fetch-start')
const data = await fetchData()
performance.mark('data-fetch-end')

performance.measure('data-fetch', 'data-fetch-start', 'data-fetch-end')

const measure = performance.getEntriesByName('data-fetch')[0]
console.log(`Data fetch took ${measure.duration}ms`)
```

## Best Practices

### Do's

1. Measure before optimizing
2. Use Server Components by default
3. Code-split heavy components
4. Optimize images with next/image
5. Implement lazy loading
6. Cache API responses
7. Use React.memo for expensive components
8. Monitor Core Web Vitals
9. Minimize client JavaScript
10. Use efficient database queries

### Don'ts

1. Don't optimize prematurely
2. Don't send unnecessary JavaScript
3. Don't ignore bundle size
4. Don't skip image optimization
5. Don't forget to cache
6. Don't over-memoize
7. Don't ignore N+1 queries
8. Don't skip performance monitoring
9. Don't use blocking scripts
10. Don't ignore Core Web Vitals

## Performance Checklist

- [ ] Bundle size under budget
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Images optimized (WebP/AVIF)
- [ ] Fonts optimized (variable fonts, subsetting)
- [ ] Code splitting implemented
- [ ] Lazy loading for below-fold content
- [ ] API responses cached
- [ ] Database queries optimized
- [ ] Server Components used by default
- [ ] Performance monitoring configured
- [ ] Lighthouse score > 90

## References

- [Web Vitals](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
