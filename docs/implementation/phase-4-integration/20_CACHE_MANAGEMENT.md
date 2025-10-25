# 20. Cache Management & Revalidation

## Overview

Cache management in Next.js 16 uses surgical cache invalidation with `updateTag()`, granular cache lifetimes with `cacheLife()`, and strategic tagging with `cacheTag()`. This implementation ensures data freshness while minimizing API calls and maximizing performance.

**Key Responsibilities:**
- Define cache tag strategy for all data types
- Configure cache lifetimes for different content
- Implement revalidation patterns (on-demand and time-based)
- Use `updateTag()` for surgical cache invalidation
- Use `refresh()` for immediate UI updates
- Provide cache debugging utilities

## Prerequisites

**Phase Dependencies:**
- Phase 1: Database schema and types
- Server Actions with cache invalidation (doc 18)
- API client configured (doc 19)

**Next.js 16 Requirements:**
```json
{
  "next": "^16.0.0"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Data Fetching Layer                    │
│  fetch('/api/content', {                                │
│    next: {                                              │
│      tags: ['content-assets'],                          │
│      revalidate: 3600                                   │
│    }                                                     │
│  })                                                      │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js Cache                         │
│  Tagged with: ['content-assets', 'content-asset-123']   │
│  Lifetime: 1 hour                                       │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼ (mutation occurs)
┌─────────────────────────────────────────────────────────┐
│                  Server Action                           │
│  updateTag('content-asset-123')                         │
│  → Invalidates specific asset cache                     │
│  updateTag('content-assets')                            │
│  → Invalidates list cache                               │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                  Cache Invalidated                       │
│  Next request will fetch fresh data from API            │
└─────────────────────────────────────────────────────────┘
```

## Next.js 16 Features

### updateTag() - Surgical Invalidation

```typescript
import { updateTag } from 'next/cache'

// Expire specific tag and immediately refresh
updateTag('content-assets')
// All queries tagged with 'content-assets' are now stale
```

### cacheTag() - Tag Caching

```typescript
import { cacheTag } from 'next/cache'

export async function getCampaign(id: string) {
  'use cache'
  cacheTag(`campaign-${id}`)

  // Data fetching
}
```

### cacheLife() - Cache Lifetime Profiles

```typescript
import { cacheLife } from 'next/cache'

export async function getBlogPosts() {
  'use cache'
  cacheLife('max') // Long-lived content

  // Data fetching
}
```

### refresh() - Router Refresh

```typescript
import { refresh } from 'next/cache'

export async function publishArticle(id: string) {
  'use server'

  await api.publish(id)
  updateTag(`content-asset-${id}`)

  refresh() // Immediate UI update
}
```

## Complete Implementation

### lib/cache/tags.ts

**Cache Tag Definitions and Utilities**

