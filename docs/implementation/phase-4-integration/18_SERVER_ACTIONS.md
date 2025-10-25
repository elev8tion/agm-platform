# 18. Server Actions & Agent Integration

## Overview

Server Actions provide the bridge between the Next.js 16 frontend and FastAPI backend, handling agent operations, content management, and campaign workflows. This implementation uses Next.js 16's enhanced Server Actions with `updateTag()` and `refresh()` for granular cache control and immediate UI updates.

**Key Responsibilities:**
- Trigger agent operations (SEO research, writing, email creation)
- Manage content assets (CRUD operations)
- Handle campaign workflows
- Invalidate caches with surgical precision
- Provide type-safe server/client boundary
- Handle optimistic updates

## Prerequisites

**Phase Dependencies:**
- Phase 1: Database schema and types
- Phase 2: UI components ready to consume actions
- Phase 3: State management configured
- FastAPI backend running and accessible

**Next.js 16 Requirements:**
```json
{
  "next": "^16.0.0",
  "react": "^19.0.0",
  "zod": "^3.23.0"
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Components                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Form Submit  │  │ Button Click │  │ Menu Action  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Server Actions ("use server")               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. Validate input (Zod schemas)                 │   │
│  │ 2. Call API client                              │   │
│  │ 3. Handle errors                                │   │
│  │ 4. Invalidate cache (updateTag/refresh)         │   │
│  │ 5. Return typed result                          │   │
│  └─────────────────────────────────────────────────┘   │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    API Client Layer                      │
│         (lib/api/client.ts - see doc 19)                │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                        │
│  /api/agents/seo/research | /api/content | /api/jobs    │
└─────────────────────────────────────────────────────────┘
```

## Next.js 16 Features

### updateTag() - Surgical Cache Invalidation
```typescript
import { updateTag } from 'next/cache'

// Expire specific cache tag and immediately refresh
updateTag('content-assets') // Invalidates all content asset queries
updateTag('content-asset-123') // Invalidates single asset
```

### refresh() - Immediate Router Refresh
```typescript
import { refresh } from 'next/cache'

// Refresh current route's cache
refresh() // Forces re-render with latest data
```

### "use server" Directive
```typescript
'use server' // Must be at top of file for Server Actions

export async function myAction() {
  // Runs on server only
}
```

### Type-Safe Server/Client Boundary
```typescript
// Input/output types are serializable
type ServerActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

## Complete Implementation

### app/actions/agents.ts

**Agent Trigger Actions - Long-running operations**

```typescript
'use server'

import { refresh } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { handleActionError } from '@/lib/errors/handlers'
import type { Job, AgentType } from '@/lib/types/database'

// ============================================================================
// Input Schemas
// ============================================================================

const SEOResearchSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters').max(200),
  depth: z.enum(['basic', 'comprehensive']).default('comprehensive'),
  includeCompetitors: z.boolean().default(true),
})

const SEOWriteSchema = z.object({
  brief: z.string().min(50, 'Brief must be at least 50 characters'),
  targetWordCount: z.number().min(500).max(5000).default(1500),
  tone: z.enum(['professional', 'casual', 'technical']).default('professional'),
  keywords: z.array(z.string()).optional(),
})

const SEOOptimizeSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  focusAreas: z.array(z.enum(['readability', 'keywords', 'structure', 'links'])).optional(),
})

const EmailCreateSchema = z.object({
  brief: z.string().min(20),
  subject: z.string().min(5).max(100),
  tone: z.enum(['friendly', 'professional', 'urgent']).default('professional'),
  goal: z.enum(['nurture', 'conversion', 'announcement']),
})

const EmailSeriesSchema = z.object({
  brief: z.string().min(50),
  emailCount: z.number().min(2).max(10).default(5),
  cadence: z.enum(['daily', 'weekly', 'biweekly']).default('weekly'),
  goal: z.enum(['onboarding', 'nurture', 'conversion']),
})

const CMOAnalyzeSchema = z.object({
  dataSource: z.enum(['ga4', 'gsc', 'cms', 'all']).default('all'),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  focusMetrics: z.array(z.string()).optional(),
})

