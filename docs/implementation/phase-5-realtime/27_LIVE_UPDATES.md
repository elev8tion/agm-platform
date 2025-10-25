# Live Updates - Real-time UI Synchronization

## Overview

The Live Updates system ensures the UI stays synchronized with backend state in real-time. It implements optimistic updates, conflict resolution, stale data detection, and efficient list management for agent statuses, job queues, campaigns, and content assets.

**Key Features:**
- Optimistic UI updates with server confirmation
- Real-time list synchronization
- Conflict resolution strategies
- Stale data detection and refresh
- Efficient re-rendering with React Query
- Live indicators for active data
- Automatic retry on failure
- Cache invalidation strategies

## Prerequisites

**Required Phases:**
- Phase 5.1: WebSocket client ([23_WEBSOCKET_CLIENT.md](./23_WEBSOCKET_CLIENT.md))
- Phase 2: API client with React Query
- Phase 3: Agent system
- Phase 4: Job queue

**Dependencies:**
```json
{
  "@tanstack/react-query": "^5.17.19",
  "zustand": "^4.4.7",
  "immer": "^10.0.3",
  "framer-motion": "^10.16.16"
}
```

## Architecture

### Data Synchronization Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  User Action │────────▶│  Optimistic  │────────▶│   UI Update  │
│  (e.g., Add) │         │    Update    │         │   (Instant)  │
└──────────────┘         └──────────────┘         └──────────────┘
       │                                                   │
       │                                                   │
       ▼                                                   ▼
┌──────────────┐                                   ┌──────────────┐
│   API Call   │                                   │  WebSocket   │
│  (Backend)   │                                   │  Subscribe   │
└──────────────┘                                   └──────────────┘
       │                                                   │
       ├──────────────┬────────────────────────────────────┤
       │              │                                    │
       ▼              ▼                                    ▼
┌──────────────┐  ┌──────────────┐              ┌──────────────┐
│   Success    │  │    Error     │              │  Real-time   │
│  Confirmed   │  │  Rollback    │              │    Event     │
└──────────────┘  └──────────────┘              └──────────────┘
       │              │                                    │
       └──────────────┴────────────────────────────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │  Final State │
                      │     Sync     │
                      └──────────────┘
```

## Complete Implementation

### Live List Hook (Generic)

```typescript
// lib/live-updates/hooks/useLiveList.ts

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { produce } from 'immer';

interface UseLiveListOptions<T> {
  queryKey: string[];
  fetchFn: () => Promise<T[]>;
  wsEvent?: string;
  wsFilter?: (item: T, event: any) => boolean;
  wsTransform?: (item: T, event: any) => T;
  onUpdate?: (items: T[]) => void;
  refetchInterval?: number;
  staleTime?: number;
}

