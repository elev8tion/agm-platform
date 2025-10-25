# File Structure and Organization

## Overview

This document defines the complete file structure, naming conventions, and code organization principles for the Agentic Marketing Dashboard project. It ensures consistency across the codebase and makes navigation intuitive for all developers.

## Guiding Principles

1. **Folder-by-Feature**: Group related files by business domain (agents, campaigns, content, jobs)
2. **Colocation**: Keep related code close together (components, hooks, types)
3. **Clear Boundaries**: Separate frontend and backend with distinct structures
4. **Scalability**: Structure supports growth without major refactoring
5. **Discoverability**: Intuitive naming makes files easy to find
6. **Convention over Configuration**: Follow Next.js 16 App Router conventions

## Complete File Tree

### Frontend Structure (Next.js 16 App Router)

```
agentic-marketing-dashboard/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── sign-up/
│   │   │   │   ├── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── agents/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── runs/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── campaigns/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── jobs/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── agents/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── actions/
│   │   │   ├── agents.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── content.ts
│   │   │   ├── jobs.ts
│   │   │   └── auth.ts
│   │   ├── api/
│   │   │   ├── agents/
│   │   │   │   └── route.ts
│   │   │   ├── campaigns/
│   │   │   │   └── route.ts
│   │   │   ├── content/
│   │   │   │   └── route.ts
│   │   │   ├── jobs/
│   │   │   │   └── route.ts
│   │   │   └── webhooks/
│   │   │       ├── openai/
│   │   │       │   └── route.ts
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── global-error.tsx
│   ├── components/
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentList.tsx
│   │   │   ├── AgentForm.tsx
│   │   │   ├── AgentConfigEditor.tsx
│   │   │   ├── AgentRunHistory.tsx
│   │   │   ├── AgentStatusBadge.tsx
│   │   │   └── index.ts
│   │   ├── campaigns/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── CampaignList.tsx
│   │   │   ├── CampaignForm.tsx
│   │   │   ├── CampaignTimeline.tsx
│   │   │   ├── CampaignMetrics.tsx
│   │   │   └── index.ts
│   │   ├── content/
│   │   │   ├── ContentAssetCard.tsx
│   │   │   ├── ContentAssetList.tsx
│   │   │   ├── ContentEditor.tsx
│   │   │   ├── ContentPreview.tsx
│   │   │   ├── ContentMetadata.tsx
│   │   │   ├── ContentVersionHistory.tsx
│   │   │   └── index.ts
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobLogViewer.tsx
│   │   │   ├── JobStatusBadge.tsx
│   │   │   └── index.ts
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   ├── FormTextarea.tsx
│   │   │   ├── FormCheckbox.tsx
│   │   │   ├── FormRadioGroup.tsx
│   │   │   ├── FormDatePicker.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Label.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   └── providers/
│   │       ├── ThemeProvider.tsx
│   │       ├── AuthProvider.tsx
│   │       ├── ToastProvider.tsx
│   │       ├── WebSocketProvider.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useAgents.ts
│   │   ├── useCampaigns.ts
│   │   ├── useContent.ts
│   │   ├── useJobs.ts
│   │   ├── useWebSocket.ts
│   │   ├── useToast.ts
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── api/
│   │   │   ├── agents.ts
│   │   │   ├── campaigns.ts
│   │   │   ├── content.ts
│   │   │   ├── jobs.ts
│   │   │   ├── client.ts
│   │   │   └── index.ts
│   │   ├── cache/
│   │   │   ├── redis.ts
│   │   │   ├── tags.ts
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── dates.ts
│   │   │   ├── strings.ts
│   │   │   ├── numbers.ts
│   │   │   ├── cn.ts
│   │   │   └── index.ts
│   │   ├── websocket/
│   │   │   ├── client.ts
│   │   │   ├── handlers.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── session.ts
│   │   │   ├── permissions.ts
│   │   │   └── index.ts
│   │   └── constants/
│   │       ├── api.ts
│   │       ├── routes.ts
│   │       ├── status.ts
│   │       └── index.ts
│   ├── types/
│   │   ├── agent.ts
│   │   ├── campaign.ts
│   │   ├── content.ts
│   │   ├── job.ts
│   │   ├── user.ts
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   └── index.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tokens.css
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── .env.local
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
```

### Backend Structure (FastAPI)