// ============================================================================
// Result Types
// ============================================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

// ============================================================================
// SEO Agent Actions
// ============================================================================

export async function triggerSEOResearch(
  input: z.infer<typeof SEOResearchSchema>
): Promise<ActionResult<Job>> {
  try {
    // Validate input
    const validated = SEOResearchSchema.parse(input)

    // Create background job via API
    const job = await api.post<Job>('/api/agents/seo/research', {
      topic: validated.topic,
      depth: validated.depth,
      include_competitors: validated.includeCompetitors,
    })

    // Refresh UI to show new job
    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to start SEO research')
  }
}

export async function triggerSEOWrite(
  input: z.infer<typeof SEOWriteSchema>
): Promise<ActionResult<Job>> {
  try {
    const validated = SEOWriteSchema.parse(input)

    const job = await api.post<Job>('/api/agents/seo/write', {
      brief: validated.brief,
      target_word_count: validated.targetWordCount,
      tone: validated.tone,
      keywords: validated.keywords,
    })

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to start article writing')
  }
}

export async function triggerSEOOptimize(
  input: z.infer<typeof SEOOptimizeSchema>
): Promise<ActionResult<Job>> {
  try {
    const validated = SEOOptimizeSchema.parse(input)

    const job = await api.post<Job>('/api/agents/seo/optimize', {
      url: validated.url,
      focus_areas: validated.focusAreas,
    })

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to start content optimization')
  }
}

// ============================================================================
// Email Agent Actions
// ============================================================================

export async function triggerEmailCreate(
  input: z.infer<typeof EmailCreateSchema>
): Promise<ActionResult<Job>> {
  try {
    const validated = EmailCreateSchema.parse(input)

    const job = await api.post<Job>('/api/agents/email/create', {
      brief: validated.brief,
      subject: validated.subject,
      tone: validated.tone,
      goal: validated.goal,
    })

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to create email')
  }
}

export async function triggerEmailSeries(
  input: z.infer<typeof EmailSeriesSchema>
): Promise<ActionResult<Job>> {
  try {
    const validated = EmailSeriesSchema.parse(input)

    const job = await api.post<Job>('/api/agents/email/series', {
      brief: validated.brief,
      email_count: validated.emailCount,
      cadence: validated.cadence,
      goal: validated.goal,
    })

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to create email series')
  }
}

// ============================================================================
// CMO Agent Actions
// ============================================================================

export async function triggerCMOAnalyze(
  input: z.infer<typeof CMOAnalyzeSchema>
): Promise<ActionResult<Job>> {
  try {
    const validated = CMOAnalyzeSchema.parse(input)

    const job = await api.post<Job>('/api/agents/cmo/analyze', {
      data_source: validated.dataSource,
      date_range: validated.dateRange,
      focus_metrics: validated.focusMetrics,
    })

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to start CMO analysis')
  }
}

// ============================================================================
// Job Management Actions
// ============================================================================

export async function cancelJob(jobId: string): Promise<ActionResult<void>> {
  try {
    await api.post(`/api/jobs/${jobId}/cancel`, {})

    // Invalidate job caches
    const { updateTag } = await import('next/cache')
    updateTag(`job-${jobId}`)
    updateTag('jobs')

    refresh()

    return { success: true, data: undefined }
  } catch (error) {
    return handleActionError(error, 'Failed to cancel job')
  }
}

export async function retryJob(jobId: string): Promise<ActionResult<Job>> {
  try {
    const job = await api.post<Job>(`/api/jobs/${jobId}/retry`, {})

    const { updateTag } = await import('next/cache')
    updateTag(`job-${jobId}`)
    updateTag('jobs')

    refresh()

    return { success: true, data: job }
  } catch (error) {
    return handleActionError(error, 'Failed to retry job')
  }
}
```

### app/actions/content.ts

**Content Asset CRUD - Short synchronous operations**

```typescript
'use server'

import { updateTag } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { handleActionError } from '@/lib/errors/handlers'
import type { ContentAsset, ContentStatus } from '@/lib/types/database'