export function useLiveList<T extends { id: string }>({
  queryKey,
  fetchFn,
  wsEvent,
  wsFilter,
  wsTransform,
  onUpdate,
  refetchInterval,
  staleTime = 30000, // 30 seconds
}: UseLiveListOptions<T>) {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useWebSocket();
  const lastUpdateRef = useRef<number>(Date.now());

  // Fetch data
  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime,
    refetchInterval: refetchInterval || (isConnected ? false : 5000),
  });

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (!wsEvent || !isConnected) return;

    const unsub = subscribe(wsEvent as any, (event: any) => {
      queryClient.setQueryData<T[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;

        return produce(oldData, (draft) => {
          // Update existing item or add new
          const index = draft.findIndex((item) =>
            wsFilter ? wsFilter(item, event) : item.id === event.id
          );

          if (index !== -1) {
            // Update existing
            if (wsTransform) {
              draft[index] = wsTransform(draft[index], event);
            } else {
              Object.assign(draft[index], event);
            }
          } else {
            // Add new
            draft.unshift(event as T);
          }

          lastUpdateRef.current = Date.now();
        });
      });

      if (onUpdate) {
        const newData = queryClient.getQueryData<T[]>(queryKey);
        if (newData) onUpdate(newData);
      }
    });

    return unsub;
  }, [wsEvent, isConnected, subscribe, queryClient, queryKey, wsFilter, wsTransform, onUpdate]);

  // Optimistic update helper
  const optimisticUpdate = useCallback(
    (updater: (items: T[]) => T[]) => {
      queryClient.setQueryData<T[]>(queryKey, (oldData) => {
        if (!oldData) return oldData;
        return updater([...oldData]);
      });
    },
    [queryClient, queryKey]
  );

  // Optimistic add
  const optimisticAdd = useCallback(
    (item: T) => {
      optimisticUpdate((items) => [item, ...items]);
    },
    [optimisticUpdate]
  );

  // Optimistic remove
  const optimisticRemove = useCallback(
    (id: string) => {
      optimisticUpdate((items) => items.filter((item) => item.id !== id));
    },
    [optimisticUpdate]
  );

  // Optimistic update single item
  const optimisticUpdateItem = useCallback(
    (id: string, updates: Partial<T>) => {
      optimisticUpdate((items) =>
        items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );
    },
    [optimisticUpdate]
  );

  // Check if data is stale
  const isStale = Date.now() - lastUpdateRef.current > staleTime;

  // Force refresh
  const refresh = useCallback(() => {
    query.refetch();
  }, [query]);

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    isStale,
    refresh,
    optimisticAdd,
    optimisticRemove,
    optimisticUpdateItem,
    optimisticUpdate,
  };
}
```

### Live Agent Status Hook

```typescript
// lib/live-updates/hooks/useLiveAgentStatus.ts

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { AgentStatusEvent, AgentType, AgentStatus } from '@/lib/websocket/types';

interface AgentStatusState {
  status: AgentStatus;
  currentJob: string | null;
  queueDepth: number;
  lastUpdate: number;
}

export function useLiveAgentStatus() {
  const { subscribe, joinRoom, leaveRoom, isConnected } = useWebSocket();
  const [agents, setAgents] = useState<Record<AgentType, AgentStatusState>>({
    cmo: { status: 'ready', currentJob: null, queueDepth: 0, lastUpdate: Date.now() },
    seo_writer: { status: 'ready', currentJob: null, queueDepth: 0, lastUpdate: Date.now() },
    email_marketer: { status: 'ready', currentJob: null, queueDepth: 0, lastUpdate: Date.now() },
    social_media_manager: { status: 'ready', currentJob: null, queueDepth: 0, lastUpdate: Date.now() },
    analytics_specialist: { status: 'ready', currentJob: null, queueDepth: 0, lastUpdate: Date.now() },
  });

  useEffect(() => {
    if (!isConnected) return;

    // Join agent rooms
    const agentTypes: AgentType[] = [
      'cmo',
      'seo_writer',
      'email_marketer',
      'social_media_manager',
      'analytics_specialist',
    ];

    agentTypes.forEach((type) => {
      joinRoom(`agent:${type}`);
    });

    // Subscribe to status updates
    const unsub = subscribe('agent:status', (event: AgentStatusEvent) => {
      setAgents((prev) => ({
        ...prev,
        [event.agentType]: {
          status: event.status,
          currentJob: event.currentJob || null,
          queueDepth: event.queueDepth || 0,
          lastUpdate: Date.now(),
        },
      }));
    });

    return () => {
      agentTypes.forEach((type) => {
        leaveRoom(`agent:${type}`);
      });
      unsub();
    };
  }, [isConnected, subscribe, joinRoom, leaveRoom]);

  return {
    agents,
    getBusyAgents: () => Object.entries(agents).filter(([_, state]) => state.status === 'busy'),
    getReadyAgents: () => Object.entries(agents).filter(([_, state]) => state.status === 'ready'),
    getTotalQueueDepth: () => Object.values(agents).reduce((sum, state) => sum + state.queueDepth, 0),
  };
}
```

### Live Job Queue Hook

```typescript
// lib/live-updates/hooks/useLiveJobQueue.ts

import { useLiveList } from './useLiveList';
import { apiClient } from '@/lib/api/client';

export interface Job {
  id: string;
  type: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  agentType: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progress: number;
  cost?: number;
  error?: string;
}