```
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── content_strategist.py
│   │   ├── seo_writer.py
│   │   ├── email_marketer.py
│   │   ├── social_media_manager.py
│   │   └── analytics_agent.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── agents.py
│   │       ├── campaigns.py
│   │       ├── content.py
│   │       ├── jobs.py
│   │       ├── auth.py
│   │       └── health.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── database.py
│   │   ├── redis.py
│   │   └── logging.py
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── cors.py
│   │   ├── logging.py
│   │   └── error_handler.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── campaign.py
│   │   ├── content.py
│   │   ├── job.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── agent.py
│   │   ├── campaign.py
│   │   ├── content.py
│   │   ├── job.py
│   │   └── user.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── agent_service.py
│   │   ├── campaign_service.py
│   │   ├── content_service.py
│   │   ├── job_service.py
│   │   ├── openai_service.py
│   │   ├── vector_store_service.py
│   │   └── websocket_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   ├── helpers.py
│   │   └── exceptions.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_agents.py
│   │   ├── test_campaigns.py
│   │   ├── test_content.py
│   │   └── test_jobs.py
│   ├── alembic/
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── .env
│   ├── .env.example
│   ├── .python-version
│   ├── alembic.ini
│   ├── main.py
│   ├── requirements.txt
│   └── pyproject.toml
```

## Naming Conventions

### File Naming

| File Type | Convention | Example |
|-----------|------------|---------|
| React Components | PascalCase | `ContentAssetCard.tsx` |
| Server Actions | camelCase | `createCampaign.ts` |
| API Routes | camelCase | `route.ts` (in named folder) |
| Utility Functions | camelCase | `formatDate.ts` |
| Custom Hooks | camelCase with "use" prefix | `useWebSocket.ts` |
| Type Definitions | PascalCase | `AgentTypes.ts` or `agent.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| CSS Files | kebab-case | `global.css`, `tokens.css` |
| Test Files | Same as source + `.test` | `AgentCard.test.tsx` |

### Component Naming

```typescript
// ✅ Good - PascalCase, descriptive
export function ContentAssetCard({ asset }: ContentAssetCardProps) {
  return <Card>{/* ... */}</Card>
}

// ❌ Bad - camelCase, generic
export function card({ data }: Props) {
  return <div>{/* ... */}</div>
}
```

### Function Naming

```typescript
// ✅ Good - camelCase, verb-first
function fetchAgentById(id: string): Promise<Agent> {
  // ...
}

function formatCurrency(amount: number): string {
  // ...
}

// ❌ Bad - unclear, no verb
function agent(id: string) {
  // ...
}

function currency(amount: number) {
  // ...
}
```

### Variable Naming

```typescript
// ✅ Good - camelCase, descriptive
const isLoading = true
const userProfile = await fetchUser()
const campaignMetrics = calculateMetrics(campaign)

// ❌ Bad - unclear, abbreviated
const l = true
const u = await fetchUser()
const cm = calculateMetrics(campaign)
```

### Constant Naming

```typescript
// ✅ Good - UPPER_SNAKE_CASE
export const API_BASE_URL = 'https://api.example.com'
export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const SUPPORTED_FORMATS = ['jpg', 'png', 'webp']

// ❌ Bad - camelCase for constants
export const apiBaseUrl = 'https://api.example.com'
export const maxFileSize = 5 * 1024 * 1024
```

### Type Naming

```typescript
// ✅ Good - PascalCase, descriptive
interface ContentAsset {
  id: string
  title: string
  status: ContentStatus
}

type AgentConfig = {
  model: string
  temperature: number
}

enum JobStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
}

// ❌ Bad - unclear, prefixed
interface IContent {
  // ...
}

type TAgent = {
  // ...
}
```

## Import Patterns and Order

### Import Order

```typescript
// 1. React/Next.js imports
import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 2. Third-party library imports
import { z } from 'zod'
import { format } from 'date-fns'

// 3. Internal imports (alphabetically by path)
import { Button } from '@/components/ui/Button'
import { ContentAssetCard } from '@/components/content/ContentAssetCard'
import { useWebSocket } from '@/hooks/useWebSocket'
import { fetchContent } from '@/lib/api/content'
import { cn } from '@/lib/utils/cn'

// 4. Type imports
import type { ContentAsset } from '@/types/content'
import type { Agent } from '@/types/agent'

// 5. Relative imports
import { getMetrics } from './utils'
import { ContentForm } from './ContentForm'