// ============================================================================
// Input Schemas
// ============================================================================

const CreateContentSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(100),
  type: z.enum(['blog_post', 'email', 'social_post', 'landing_page']),
  status: z.enum(['draft', 'review', 'published']).default('draft'),
  metadata: z.record(z.unknown()).optional(),
  campaignId: z.string().uuid().optional(),
})

const UpdateContentSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(100).optional(),
  status: z.enum(['draft', 'review', 'published']).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const PublishContentSchema = z.object({
  publishedUrl: z.string().url().optional(),
  scheduledFor: z.string().datetime().optional(),
})

// ============================================================================
// Result Types
// ============================================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

// ============================================================================
// Content CRUD Actions
// ============================================================================

export async function createContentAsset(
  input: z.infer<typeof CreateContentSchema>
): Promise<ActionResult<ContentAsset>> {
  try {
    const validated = CreateContentSchema.parse(input)

    const asset = await api.post<ContentAsset>('/api/content', {
      title: validated.title,
      content: validated.content,
      type: validated.type,
      status: validated.status,
      metadata: validated.metadata,
      campaign_id: validated.campaignId,
    })

    // Invalidate content list cache
    updateTag('content-assets')
    if (validated.campaignId) {
      updateTag(`campaign-${validated.campaignId}`)
    }

    return { success: true, data: asset }
  } catch (error) {
    return handleActionError(error, 'Failed to create content')
  }
}

export async function updateContentAsset(
  id: string,
  input: z.infer<typeof UpdateContentSchema>
): Promise<ActionResult<ContentAsset>> {
  try {
    const validated = UpdateContentSchema.parse(input)

    const asset = await api.patch<ContentAsset>(`/api/content/${id}`, {
      title: validated.title,
      content: validated.content,
      status: validated.status,
      metadata: validated.metadata,
    })

    // Invalidate specific asset and list
    updateTag(`content-asset-${id}`)
    updateTag('content-assets')

    return { success: true, data: asset }
  } catch (error) {
    return handleActionError(error, 'Failed to update content')
  }
}

export async function deleteContentAsset(
  id: string
): Promise<ActionResult<void>> {
  try {
    await api.delete(`/api/content/${id}`)

    // Invalidate caches
    updateTag(`content-asset-${id}`)
    updateTag('content-assets')

    return { success: true, data: undefined }
  } catch (error) {
    return handleActionError(error, 'Failed to delete content')
  }
}

export async function publishContentAsset(
  id: string,
  input: z.infer<typeof PublishContentSchema>
): Promise<ActionResult<ContentAsset>> {
  try {
    const validated = PublishContentSchema.parse(input)

    const asset = await api.post<ContentAsset>(`/api/content/${id}/publish`, {
      published_url: validated.publishedUrl,
      scheduled_for: validated.scheduledFor,
    })

    // Read-your-writes: invalidate immediately
    updateTag(`content-asset-${id}`)
    updateTag('content-assets')

    return { success: true, data: asset }
  } catch (error) {
    return handleActionError(error, 'Failed to publish content')
  }
}

export async function duplicateContentAsset(
  id: string
): Promise<ActionResult<ContentAsset>> {
  try {
    const asset = await api.post<ContentAsset>(`/api/content/${id}/duplicate`, {})

    updateTag('content-assets')

    return { success: true, data: asset }
  } catch (error) {
    return handleActionError(error, 'Failed to duplicate content')
  }
}

// ============================================================================
// Batch Operations
// ============================================================================

export async function bulkUpdateStatus(
  ids: string[],
  status: ContentStatus
): Promise<ActionResult<{ updated: number }>> {
  try {
    const result = await api.post<{ updated: number }>('/api/content/bulk/status', {
      ids,
      status,
    })

    // Invalidate all affected assets
    ids.forEach(id => updateTag(`content-asset-${id}`))
    updateTag('content-assets')

    return { success: true, data: result }
  } catch (error) {
    return handleActionError(error, 'Failed to bulk update status')
  }
}