export function useLiveJobQueue() {
  return useLiveList<Job>({
    queryKey: ['jobs'],
    fetchFn: async () => {
      const response = await apiClient.get('/jobs');
      return response.data;
    },
    wsEvent: 'job:status',
    wsFilter: (job, event) => job.id === event.jobId,
    wsTransform: (job, event) => ({
      ...job,
      status: event.status,
      progress: event.progress || job.progress,
    }),
    staleTime: 10000, // 10 seconds
  });
}

// Helper hook for filtering
export function useFilteredJobs(status?: Job['status']) {
  const { data, ...rest } = useLiveJobQueue();

  const filteredData = status
    ? data.filter((job) => job.status === status)
    : data;

  return {
    data: filteredData,
    ...rest,
  };
}
```

### Live Campaign Metrics Hook

```typescript
// lib/live-updates/hooks/useLiveCampaignMetrics.ts

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { apiClient } from '@/lib/api/client';
import { CampaignMetricsEvent } from '@/lib/websocket/types';

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    cost: number;
    roi: number;
  };
  updatedAt: number;
}

export function useLiveCampaignMetrics(campaignId: string) {
  const queryClient = useQueryClient();
  const { subscribe, joinRoom, leaveRoom, isConnected } = useWebSocket();

  // Fetch campaign data
  const query = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/campaigns/${campaignId}`);
      return response.data as Campaign;
    },
    enabled: !!campaignId,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!campaignId || !isConnected) return;

    const room = `campaign:${campaignId}`;
    joinRoom(room);

    const unsub = subscribe('campaign:metrics', (event: CampaignMetricsEvent) => {
      if (event.campaignId === campaignId) {
        queryClient.setQueryData<Campaign>(['campaign', campaignId], (old) => {
          if (!old) return old;
          return {
            ...old,
            metrics: event.metrics,
            updatedAt: event.timestamp,
          };
        });
      }
    });

    return () => {
      leaveRoom(room);
      unsub();
    };
  }, [campaignId, isConnected, subscribe, joinRoom, leaveRoom, queryClient]);

  return query;
}
```

### Live Content Assets Hook

```typescript
// lib/live-updates/hooks/useLiveContentAssets.ts

import { useLiveList } from './useLiveList';
import { apiClient } from '@/lib/api/client';
import { ContentAsset, ContentStatus } from '@/lib/websocket/types';

export function useLiveContentAssets(type?: ContentAsset['type']) {
  const result = useLiveList<ContentAsset>({
    queryKey: type ? ['content-assets', type] : ['content-assets'],
    fetchFn: async () => {
      const response = await apiClient.get('/content', {
        params: type ? { type } : {},
      });
      return response.data;
    },
    wsEvent: 'asset:status',
    wsFilter: (asset, event) => asset.id === event.assetId,
    wsTransform: (asset, event) => ({
      ...asset,
      status: event.status,
      updatedAt: event.timestamp,
    }),
  });

  // Also handle asset creation
  const { subscribe, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    const unsub = subscribe('asset:created', (event) => {
      if (!type || event.asset.type === type) {
        result.optimisticAdd(event.asset);
      }
    });

    return unsub;
  }, [isConnected, subscribe, type, result.optimisticAdd]);

  return result;
}
```

### Live Indicator Component

```typescript
// components/live/LiveIndicator.tsx

'use client';

import { motion } from 'framer-motion';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';

interface LiveIndicatorProps {
  show?: boolean;
  label?: string;
  className?: string;
}

export function LiveIndicator({
  show = true,
  label = 'Live',
  className = '',
}: LiveIndicatorProps) {
  const { isConnected } = useWebSocket();

  if (!show || !isConnected) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <motion.div
          className="h-2 w-2 rounded-full bg-green-500"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500 opacity-75"
          animate={{
            scale: [1, 2, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-green-600 dark:text-green-400">
          {label}
        </span>
      )}
    </div>
  );
}
```

### Optimistic Mutation Hook

```typescript
// lib/live-updates/hooks/useOptimisticMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface UseOptimisticMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: string[];
  optimisticUpdate: (variables: TVariables, oldData: any) => any;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
}: UseOptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any) =>
        optimisticUpdate(variables, old)
      );

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      toast.error(errorMessage || 'Operation failed');

      if (onError) {
        onError(error as Error, variables);
      }
    },
    onSuccess: (data, variables) => {
      toast.success(successMessage || 'Success');

      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onSettled: () => {
      // Always refetch to ensure data is in sync
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
```

### Example: Optimistic Job Creation

```typescript
// Example usage in a component

import { useOptimisticMutation } from '@/lib/live-updates/hooks/useOptimisticMutation';
import { useLiveJobQueue } from '@/lib/live-updates/hooks/useLiveJobQueue';
import { apiClient } from '@/lib/api/client';

export function CreateJobButton() {
  const { data: jobs } = useLiveJobQueue();

  const createJob = useOptimisticMutation({
    mutationFn: async (jobData: { type: string; agentType: string }) => {
      const response = await apiClient.post('/jobs', jobData);
      return response.data;
    },
    queryKey: ['jobs'],
    optimisticUpdate: (variables, oldData) => {
      const optimisticJob = {
        id: `temp-${Date.now()}`,
        ...variables,
        status: 'queued' as const,
        progress: 0,
        createdAt: Date.now(),
      };
      return [optimisticJob, ...(oldData || [])];
    },
    successMessage: 'Job created successfully',
    errorMessage: 'Failed to create job',
  });

  return (
    <Button
      onClick={() =>
        createJob.mutate({
          type: 'seo_article',
          agentType: 'seo_writer',
        })
      }
      disabled={createJob.isPending}
    >
      {createJob.isPending ? 'Creating...' : 'Create Job'}
    </Button>
  );
}
```

### Conflict Resolution Strategy

```typescript
// lib/live-updates/conflictResolution.ts

export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge' | 'prompt';

export interface ConflictResolver<T> {
  resolve: (
    clientData: T,
    serverData: T,
    strategy: ConflictStrategy
  ) => T;
}

export function createConflictResolver<T extends { updatedAt?: number }>(): ConflictResolver<T> {
  return {
    resolve: (clientData, serverData, strategy) => {
      switch (strategy) {
        case 'server-wins':
          return serverData;

        case 'client-wins':
          return clientData;

        case 'merge':
          // Merge based on timestamps
          const clientTime = clientData.updatedAt || 0;
          const serverTime = serverData.updatedAt || 0;

          if (serverTime > clientTime) {
            return { ...clientData, ...serverData };
          } else {
            return { ...serverData, ...clientData };
          }

        case 'prompt':
          // This would show a UI dialog to the user
          // For now, default to server wins
          console.warn('Conflict detected, defaulting to server data');
          return serverData;

        default:
          return serverData;
      }
    },
  };
}
```

### Stale Data Indicator

```typescript
// components/live/StaleDataWarning.tsx

'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface StaleDataWarningProps {
  isStale: boolean;
  onRefresh: () => void;
}

export function StaleDataWarning({ isStale, onRefresh }: StaleDataWarningProps) {
  if (!isStale) return null;

  return (
    <Alert>
      <RefreshCw className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Data may be outdated</span>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          Refresh
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

## Performance Optimization

### Debounced Updates

```typescript
// lib/live-updates/utils/debounce.ts

import { useCallback, useRef } from 'react';

export function useDebouncedUpdate<T>(
  updateFn: (value: T) => void,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateFn(value);
      }, delay);
    },
    [updateFn, delay]
  );
}
```

### Batched Updates

```typescript
// lib/live-updates/utils/batch.ts