```typescript
// ============================================================================
// Cache Tag Constants
// ============================================================================

export const CacheTags = {
  // Content tags
  CONTENT_ASSETS: 'content-assets',
  CONTENT_ASSET: (id: string) => `content-asset-${id}`,
  CONTENT_BY_TYPE: (type: string) => `content-type-${type}`,
  CONTENT_BY_STATUS: (status: string) => `content-status-${status}`,
  CONTENT_BY_CAMPAIGN: (campaignId: string) => `content-campaign-${campaignId}`,

  // Campaign tags
  CAMPAIGNS: 'campaigns',
  CAMPAIGN: (id: string) => `campaign-${id}`,
  CAMPAIGN_METRICS: (id: string) => `campaign-${id}-metrics`,
  CAMPAIGN_BY_STATUS: (status: string) => `campaign-status-${status}`,

  // Job tags
  JOBS: 'jobs',
  JOB: (id: string) => `job-${id}`,
  JOB_BY_AGENT: (agentType: string) => `job-agent-${agentType}`,
  JOB_BY_STATUS: (status: string) => `job-status-${status}`,

  // Budget tags
  BUDGET: 'budget',
  BUDGET_CURRENT: 'budget-current',
  BUDGET_HISTORY: 'budget-history',
  BUDGET_LIMITS: 'budget-limits',

  // Analytics tags
  ANALYTICS: 'analytics',
  ANALYTICS_OVERVIEW: 'analytics-overview',
  ANALYTICS_CONTENT: 'analytics-content',
  ANALYTICS_CAMPAIGNS: 'analytics-campaigns',

  // Agent tags
  AGENTS: 'agents',
  AGENT_STATUS: (type: string) => `agent-${type}-status`,
} as const

// ============================================================================
// Cache Tag Helpers
// ============================================================================

/**
 * Get all tags associated with a content asset
 */
export function getContentAssetTags(asset: {
  id: string
  type: string
  status: string
  campaign_id?: string | null
}): string[] {
  const tags = [
    CacheTags.CONTENT_ASSETS,
    CacheTags.CONTENT_ASSET(asset.id),
    CacheTags.CONTENT_BY_TYPE(asset.type),
    CacheTags.CONTENT_BY_STATUS(asset.status),
  ]

  if (asset.campaign_id) {
    tags.push(CacheTags.CONTENT_BY_CAMPAIGN(asset.campaign_id))
    tags.push(CacheTags.CAMPAIGN(asset.campaign_id))
  }

  return tags
}

/**
 * Get all tags associated with a campaign
 */
export function getCampaignTags(campaign: {
  id: string
  status: string
}): string[] {
  return [
    CacheTags.CAMPAIGNS,
    CacheTags.CAMPAIGN(campaign.id),
    CacheTags.CAMPAIGN_METRICS(campaign.id),
    CacheTags.CAMPAIGN_BY_STATUS(campaign.status),
  ]
}

/**
 * Get all tags associated with a job
 */
export function getJobTags(job: {
  id: string
  agent_type: string
  status: string
}): string[] {
  return [
    CacheTags.JOBS,
    CacheTags.JOB(job.id),
    CacheTags.JOB_BY_AGENT(job.agent_type),
    CacheTags.JOB_BY_STATUS(job.status),
    CacheTags.AGENT_STATUS(job.agent_type),
  ]
}

// ============================================================================
// Invalidation Utilities
// ============================================================================

/**
 * Invalidate all content-related caches
 */
export async function invalidateContentCaches(): Promise<void> {
  const { updateTag } = await import('next/cache')
  updateTag(CacheTags.CONTENT_ASSETS)
  updateTag(CacheTags.ANALYTICS_CONTENT)
}

/**
 * Invalidate specific content asset
 */
export async function invalidateContentAsset(
  id: string,
  asset?: {
    type: string
    status: string
    campaign_id?: string | null
  }
): Promise<void> {
  const { updateTag } = await import('next/cache')

  updateTag(CacheTags.CONTENT_ASSET(id))
  updateTag(CacheTags.CONTENT_ASSETS)

  if (asset) {
    updateTag(CacheTags.CONTENT_BY_TYPE(asset.type))
    updateTag(CacheTags.CONTENT_BY_STATUS(asset.status))

    if (asset.campaign_id) {
      updateTag(CacheTags.CONTENT_BY_CAMPAIGN(asset.campaign_id))
      updateTag(CacheTags.CAMPAIGN(asset.campaign_id))
    }
  }

  updateTag(CacheTags.ANALYTICS_CONTENT)
}

/**
 * Invalidate all campaign-related caches
 */
export async function invalidateCampaignCaches(): Promise<void> {
  const { updateTag } = await import('next/cache')
  updateTag(CacheTags.CAMPAIGNS)
  updateTag(CacheTags.ANALYTICS_CAMPAIGNS)
}

/**
 * Invalidate specific campaign
 */
export async function invalidateCampaign(
  id: string,
  campaign?: { status: string }
): Promise<void> {
  const { updateTag } = await import('next/cache')

  updateTag(CacheTags.CAMPAIGN(id))
  updateTag(CacheTags.CAMPAIGN_METRICS(id))
  updateTag(CacheTags.CAMPAIGNS)

  if (campaign) {
    updateTag(CacheTags.CAMPAIGN_BY_STATUS(campaign.status))
  }

  updateTag(CacheTags.ANALYTICS_CAMPAIGNS)
}

/**
 * Invalidate all job-related caches
 */
export async function invalidateJobCaches(): Promise<void> {
  const { updateTag } = await import('next/cache')
  updateTag(CacheTags.JOBS)
}

/**
 * Invalidate specific job
 */
export async function invalidateJob(
  id: string,
  job?: {
    agent_type: string
    status: string
  }
): Promise<void> {
  const { updateTag } = await import('next/cache')

  updateTag(CacheTags.JOB(id))
  updateTag(CacheTags.JOBS)

  if (job) {
    updateTag(CacheTags.JOB_BY_AGENT(job.agent_type))
    updateTag(CacheTags.JOB_BY_STATUS(job.status))
    updateTag(CacheTags.AGENT_STATUS(job.agent_type))
  }
}

/**
 * Invalidate all budget-related caches
 */
export async function invalidateBudgetCaches(): Promise<void> {
  const { updateTag } = await import('next/cache')
  updateTag(CacheTags.BUDGET)
  updateTag(CacheTags.BUDGET_CURRENT)
  updateTag(CacheTags.BUDGET_HISTORY)
  updateTag(CacheTags.BUDGET_LIMITS)
}

/**
 * Invalidate all analytics caches
 */
export async function invalidateAnalyticsCaches(): Promise<void> {
  const { updateTag } = await import('next/cache')
  updateTag(CacheTags.ANALYTICS)
  updateTag(CacheTags.ANALYTICS_OVERVIEW)
  updateTag(CacheTags.ANALYTICS_CONTENT)
  updateTag(CacheTags.ANALYTICS_CAMPAIGNS)
}

/**
 * Invalidate all caches (nuclear option - use sparingly)
 */
export async function invalidateAllCaches(): Promise<void> {
  await Promise.all([
    invalidateContentCaches(),
    invalidateCampaignCaches(),
    invalidateJobCaches(),
    invalidateBudgetCaches(),
    invalidateAnalyticsCaches(),
  ])
}
```

