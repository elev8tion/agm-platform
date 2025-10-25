# State Management Guide

## Overview

This document defines state management patterns for the Agentic Marketing Dashboard using Next.js 16 App Router, React Server Components, and modern client-side state management. It covers server state, client state, optimistic updates, WebSocket synchronization, and cache management.

## Guiding Principles

1. **Server-First**: Fetch data on the server when possible
2. **Progressive Enhancement**: Start with server state, add client state as needed
3. **Single Source of Truth**: Avoid duplicating state
4. **Optimistic Updates**: Update UI immediately, sync with server
5. **Cache Invalidation**: Revalidate on mutations
6. **Type Safety**: Use TypeScript for all state
7. **Minimal Client JavaScript**: Keep client bundles small

## State Architecture

### State Layers

```
┌─────────────────────────────────────────────────────┐
│                 Server State                        │
│  (React Server Components, Server Actions)          │
│  - Fetch data on server                             │
│  - No client JavaScript                             │
│  - Automatic caching (Next.js cache)                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Client State (Global)                  │
│  (Zustand, React Context)                           │
│  - User preferences                                 │
│  - UI state (sidebar, theme)                        │
│  - Cross-component state                            │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│             Client State (Local)                    │
│  (useState, useReducer)                             │
│  - Form inputs                                      │
│  - Modal state                                      │
│  - Component-specific state                         │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              Real-Time State                        │
│  (WebSocket, Server-Sent Events)                    │
│  - Job status updates                               │
│  - Agent run progress                               │
│  - Live notifications                               │
└─────────────────────────────────────────────────────┘
```

## Server State Patterns

### Server Components (Default)

```typescript
// app/(dashboard)/agents/page.tsx
import { Suspense } from 'react'
import { AgentList } from '@/components/agents/AgentList'
import { AgentSkeleton } from '@/components/agents/AgentSkeleton'

// Server Component - no 'use client'
export default async function AgentsPage() {
  // Fetch data directly on the server
  const agents = await fetchAgents()

  return (
    <div>
      <h1 className="text-heading-xl mb-6">Agents</h1>
      <Suspense fallback={<AgentSkeleton />}>
        <AgentList agents={agents} />
      </Suspense>
    </div>
  )
}

// Server-side data fetching
async function fetchAgents() {
  const res = await fetch('http://localhost:8000/api/agents', {
    next: { revalidate: 60 }, // Cache for 60 seconds
  })
  if (!res.ok) throw new Error('Failed to fetch agents')
  return res.json()
}
```

### Server Actions

```typescript
// app/actions/agents.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Agent } from '@/types/agent'

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['strategist', 'writer', 'marketer', 'social', 'analytics']),
  model: z.string().default('gpt-4o-mini'),
  temperature: z.number().min(0).max(2).default(0.7),
})

export async function createAgent(
  formData: FormData
): Promise<{ success: boolean; agent?: Agent; error?: string }> {
  try {
    // Validate input
    const data = agentSchema.parse({
      name: formData.get('name'),
      type: formData.get('type'),
      model: formData.get('model'),
      temperature: Number(formData.get('temperature')),
    })

    // Call backend API
    const response = await fetch('http://localhost:8000/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create agent')
    }

    const agent = await response.json()

    // Revalidate cache
    revalidatePath('/agents')
    revalidateTag('agents')

    return { success: true, agent }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to create agent' }
  }
}

export async function updateAgent(
  id: string,
  formData: FormData
): Promise<{ success: boolean; agent?: Agent; error?: string }> {
  try {
    const data = agentSchema.parse({
      name: formData.get('name'),
      type: formData.get('type'),
      model: formData.get('model'),
      temperature: Number(formData.get('temperature')),
    })

    const response = await fetch(`http://localhost:8000/api/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to update agent')
    }

    const agent = await response.json()

    revalidatePath('/agents')
    revalidatePath(`/agents/${id}`)
    revalidateTag('agents')

    return { success: true, agent }
  } catch (error) {
    return { success: false, error: 'Failed to update agent' }
  }
}

export async function deleteAgent(id: string) {
  try {
    const response = await fetch(`http://localhost:8000/api/agents/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to delete agent')
    }

    revalidatePath('/agents')
    revalidateTag('agents')

    redirect('/agents')
  } catch (error) {
    throw new Error('Failed to delete agent')
  }
}
```

### Cache Management

```typescript
// Next.js fetch with cache tags
async function fetchAgent(id: string) {
  const res = await fetch(`http://localhost:8000/api/agents/${id}`, {
    next: {
      tags: ['agents', `agent-${id}`], // Cache tags for revalidation
      revalidate: 60, // Revalidate every 60 seconds
    },
  })
  return res.json()
}