// 6. Style imports (if any)
import styles from './styles.module.css'
```

### Barrel Exports (index.ts)

```typescript
// components/agents/index.ts
export { AgentCard } from './AgentCard'
export { AgentList } from './AgentList'
export { AgentForm } from './AgentForm'
export { AgentConfigEditor } from './AgentConfigEditor'
export { AgentRunHistory } from './AgentRunHistory'
export { AgentStatusBadge } from './AgentStatusBadge'

// Usage in other files
import {
  AgentCard,
  AgentList,
  AgentStatusBadge,
} from '@/components/agents'
```

### Import Aliases

```typescript
// tsconfig.json path aliases
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/app/*": ["./app/*"]
    }
  }
}

// Usage
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import type { Agent } from '@/types/agent'
```

## Code Organization Principles

### Folder-by-Feature

```
✅ Good - Organized by feature
components/
├── agents/
│   ├── AgentCard.tsx
│   ├── AgentList.tsx
│   └── AgentForm.tsx
├── campaigns/
│   ├── CampaignCard.tsx
│   └── CampaignList.tsx
└── content/
    ├── ContentAssetCard.tsx
    └── ContentEditor.tsx

❌ Bad - Organized by type
components/
├── cards/
│   ├── AgentCard.tsx
│   ├── CampaignCard.tsx
│   └── ContentAssetCard.tsx
├── lists/
│   ├── AgentList.tsx
│   └── CampaignList.tsx
└── forms/
    ├── AgentForm.tsx
    └── ContentEditor.tsx
```

### Colocation

```
✅ Good - Related code together
app/(dashboard)/agents/
├── [id]/
│   ├── page.tsx
│   ├── edit/
│   │   └── page.tsx
│   └── runs/
│       └── page.tsx
└── page.tsx

❌ Bad - Scattered across folders
app/
├── agents/
│   └── page.tsx
├── agent-detail/
│   └── page.tsx
└── agent-edit/
    └── page.tsx
```

### Component Structure

```typescript
// ✅ Good - Clear, organized structure
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { ContentAsset } from '@/types/content'

interface ContentAssetCardProps {
  asset: ContentAsset
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ContentAssetCard({
  asset,
  onEdit,
  onDelete,
}: ContentAssetCardProps) {
  // State
  const [isExpanded, setIsExpanded] = useState(false)

  // Derived values
  const statusColor = getStatusColor(asset.status)

  // Event handlers
  const handleEdit = () => onEdit?.(asset.id)
  const handleDelete = () => onDelete?.(asset.id)

  // Render
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3>{asset.title}</h3>
        <Badge color={statusColor}>{asset.status}</Badge>
      </div>
      {/* ... */}
    </Card>
  )
}

// Helper functions (below component)
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'blue',
    published: 'green',
    archived: 'gray',
  }
  return colors[status] || 'gray'
}
```

## Module Organization

### Server Actions

```typescript
// app/actions/campaigns.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Campaign } from '@/types/campaign'

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
})

export async function createCampaign(
  formData: FormData
): Promise<{ success: boolean; campaign?: Campaign; error?: string }> {
  try {
    const data = campaignSchema.parse({
      name: formData.get('name'),
      description: formData.get('description'),
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
    })

    const campaign = await fetch('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(res => res.json())

    revalidatePath('/campaigns')
    return { success: true, campaign }
  } catch (error) {
    return { success: false, error: 'Failed to create campaign' }
  }
}
```

### API Client

```typescript
// lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`)
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    return response.json()
  }

  // ... put, delete methods
}

export const apiClient = new ApiClient(API_BASE_URL)
```

## Best Practices

### Do's

1. Use barrel exports (index.ts) for cleaner imports
2. Colocate related files (components, hooks, utilities)
3. Follow Next.js 16 App Router conventions
4. Use TypeScript strict mode
5. Keep files focused and single-purpose
6. Use descriptive, meaningful names
7. Organize by feature/domain, not by type
8. Use path aliases (@/) for imports
9. Follow consistent import order
10. Keep component files under 300 lines

### Don'ts

1. Don't create deeply nested folder structures (max 3-4 levels)
2. Don't mix Server and Client Components in the same file
3. Don't use generic names (utils.ts, helpers.ts at root)
4. Don't create circular dependencies
5. Don't use relative imports for cross-feature dependencies
6. Don't mix UI components with business logic
7. Don't create duplicate files with similar names
8. Don't store types in multiple places
9. Don't use default exports (except for pages/layouts)
10. Don't create god files with hundreds of exports

## Common Patterns

### Server Component Page Structure

```typescript
// app/(dashboard)/agents/page.tsx
import { Suspense } from 'react'
import { AgentList } from '@/components/agents/AgentList'
import { AgentSkeleton } from '@/components/agents/AgentSkeleton'
import { fetchAgents } from '@/lib/api/agents'