### lib/cache/lifetimes.ts

**Cache Lifetime Profiles**

```typescript
// ============================================================================
// Cache Lifetime Constants
// ============================================================================

/**
 * Cache lifetime profiles for different data types
 */
export const CacheLifetimes = {
  // Real-time data (5 seconds)
  REALTIME: 5,

  // Frequently updated data (30 seconds)
  FREQUENT: 30,

  // Normal data (5 minutes)
  NORMAL: 300,

  // Stable data (1 hour)
  STABLE: 3600,

  // Long-lived data (1 day)
  LONG: 86400,

  // Permanent data (1 week)
  PERMANENT: 604800,
} as const

/**
 * Cache lifetime profiles for specific resources
 */
export const ResourceCacheLifetimes = {
  // Job status (real-time - 5s)
  JOB_STATUS: CacheLifetimes.REALTIME,

  // Job list (frequent - 30s)
  JOB_LIST: CacheLifetimes.FREQUENT,

  // Budget current (frequent - 30s)
  BUDGET_CURRENT: CacheLifetimes.FREQUENT,

  // Content assets list (normal - 5min)
  CONTENT_LIST: CacheLifetimes.NORMAL,

  // Single content asset (normal - 5min)
  CONTENT_ASSET: CacheLifetimes.NORMAL,

  // Campaign list (normal - 5min)
  CAMPAIGN_LIST: CacheLifetimes.NORMAL,

  // Single campaign (stable - 1h)
  CAMPAIGN: CacheLifetimes.STABLE,

  // Campaign metrics (frequent - 30s)
  CAMPAIGN_METRICS: CacheLifetimes.FREQUENT,

  // Published content (long - 1 day)
  PUBLISHED_CONTENT: CacheLifetimes.LONG,

  // Budget history (stable - 1h)
  BUDGET_HISTORY: CacheLifetimes.STABLE,

  // Analytics overview (normal - 5min)
  ANALYTICS_OVERVIEW: CacheLifetimes.NORMAL,

  // Analytics deep dive (stable - 1h)
  ANALYTICS_DETAILS: CacheLifetimes.STABLE,
} as const

// ============================================================================
// Cache Profile Helpers
// ============================================================================

/**
 * Get cache lifetime for content based on status
 */
export function getContentCacheLifetime(status: string): number {
  switch (status) {
    case 'published':
      return ResourceCacheLifetimes.PUBLISHED_CONTENT
    case 'draft':
    case 'review':
      return ResourceCacheLifetimes.CONTENT_ASSET
    default:
      return ResourceCacheLifetimes.NORMAL
  }
}

/**
 * Get cache lifetime for job based on status
 */
export function getJobCacheLifetime(status: string): number {
  switch (status) {
    case 'pending':
    case 'running':
      return ResourceCacheLifetimes.JOB_STATUS // Real-time
    case 'completed':
    case 'failed':
    case 'cancelled':
      return ResourceCacheLifetimes.STABLE // Stable
    default:
      return ResourceCacheLifetimes.NORMAL
  }
}

/**
 * Get cache lifetime for campaign based on status
 */
export function getCampaignCacheLifetime(status: string): number {
  switch (status) {
    case 'active':
      return ResourceCacheLifetimes.CAMPAIGN_METRICS // Frequent
    case 'scheduled':
    case 'paused':
      return ResourceCacheLifetimes.CAMPAIGN // Stable
    case 'completed':
      return ResourceCacheLifetimes.LONG // Long-lived
    default:
      return ResourceCacheLifetimes.NORMAL
  }
}
```