// Manual revalidation in Server Action
import { revalidateTag } from 'next/cache'

export async function updateAgent(id: string, data: AgentData) {
  await fetch(`http://localhost:8000/api/agents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  // Revalidate specific cache tags
  revalidateTag('agents')
  revalidateTag(`agent-${id}`)
}
```

## Client State Patterns

### Local Component State

```typescript
// components/agents/AgentForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAgent } from '@/app/actions/agents'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'

export function AgentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await createAgent(formData)

    if (result.success) {
      toast.success('Agent created successfully')
      router.push('/agents')
    } else {
      toast.error(result.error || 'Failed to create agent')
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        name="name"
        label="Agent Name"
        required
        error={errors.name}
      />
      {/* More fields */}
      <Button type="submit" isLoading={isLoading}>
        Create Agent
      </Button>
    </form>
  )
}
```

### Global Client State (Zustand)

```typescript
// lib/store/useStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage', // localStorage key
    }
  )
)

// Usage in components
'use client'

import { useUIStore } from '@/lib/store/useStore'

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <aside className={sidebarOpen ? 'block' : 'hidden'}>
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        Toggle
      </button>
    </aside>
  )
}
```

### React Context (Limited Use)

```typescript
// components/providers/ToastProvider.tsx
'use client'

import { createContext, useContext, useState } from 'react'
import { Toast } from '@/components/ui/Toast'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastContextType {
  toasts: Toast[]
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type']) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }

  const toast = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    info: (message: string) => addToast(message, 'info'),
  }

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-tooltip">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type}>
            {t.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
```

## Optimistic Updates

### useOptimistic Hook

```typescript
// components/content/ContentAssetCard.tsx
'use client'

import { useOptimistic } from 'react'
import { updateContentStatus } from '@/app/actions/content'
import { Button } from '@/components/ui/Button'
import type { ContentAsset } from '@/types/content'

interface ContentAssetCardProps {
  asset: ContentAsset
}

export function ContentAssetCard({ asset }: ContentAssetCardProps) {
  const [optimisticAsset, setOptimisticAsset] = useOptimistic(
    asset,
    (state, newStatus: string) => ({ ...state, status: newStatus })
  )

  const handleStatusChange = async (newStatus: string) => {
    // Update UI optimistically
    setOptimisticAsset(newStatus)

    // Sync with server
    await updateContentStatus(asset.id, newStatus)
  }

  return (
    <div className="border rounded-lg p-4">
      <h3>{optimisticAsset.title}</h3>
      <p>Status: {optimisticAsset.status}</p>
      <div className="flex gap-2 mt-4">
        <Button
          size="sm"
          onClick={() => handleStatusChange('draft')}
          disabled={optimisticAsset.status === 'draft'}
        >
          Mark as Draft
        </Button>
        <Button
          size="sm"
          onClick={() => handleStatusChange('published')}
          disabled={optimisticAsset.status === 'published'}
        >
          Publish
        </Button>
      </div>
    </div>
  )
}
```

### Optimistic List Updates

```typescript
// components/agents/AgentList.tsx
'use client'

import { useOptimistic, useTransition } from 'react'
import { deleteAgent } from '@/app/actions/agents'
import type { Agent } from '@/types/agent'

interface AgentListProps {
  agents: Agent[]
}

export function AgentList({ agents }: AgentListProps) {
  const [isPending, startTransition] = useTransition()
  const [optimisticAgents, removeOptimisticAgent] = useOptimistic(
    agents,
    (state, agentId: string) => state.filter((a) => a.id !== agentId)
  )

  const handleDelete = (agentId: string) => {
    startTransition(async () => {
      removeOptimisticAgent(agentId)
      await deleteAgent(agentId)
    })
  }

  return (
    <div className="space-y-4">
      {optimisticAgents.map((agent) => (
        <div key={agent.id} className="border rounded-lg p-4">
          <h3>{agent.name}</h3>
          <button onClick={() => handleDelete(agent.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
```

## WebSocket State Management

### WebSocket Hook

```typescript
// hooks/useWebSocket.ts
'use client'

import { useEffect, useState, useRef } from 'react'

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: unknown) => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket({
  url,
  onMessage,
  onError,
  reconnect = true,
  reconnectInterval = 3000,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

      ws.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')

        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Reconnecting WebSocket...')
            connect()
          }, reconnectInterval)
        }
      }

      wsRef.current = ws
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      wsRef.current?.close()
    }
  }, [url, onMessage, onError, reconnect, reconnectInterval])

  const send = (data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  return { isConnected, send }
}
```

### Real-Time Job Updates

```typescript
// components/jobs/JobMonitor.tsx
'use client'

import { useState } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import type { Job } from '@/types/job'

export function JobMonitor({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)

  useWebSocket({
    url: 'ws://localhost:8000/ws/jobs',
    onMessage: (data) => {
      const update = data as { type: string; job: Job }

      if (update.type === 'job.updated') {
        setJobs((prev) =>
          prev.map((job) => (job.id === update.job.id ? update.job : job))
        )
      } else if (update.type === 'job.created') {
        setJobs((prev) => [update.job, ...prev])
      }
    },
  })

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border rounded-lg p-4">
          <h3>{job.name}</h3>
          <p>Status: {job.status}</p>
          <p>Progress: {job.progress}%</p>
        </div>
      ))}
    </div>
  )
}
```

## Form State Management

### React Hook Form

```typescript
// components/campaigns/CampaignForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createCampaign } from '@/app/actions/campaigns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  budget: z.number().min(0),
})

type CampaignFormData = z.infer<typeof campaignSchema>

export function CampaignForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
  })

  const onSubmit = async (data: CampaignFormData) => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    const result = await createCampaign(formData)
    if (!result.success) {
      console.error(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Campaign Name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Description"
        error={errors.description?.message}
        {...register('description')}
      />
      <Input
        label="Start Date"
        type="date"
        error={errors.startDate?.message}
        {...register('startDate', { valueAsDate: true })}
      />
      <Input
        label="End Date"
        type="date"
        error={errors.endDate?.message}
        {...register('endDate', { valueAsDate: true })}
      />
      <Input
        label="Budget"
        type="number"
        error={errors.budget?.message}
        {...register('budget', { valueAsNumber: true })}
      />
      <Button type="submit" isLoading={isSubmitting}>
        Create Campaign
      </Button>
    </form>
  )
}
```

## When to Use What

### Server State (Default Choice)

**Use for:**
- Initial page data
- Static content
- SEO-critical content
- Non-interactive data

**Example:**
```typescript
// app/(dashboard)/campaigns/page.tsx
export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns()
  return <CampaignList campaigns={campaigns} />
}
```

### Client State (useState/useReducer)

**Use for:**
- Form inputs
- Modal visibility
- Accordion expand/collapse
- Component-specific UI state

**Example:**
```typescript
function Modal() {
  const [isOpen, setIsOpen] = useState(false)
  // ...
}
```

### Global Client State (Zustand)

**Use for:**
- User preferences
- Theme settings
- Sidebar state
- Cross-component UI state

**Example:**
```typescript
const { theme, setTheme } = useUIStore()
```

### React Context

**Use for:**
- Dependency injection
- Provider pattern (auth, toast)
- Avoid prop drilling (limited cases)

**Example:**
```typescript
const { user } = useAuth()
```

### WebSocket State

**Use for:**
- Real-time updates
- Job progress monitoring
- Live notifications
- Chat/messaging

**Example:**
```typescript
useWebSocket({
  url: 'ws://localhost:8000/ws/jobs',
  onMessage: handleJobUpdate,
})
```

## Performance Considerations

### Minimize Client JavaScript

```typescript
// ✅ Good - Server Component (no JS)
async function AgentList() {
  const agents = await fetchAgents()
  return <ul>{agents.map(renderAgent)}</ul>
}

// ❌ Bad - Unnecessary client component
'use client'
function AgentList() {
  const [agents, setAgents] = useState([])
  useEffect(() => {
    fetchAgents().then(setAgents)
  }, [])
  return <ul>{agents.map(renderAgent)}</ul>
}
```

### Selective Hydration

```typescript
// Only make interactive parts client components
<ServerComponent>
  <StaticContent />
  <ClientButton /> {/* Only this needs hydration */}
</ServerComponent>
```

### Debounce Updates

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage
const searchTerm = useDebounce(inputValue, 500)
```

## Best Practices

### Do's

1. Default to Server Components
2. Use Server Actions for mutations
3. Implement optimistic updates for better UX
4. Use cache tags for granular revalidation
5. Keep client state minimal
6. Use TypeScript for type safety
7. Handle loading and error states
8. Implement proper error boundaries
9. Use WebSocket for real-time features
10. Persist user preferences in localStorage

### Don'ts

1. Don't fetch data in Client Components unnecessarily
2. Don't use Context for frequently changing values
3. Don't forget to revalidate cache after mutations
4. Don't store sensitive data in client state
5. Don't create circular dependencies
6. Don't mix Server and Client Component logic
7. Don't forget error handling
8. Don't use `useEffect` for data fetching
9. Don't duplicate server state in client state
10. Don't forget to clean up WebSocket connections

## References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Hook Form](https://react-hook-form.com/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