export default async function AgentsPage() {
  return (
    <div>
      <h1>Agents</h1>
      <Suspense fallback={<AgentSkeleton />}>
        <AgentsContent />
      </Suspense>
    </div>
  )
}

async function AgentsContent() {
  const agents = await fetchAgents()
  return <AgentList agents={agents} />
}
```

### Client Component with Hooks

```typescript
// components/agents/AgentForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Agent } from '@/types/agent'

interface AgentFormProps {
  agent?: Agent
  onSubmit: (data: AgentFormData) => Promise<void>
}

export function AgentForm({ agent, onSubmit }: AgentFormProps) {
  const router = useRouter()
  const { register, handleSubmit, formState } = useForm()
  const [isLoading, setIsLoading] = useState(false)

  const onFormSubmit = async (data: AgentFormData) => {
    setIsLoading(true)
    try {
      await onSubmit(data)
      router.push('/agents')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {/* Form fields */}
    </form>
  )
}
```

### Custom Hook

```typescript
// hooks/useAgents.ts
'use client'

import { useState, useEffect } from 'react'
import { fetchAgents } from '@/lib/api/agents'
import type { Agent } from '@/types/agent'

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [])

  return { agents, isLoading, error }
}
```

## Anti-Patterns

### Avoid Deep Nesting

```typescript
// ❌ Bad - Too deeply nested
components/
└── dashboard/
    └── sections/
        └── marketing/
            └── campaigns/
                └── list/
                    └── item/
                        └── CampaignCard.tsx

// ✅ Good - Flattened
components/
└── campaigns/
    └── CampaignCard.tsx
```

### Avoid God Components

```typescript
// ❌ Bad - 800+ lines, does everything
export function AgentDashboard() {
  // Handles: fetching, filtering, sorting, editing, deleting, analytics
  // 800+ lines of code
}

// ✅ Good - Split into focused components
export function AgentDashboard() {
  return (
    <>
      <AgentFilters />
      <AgentList />
      <AgentAnalytics />
    </>
  )
}
```

### Avoid Circular Dependencies

```typescript
// ❌ Bad - Circular dependency
// agents.ts
import { fetchCampaigns } from './campaigns'

// campaigns.ts
import { fetchAgents } from './agents'

// ✅ Good - Extract shared logic
// shared.ts
export function fetchData() { /* ... */ }

// agents.ts
import { fetchData } from './shared'

// campaigns.ts
import { fetchData } from './shared'
```

## Tools and Utilities

### VS Code Extensions

- **ES7+ React/Redux/React-Native snippets** - Component snippets
- **Auto Import** - Automatic import statements
- **Path Intellisense** - Autocomplete file paths
- **TypeScript Error Translator** - Readable TypeScript errors
- **Tailwind CSS IntelliSense** - Tailwind autocomplete

### Code Organization Scripts

```bash
# Generate component with all necessary files
npm run generate:component ComponentName

# Check for circular dependencies
npm run check:deps

# Analyze bundle size
npm run analyze
```

## Checklists

### New Component Checklist

- [ ] Named in PascalCase
- [ ] Placed in correct feature folder
- [ ] Props interface defined
- [ ] TypeScript types exported
- [ ] Added to barrel export (index.ts)
- [ ] Imports follow standard order
- [ ] Uses path aliases (@/)
- [ ] Server/Client directive if needed
- [ ] Accessible and semantic HTML
- [ ] Tests created

### New Page Checklist

- [ ] Created in correct route folder
- [ ] Uses Server Component by default
- [ ] Includes loading.tsx if async
- [ ] Includes error.tsx for error boundary
- [ ] Metadata exported
- [ ] Server Actions in app/actions/
- [ ] Follows route group conventions
- [ ] Suspense boundaries for async data
- [ ] Proper cache tags for revalidation

### New API Route Checklist

- [ ] Created in app/api/ folder
- [ ] Named route.ts
- [ ] Exports GET, POST, PUT, DELETE handlers
- [ ] Input validation with Zod
- [ ] Error handling with try/catch
- [ ] Proper HTTP status codes
- [ ] CORS headers if needed
- [ ] Rate limiting configured
- [ ] Authentication middleware applied

## References

- [Next.js 16 App Router Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