export class UpdateBatcher<T> {
  private queue: T[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly delay: number;

  constructor(
    private processor: (items: T[]) => void,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.batchSize = batchSize;
    this.delay = delay;
  }

  add(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.delay);
    }
  }

  flush(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    if (this.queue.length > 0) {
      this.processor([...this.queue]);
      this.queue = [];
    }
  }

  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.queue = [];
  }
}
```

## Accessibility

### Live Region for Updates

```typescript
// components/live/LiveRegionAnnouncer.tsx

import { useEffect, useRef } from 'react';

export function LiveRegionAnnouncer({ message }: { message: string }) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current && message) {
      regionRef.current.textContent = message;
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

## Error Handling

### Retry Logic

```typescript
// lib/live-updates/retry.ts

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

## Testing

```typescript
// __tests__/lib/live-updates/useLiveList.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLiveList } from '@/lib/live-updates/hooks/useLiveList';

describe('useLiveList', () => {
  it('should fetch and update data', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLiveList({
          queryKey: ['test'],
          fetchFn: async () => [{ id: '1', name: 'Test' }],
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });
  });

  it('should handle optimistic updates', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useLiveList({
          queryKey: ['test'],
          fetchFn: async () => [{ id: '1', name: 'Test' }],
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
    });

    result.current.optimisticAdd({ id: '2', name: 'New' });

    expect(result.current.data).toHaveLength(2);
  });
});
```

## Troubleshooting

**Issue**: Data not updating in real-time
```typescript
// Check WebSocket connection
const { isConnected } = useWebSocket();
console.log('WebSocket connected:', isConnected);