### lib/cache/revalidate.ts

**Revalidation Utilities**

```typescript
import { revalidatePath, revalidateTag } from 'next/cache'

// ============================================================================
// Path Revalidation
// ============================================================================

/**
 * Revalidate all content pages
 */
export async function revalidateContentPages(): Promise<void> {
  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/content/[id]')
}

/**
 * Revalidate specific content page
 */
export async function revalidateContentPage(id: string): Promise<void> {
  revalidatePath(`/dashboard/content/${id}`)
  revalidatePath('/dashboard/content')
}

/**
 * Revalidate all campaign pages
 */
export async function revalidateCampaignPages(): Promise<void> {
  revalidatePath('/dashboard/campaigns')
  revalidatePath('/dashboard/campaigns/[id]')
}

/**
 * Revalidate specific campaign page
 */
export async function revalidateCampaignPage(id: string): Promise<void> {
  revalidatePath(`/dashboard/campaigns/${id}`)
  revalidatePath('/dashboard/campaigns')
}

/**
 * Revalidate all job pages
 */
export async function revalidateJobPages(): Promise<void> {
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard/jobs/[id]')
}

/**
 * Revalidate analytics pages
 */
export async function revalidateAnalyticsPages(): Promise<void> {
  revalidatePath('/dashboard/analytics')
}

// ============================================================================
// Combined Revalidation
// ============================================================================

/**
 * Revalidate everything related to content asset
 */
export async function revalidateContentAssetComplete(
  id: string,
  asset?: {
    type: string
    status: string
    campaign_id?: string | null
  }
): Promise<void> {
  // Import cache utilities
  const { invalidateContentAsset } = await import('./tags')

  // Invalidate cache tags
  await invalidateContentAsset(id, asset)

  // Revalidate pages
  await revalidateContentPage(id)

  // If part of campaign, revalidate campaign too
  if (asset?.campaign_id) {
    await revalidateCampaignPage(asset.campaign_id)
  }
}

/**
 * Revalidate everything related to campaign
 */
export async function revalidateCampaignComplete(
  id: string,
  campaign?: { status: string }
): Promise<void> {
  const { invalidateCampaign } = await import('./tags')

  await invalidateCampaign(id, campaign)
  await revalidateCampaignPage(id)
  await revalidateAnalyticsPages()
}

/**
 * Revalidate everything related to job
 */
export async function revalidateJobComplete(
  id: string,
  job?: {
    agent_type: string
    status: string
  }
): Promise<void> {
  const { invalidateJob } = await import('./tags')

  await invalidateJob(id, job)
  await revalidateJobPages()
}
```

### lib/cache/config.ts

**Cache Configuration Helpers**