export async function bulkDelete(
  ids: string[]
): Promise<ActionResult<{ deleted: number }>> {
  try {
    const result = await api.post<{ deleted: number }>('/api/content/bulk/delete', {
      ids,
    })

    // Invalidate all affected assets
    ids.forEach(id => updateTag(`content-asset-${id}`))
    updateTag('content-assets')

    return { success: true, data: result }
  } catch (error) {
    return handleActionError(error, 'Failed to bulk delete')
  }
}
```

### app/actions/campaigns.ts

**Campaign Workflow Management**

```typescript
'use server'

import { updateTag } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api/client'
import { handleActionError } from '@/lib/errors/handlers'
import type { Campaign, CampaignStatus } from '@/lib/types/database'

// ============================================================================
// Input Schemas
// ============================================================================

const CreateCampaignSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  budget: z.number().positive().optional(),
  goals: z.array(z.object({
    metric: z.string(),
    target: z.number(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
})

const UpdateCampaignSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  goals: z.array(z.object({
    metric: z.string(),
    target: z.number(),
  })).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// ============================================================================
// Result Types
// ============================================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

// ============================================================================
// Campaign CRUD Actions
// ============================================================================

export async function createCampaign(
  input: z.infer<typeof CreateCampaignSchema>
): Promise<ActionResult<Campaign>> {
  try {
    const validated = CreateCampaignSchema.parse(input)

    const campaign = await api.post<Campaign>('/api/campaigns', {
      name: validated.name,
      description: validated.description,
      start_date: validated.startDate,
      end_date: validated.endDate,
      budget: validated.budget,
      goals: validated.goals,
      metadata: validated.metadata,
    })

    updateTag('campaigns')

    return { success: true, data: campaign }
  } catch (error) {
    return handleActionError(error, 'Failed to create campaign')
  }
}

export async function updateCampaign(
  id: string,
  input: z.infer<typeof UpdateCampaignSchema>
): Promise<ActionResult<Campaign>> {
  try {
    const validated = UpdateCampaignSchema.parse(input)

    const campaign = await api.patch<Campaign>(`/api/campaigns/${id}`, {
      name: validated.name,
      description: validated.description,
      start_date: validated.startDate,
      end_date: validated.endDate,
      budget: validated.budget,
      goals: validated.goals,
      metadata: validated.metadata,
    })

    updateTag(`campaign-${id}`)
    updateTag('campaigns')

    return { success: true, data: campaign }
  } catch (error) {
    return handleActionError(error, 'Failed to update campaign')
  }
}

export async function deleteCampaign(
  id: string
): Promise<ActionResult<void>> {
  try {
    await api.delete(`/api/campaigns/${id}`)

    updateTag(`campaign-${id}`)
    updateTag('campaigns')

    return { success: true, data: undefined }
  } catch (error) {
    return handleActionError(error, 'Failed to delete campaign')
  }
}

// ============================================================================
// Campaign Status Actions
// ============================================================================

export async function pauseCampaign(
  id: string
): Promise<ActionResult<Campaign>> {
  try {
    const campaign = await api.post<Campaign>(`/api/campaigns/${id}/pause`, {})

    updateTag(`campaign-${id}`)
    updateTag('campaigns')

    return { success: true, data: campaign }
  } catch (error) {
    return handleActionError(error, 'Failed to pause campaign')
  }
}

export async function resumeCampaign(
  id: string
): Promise<ActionResult<Campaign>> {
  try {
    const campaign = await api.post<Campaign>(`/api/campaigns/${id}/resume`, {})

    updateTag(`campaign-${id}`)
    updateTag('campaigns')

    return { success: true, data: campaign }
  } catch (error) {
    return handleActionError(error, 'Failed to resume campaign')
  }
}

export async function completeCampaign(
  id: string
): Promise<ActionResult<Campaign>> {
  try {
    const campaign = await api.post<Campaign>(`/api/campaigns/${id}/complete`, {})

    updateTag(`campaign-${id}`)
    updateTag('campaigns')

    return { success: true, data: campaign }
  } catch (error) {
    return handleActionError(error, 'Failed to complete campaign')
  }
}

// ============================================================================
// Campaign Analytics Actions
// ============================================================================

export async function refreshCampaignMetrics(
  id: string
): Promise<ActionResult<{ refreshed: boolean }>> {
  try {
    const result = await api.post<{ refreshed: boolean }>(
      `/api/campaigns/${id}/refresh-metrics`,
      {}
    )

    // Invalidate campaign metrics cache
    updateTag(`campaign-${id}-metrics`)
    updateTag(`campaign-${id}`)

    return { success: true, data: result }
  } catch (error) {
    return handleActionError(error, 'Failed to refresh campaign metrics')
  }
}
```

## Type Safety

### Server Action Type Pattern

```typescript
// Pattern: Discriminated union for success/failure
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

// Usage in component
const result = await createCampaign(data)
if (result.success) {
  // TypeScript knows result.data exists
  toast.success(`Created campaign: ${result.data.name}`)
} else {
  // TypeScript knows result.error exists
  toast.error(result.error)
}
```

### Input Validation Type Inference

```typescript
// Define schema
const MySchema = z.object({
  name: z.string(),
  count: z.number(),
})

// Infer TypeScript type from Zod schema
type MyInput = z.infer<typeof MySchema>
// Equivalent to: { name: string; count: number }

// Use in function signature
export async function myAction(
  input: MyInput
): Promise<ActionResult<MyResult>> {
  const validated = MySchema.parse(input) // Runtime validation
  // ...
}
```

## Error Handling

### Validation Errors

```typescript
try {
  const validated = MySchema.parse(input)
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      details: error.format(), // Field-level errors
    }
  }
}
```

### API Errors

```typescript
try {
  const result = await api.post('/endpoint', data)
} catch (error) {
  // See lib/errors/handlers.ts for full implementation
  return handleActionError(error, 'Operation failed')
}
```

### Cache Errors

```typescript
try {
  updateTag('my-tag')
} catch (error) {
  // Cache invalidation failures are logged but don't fail the action
  console.error('Cache invalidation failed:', error)
  // Continue and return success
}
```

## Testing

### Unit Tests (Vitest)

```typescript
// app/actions/__tests__/agents.test.ts
import { describe, it, expect, vi } from 'vitest'
import { triggerSEOResearch } from '../agents'
import * as apiClient from '@/lib/api/client'