// Check if subscribed to correct event
console.log('Subscribed to event:', wsEvent);
```

**Issue**: Optimistic updates not rolling back
```typescript
// Verify context is being returned from onMutate
onMutate: async (variables) => {
  const previousData = queryClient.getQueryData(queryKey);
  console.log('Previous data snapshot:', previousData);
  return { previousData }; // Make sure this is returned!
};
```

**Issue**: Performance degradation with many updates
```typescript
// Use debouncing
const debouncedUpdate = useDebouncedUpdate(updateFn, 500);

// Or batching
const batcher = new UpdateBatcher(processBatch, 10, 100);
```

## Best Practices

1. **Always use optimistic updates for user actions**
   - Immediate feedback
   - Roll back on error
   - Sync with server confirmation

2. **Implement stale data detection**
   - Track last update timestamp
   - Show warnings when data is old
   - Provide manual refresh option

3. **Use React Query's built-in features**
   - `staleTime` for cache freshness
   - `refetchInterval` for polling fallback
   - `invalidateQueries` for cache invalidation

4. **Handle conflicts gracefully**
   - Choose appropriate strategy
   - Log conflicts for debugging
   - Consider user notification

5. **Optimize re-renders**
   - Use `useMemo` for derived data
   - Split large lists with virtualization
   - Debounce rapid updates

## Integration Example

```typescript
// app/dashboard/page.tsx

'use client';

import { useLiveAgentStatus } from '@/lib/live-updates/hooks/useLiveAgentStatus';
import { useLiveJobQueue } from '@/lib/live-updates/hooks/useLiveJobQueue';
import { LiveIndicator } from '@/components/live/LiveIndicator';
import { StaleDataWarning } from '@/components/live/StaleDataWarning';

export default function DashboardPage() {
  const { agents, getTotalQueueDepth } = useLiveAgentStatus();
  const { data: jobs, isStale, refresh } = useLiveJobQueue();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <LiveIndicator />
      </div>

      <StaleDataWarning isStale={isStale} onRefresh={refresh} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Active Jobs"
          value={jobs.filter((j) => j.status === 'running').length}
        />
        <StatCard
          title="Queue Depth"
          value={getTotalQueueDepth()}
        />
        <StatCard
          title="Busy Agents"
          value={Object.values(agents).filter((a) => a.status === 'busy').length}
        />
      </div>

      {/* Rest of dashboard */}
    </div>
  );
}
```

## Next Steps

**Phase 6: Advanced Features**
- Implement undo/redo functionality
- Add offline support with service workers
- Create collaborative features (multi-user)
- Build analytics dashboard
- Add export/import capabilities

**Performance Monitoring:**
- Track re-render counts
- Monitor WebSocket message rates
- Analyze cache hit rates
- Profile component performance

**Production Readiness:**
- Load testing for concurrent users
- Error tracking integration
- Performance monitoring
- User analytics