```typescript
import { CacheTags } from './tags'
import { ResourceCacheLifetimes } from './lifetimes'

// ============================================================================
// Fetch Configuration Builders
// ============================================================================

/**
 * Build fetch config for content assets list
 */
export function contentListCacheConfig(options?: {
  type?: string
  status?: string
  campaignId?: string
}) {
  const tags = [CacheTags.CONTENT_ASSETS]

  if (options?.type) {
    tags.push(CacheTags.CONTENT_BY_TYPE(options.type))
  }

  if (options?.status) {
    tags.push(CacheTags.CONTENT_BY_STATUS(options.status))
  }

  if (options?.campaignId) {
    tags.push(CacheTags.CONTENT_BY_CAMPAIGN(options.campaignId))
  }

  return {
    next: {
      tags,
      revalidate: ResourceCacheLifetimes.CONTENT_LIST,
    },
  }
}

/**
 * Build fetch config for single content asset
 */
export function contentAssetCacheConfig(id: string, status?: string) {
  return {
    next: {
      tags: [
        CacheTags.CONTENT_ASSET(id),
        CacheTags.CONTENT_ASSETS,
      ],
      revalidate: status
        ? require('./lifetimes').getContentCacheLifetime(status)
        : ResourceCacheLifetimes.CONTENT_ASSET,
    },
  }
}

/**
 * Build fetch config for campaigns list
 */
export function campaignListCacheConfig(options?: {
  status?: string
}) {
  const tags = [CacheTags.CAMPAIGNS]

  if (options?.status) {
    tags.push(CacheTags.CAMPAIGN_BY_STATUS(options.status))
  }

  return {
    next: {
      tags,
      revalidate: ResourceCacheLifetimes.CAMPAIGN_LIST,
    },
  }
}

/**
 * Build fetch config for single campaign
 */
export function campaignCacheConfig(id: string, status?: string) {
  return {
    next: {
      tags: [
        CacheTags.CAMPAIGN(id),
        CacheTags.CAMPAIGNS,
      ],
      revalidate: status
        ? require('./lifetimes').getCampaignCacheLifetime(status)
        : ResourceCacheLifetimes.CAMPAIGN,
    },
  }
}

/**
 * Build fetch config for jobs list
 */
export function jobListCacheConfig(options?: {
  agentType?: string
  status?: string
}) {
  const tags = [CacheTags.JOBS]

  if (options?.agentType) {
    tags.push(CacheTags.JOB_BY_AGENT(options.agentType))
  }

  if (options?.status) {
    tags.push(CacheTags.JOB_BY_STATUS(options.status))
  }

  return {
    next: {
      tags,
      revalidate: ResourceCacheLifetimes.JOB_LIST,
    },
  }
}

/**
 * Build fetch config for single job
 */
export function jobCacheConfig(id: string, status?: string) {
  return {
    next: {
      tags: [
        CacheTags.JOB(id),
        CacheTags.JOBS,
      ],
      revalidate: status
        ? require('./lifetimes').getJobCacheLifetime(status)
        : ResourceCacheLifetimes.JOB_STATUS,
    },
  }
}

/**
 * Build fetch config for budget
 */
export function budgetCacheConfig() {
  return {
    next: {
      tags: [
        CacheTags.BUDGET_CURRENT,
        CacheTags.BUDGET,
      ],
      revalidate: ResourceCacheLifetimes.BUDGET_CURRENT,
    },
  }
}

/**
 * Build fetch config for analytics
 */
export function analyticsCacheConfig(type: 'overview' | 'content' | 'campaigns') {
  const tags = [CacheTags.ANALYTICS]

  switch (type) {
    case 'overview':
      tags.push(CacheTags.ANALYTICS_OVERVIEW)
      break
    case 'content':
      tags.push(CacheTags.ANALYTICS_CONTENT)
      break
    case 'campaigns':
      tags.push(CacheTags.ANALYTICS_CAMPAIGNS)
      break
  }

  return {
    next: {
      tags,
      revalidate: ResourceCacheLifetimes.ANALYTICS_OVERVIEW,
    },
  }
}
```

## Type Safety