vi.mock('@/lib/api/client')
vi.mock('next/cache', () => ({
  refresh: vi.fn(),
  updateTag: vi.fn(),
}))

describe('triggerSEOResearch', () => {
  it('should create SEO research job successfully', async () => {
    const mockJob = {
      id: 'job-123',
      agent_type: 'seo',
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    vi.mocked(apiClient.api.post).mockResolvedValue(mockJob)

    const result = await triggerSEOResearch({
      topic: 'AI Marketing',
      depth: 'comprehensive',
      includeCompetitors: true,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('job-123')
    }
  })

  it('should handle validation errors', async () => {
    const result = await triggerSEOResearch({
      topic: 'AI', // Too short
      depth: 'comprehensive',
      includeCompetitors: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('at least 3 characters')
    }
  })
})
```

### Integration Tests

```typescript
// app/actions/__tests__/content.integration.test.ts
import { describe, it, expect } from 'vitest'
import { createContentAsset, updateContentAsset } from '../content'

describe('Content Asset Integration', () => {
  it('should create and update content asset', async () => {
    // Create
    const createResult = await createContentAsset({
      title: 'Test Article',
      content: 'This is test content that is long enough to pass validation.',
      type: 'blog_post',
      status: 'draft',
    })

    expect(createResult.success).toBe(true)
    if (!createResult.success) return

    const assetId = createResult.data.id

    // Update
    const updateResult = await updateContentAsset(assetId, {
      status: 'published',
    })

    expect(updateResult.success).toBe(true)
    if (!updateResult.success) return

    expect(updateResult.data.status).toBe('published')
  })
})
```

## Performance

### Optimistic Updates Pattern

```typescript
// Component usage with useOptimistic
'use client'

import { useOptimistic } from 'react'
import { updateContentAsset } from '@/app/actions/content'

export function ContentEditor({ asset }: { asset: ContentAsset }) {
  const [optimisticAsset, updateOptimistic] = useOptimistic(
    asset,
    (current, updates: Partial<ContentAsset>) => ({
      ...current,
      ...updates,
    })
  )

  async function handleSave(updates: Partial<ContentAsset>) {
    // Update UI immediately
    updateOptimistic(updates)

    // Persist to server
    const result = await updateContentAsset(asset.id, updates)

    if (!result.success) {
      // Revert optimistic update on error
      updateOptimistic(asset)
      toast.error(result.error)
    }
  }

  return (
    <div>
      <h1>{optimisticAsset.title}</h1>
      {/* Editor UI */}
    </div>
  )
}
```

### Batch Cache Invalidation

```typescript
// Instead of multiple updateTag calls
export async function bulkPublish(ids: string[]) {
  await api.post('/api/content/bulk/publish', { ids })

  // Efficient: Single batch invalidation
  updateTag('content-assets')

  // Avoid: Individual invalidations in loop
  // ids.forEach(id => updateTag(`content-asset-${id}`))
}
```

### Parallel API Calls

```typescript
export async function createCampaignWithContent(
  campaignData: CreateCampaignInput,
  contentData: CreateContentInput[]
) {
  // Create campaign first
  const campaign = await api.post('/api/campaigns', campaignData)

  // Create content in parallel
  const contentPromises = contentData.map(data =>
    api.post('/api/content', {
      ...data,
      campaign_id: campaign.id,
    })
  )

  const content = await Promise.all(contentPromises)

  updateTag('campaigns')
  updateTag('content-assets')

  return { campaign, content }
}
```

## Troubleshooting

### Issue: Server Actions Not Found

**Symptom:** `Error: Server Action not found`

**Solution:**
```typescript
// Ensure "use server" is at TOP of file
'use server' // Must be first line

import { ... } // Imports after

export async function myAction() { ... }
```

### Issue: Cache Not Invalidating

**Symptom:** UI shows stale data after mutation

**Solution:**
```typescript
// Check cache tags match fetch tags
// In Server Action:
updateTag('content-assets')

// In data fetching:
export async function getContentAssets() {
  const res = await fetch('/api/content', {
    next: { tags: ['content-assets'] } // Must match!
  })
}
```

### Issue: Type Errors at Client/Server Boundary

**Symptom:** Type errors when calling Server Actions

**Solution:**
```typescript
// Ensure all types are serializable (no functions, class instances)
type SerializableType = {
  id: string
  name: string
  date: string // Not Date object!
  count: number
}

// Convert Date objects to strings
const input = {
  date: new Date().toISOString() // ✅ Serializable
  // NOT: date: new Date() // ❌ Not serializable
}
```

### Issue: Validation Errors Not Showing

**Symptom:** Form shows generic error instead of field errors

**Solution:**
```typescript
// Return structured validation errors
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: 'Validation failed',
    details: error.flatten().fieldErrors, // Field-level errors
  }
}

// In component:
if (!result.success && result.details) {
  const fieldErrors = result.details as Record<string, string[]>
  Object.entries(fieldErrors).forEach(([field, errors]) => {
    form.setError(field, { message: errors[0] })
  })
}
```

## Next Steps

**Phase 5 Integration:**
- Wire Server Actions to UI components (Phase 2)
- Implement form components with React Hook Form (doc 22)
- Add error boundaries for graceful failures (doc 21)
- Set up API client with error handling (doc 19)
- Configure cache tags and revalidation (doc 20)

**Action Items:**
1. Create all three action files (`agents.ts`, `content.ts`, `campaigns.ts`)
2. Implement error handling utilities (doc 21)
3. Set up API client (doc 19)
4. Configure cache tags (doc 20)
5. Build form components (doc 22)
6. Write integration tests
7. Test optimistic updates
8. Monitor cache performance

**Dependencies:**
- Next: Document 19 (API Client)
- Next: Document 20 (Cache Management)
- Next: Document 21 (Error Handling)
- Next: Document 22 (Form Handling)