### Typed Cache Tags

```typescript
// Type-safe cache tag creation
type CacheTagBuilder = {
  [K in keyof typeof CacheTags]: typeof CacheTags[K]
}

const tags: CacheTagBuilder = CacheTags
// All tag builders are typed
```

### Type-Safe Invalidation

```typescript
import { invalidateContentAsset } from '@/lib/cache/tags'
import type { ContentAsset } from '@/lib/types/database'

async function updateAsset(asset: ContentAsset) {
  // Compiler ensures asset has required properties
  await invalidateContentAsset(asset.id, {
    type: asset.type,
    status: asset.status,
    campaign_id: asset.campaign_id,
  })
}
```

## Error Handling

### Graceful Cache Failures

```typescript
async function safeInvalidateCache(tag: string): Promise<void> {
  try {
    const { updateTag } = await import('next/cache')
    updateTag(tag)
  } catch (error) {
    // Log but don't throw - cache failures shouldn't break app
    console.error('Cache invalidation failed:', error)
  }
}
```

## Testing

### Mock Cache Functions

```typescript
// lib/cache/__tests__/tags.test.ts
import { describe, it, expect, vi } from 'vitest'
import { invalidateContentAsset } from '../tags'

vi.mock('next/cache', () => ({
  updateTag: vi.fn(),
}))

describe('invalidateContentAsset', () => {
  it('should invalidate correct tags', async () => {
    const { updateTag } = await import('next/cache')

    await invalidateContentAsset('asset-123', {
      type: 'blog_post',
      status: 'published',
      campaign_id: 'campaign-456',
    })

    expect(updateTag).toHaveBeenCalledWith('content-asset-asset-123')
    expect(updateTag).toHaveBeenCalledWith('content-assets')
    expect(updateTag).toHaveBeenCalledWith('content-type-blog_post')
    expect(updateTag).toHaveBeenCalledWith('content-status-published')
    expect(updateTag).toHaveBeenCalledWith('content-campaign-campaign-456')
  })
})
```

## Performance

### Cache Hit Rate Monitoring

```typescript
// lib/cache/monitor.ts
let cacheHits = 0
let cacheMisses = 0

export function recordCacheHit() {
  cacheHits++
}

export function recordCacheMiss() {
  cacheMisses++
}

export function getCacheHitRate(): number {
  const total = cacheHits + cacheMisses
  return total > 0 ? cacheHits / total : 0
}

export function resetCacheMetrics() {
  cacheHits = 0
  cacheMisses = 0
}
```

## Troubleshooting

### Issue: Cache Not Invalidating

**Symptom:** Updated data not showing after mutation

**Solution:**
```typescript
// Check tags match between fetch and invalidation
// ❌ Wrong:
fetch('/api/content', { next: { tags: ['content'] } })
updateTag('content-assets') // Different tag!

// ✅ Correct:
fetch('/api/content', { next: { tags: ['content-assets'] } })
updateTag('content-assets') // Matching tag
```

### Issue: Over-Invalidation

**Symptom:** Too many API calls, poor performance

**Solution:**
```typescript
// Be specific with invalidation
// ❌ Too broad:
updateTag('content-assets') // Invalidates everything

// ✅ Specific:
updateTag(`content-asset-${id}`) // Only this asset
```

### Issue: Under-Invalidation

**Symptom:** Stale data persists

**Solution:**
```typescript
// Invalidate all related tags
await invalidateContentAsset(id, asset) // Uses helper that invalidates all related tags
```

## Next Steps

**Phase 5 Integration:**
- Use cache configs in data fetching
- Integrate invalidation in Server Actions
- Monitor cache performance
- Optimize cache lifetimes based on usage

**Action Items:**
1. Create all cache management files
2. Define cache tags for all resources
3. Configure cache lifetimes
4. Implement invalidation in Server Actions
5. Add cache monitoring
6. Write tests
7. Document cache strategy

**Dependencies:**
- Previous: Document 18 (Server Actions use invalidation)
- Previous: Document 19 (API Client)
- Next: Document 21 (Error Handling)
- Next: Document 22 (Form Handling)
