# WebSocket Client - Real-time Communication

## Overview

The WebSocket client establishes bidirectional real-time communication between the Next.js frontend and FastAPI backend using Socket.io. It manages connection lifecycle, room subscriptions, event handling, reconnection logic, and type-safe event dispatching.

**Key Features:**
- Type-safe event system with full TypeScript support
- Automatic reconnection with exponential backoff
- Room-based subscriptions for scoped updates
- Connection state management
- Heartbeat monitoring for connection health
- Authentication token refresh
- Event deduplication
- Memory leak prevention

## Prerequisites

**Required Phases:**
- Phase 1: Project structure and configuration
- Phase 2: API client with authentication
- Phase 3: Agent system architecture
- Phase 4: Job queue implementation

**Dependencies:**
```json
{
  "socket.io-client": "^4.7.2",
  "zustand": "^4.4.7"
}
```

**Backend Requirements:**
- FastAPI server with Socket.io support
- Authentication middleware
- Room management
- Event broadcasting

## Architecture

### Connection Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │         │   WebSocket  │         │   FastAPI   │
│  Component  │────────▶│    Client    │────────▶│   Server    │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │  useWebSocket()        │  Connect + Auth        │
      │◀───────────────────────│                        │
      │                        │                        │
      │  Subscribe to events   │  Join rooms            │
      │───────────────────────▶│───────────────────────▶│
      │                        │                        │
      │                        │  Event: job:progress   │
      │  Callback invoked      │◀───────────────────────│
      │◀───────────────────────│                        │
      │                        │                        │
      │  Component unmounts    │  Leave rooms           │
      │───────────────────────▶│───────────────────────▶│
      │                        │  Disconnect            │
      │                        │───────────────────────▶│
```

### Room Structure

- **User Room**: `user:{userId}` - User-specific updates
- **Job Room**: `job:{jobId}` - Job-specific progress and output
- **Global Room**: `global` - System-wide announcements
- **Campaign Room**: `campaign:{campaignId}` - Campaign metrics
- **Agent Room**: `agent:{agentType}` - Agent status updates

## Event Schema

### TypeScript Types

```typescript
// lib/websocket/types.ts

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

export type JobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentType =
  | 'cmo'
  | 'seo_writer'
  | 'email_marketer'
  | 'social_media_manager'
  | 'analytics_specialist';

export type AgentStatus =
  | 'ready'
  | 'busy'
  | 'error'
  | 'offline';

export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

// Job Events
export interface JobProgressEvent {
  jobId: string;
  progress: number; // 0-100
  currentStep: string;
  estimatedCompletion?: number; // seconds
  timestamp: number;
}

export interface JobOutputEvent {
  jobId: string;
  chunk: string;
  isComplete: boolean;
  type?: 'thinking' | 'writing' | 'tool_call';
  timestamp: number;
}

export interface JobStatusEvent {
  jobId: string;
  status: JobStatus;
  message?: string;
  timestamp: number;
}

export interface JobResult {
  content?: string;
  metrics?: Record<string, any>;
  artifacts?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

export interface JobCompletedEvent {
  jobId: string;
  result: JobResult;
  cost: number;
  duration: number; // seconds
  timestamp: number;
}

export interface JobFailedEvent {
  jobId: string;
  error: string;
  errorCode?: string;
  retryable: boolean;
  timestamp: number;
}

// Budget Events
export interface BudgetUpdatedEvent {
  used: number;
  total: number;
  percentage: number;
  breakdown: {
    [agentType: string]: number;
  };
  timestamp: number;
}

export interface BudgetWarningEvent {
  threshold: number; // 80, 90, 100
  message: string;
  currentUsage: number;
  timestamp: number;
}

// Campaign Events
export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  cost: number;
  roi: number;
}

export interface CampaignMetricsEvent {
  campaignId: string;
  metrics: CampaignMetrics;
  timestamp: number;
}

// Asset Events
export interface ContentAsset {
  id: string;
  title: string;
  type: 'blog' | 'email' | 'social' | 'landing_page';
  status: ContentStatus;
  createdAt: number;
  updatedAt: number;
}

export interface AssetStatusEvent {
  assetId: string;
  status: ContentStatus;
  previousStatus: ContentStatus;
  timestamp: number;
}

export interface AssetCreatedEvent {
  asset: ContentAsset;
  timestamp: number;
}

// Agent Events
export interface AgentStatusEvent {
  agentType: AgentType;
  status: AgentStatus;
  currentJob?: string;
  queueDepth?: number;
  timestamp: number;
}

// Socket Event Map
export interface SocketEvents {
  // Client -> Server
  'auth': (token: string) => void;
  'join_room': (room: string) => void;
  'leave_room': (room: string) => void;
  'ping': () => void;

  // Server -> Client
  'authenticated': (data: { userId: string; rooms: string[] }) => void;
  'auth_error': (error: string) => void;
  'pong': (data: { timestamp: number }) => void;

  // Job events
  'job:progress': (data: JobProgressEvent) => void;
  'job:output': (data: JobOutputEvent) => void;
  'job:status': (data: JobStatusEvent) => void;
  'job:completed': (data: JobCompletedEvent) => void;
  'job:failed': (data: JobFailedEvent) => void;

  // Budget events
  'budget:updated': (data: BudgetUpdatedEvent) => void;
  'budget:warning': (data: BudgetWarningEvent) => void;

  // Campaign events
  'campaign:metrics': (data: CampaignMetricsEvent) => void;

  // Asset events
  'asset:status': (data: AssetStatusEvent) => void;
  'asset:created': (data: AssetCreatedEvent) => void;

  // Agent events
  'agent:status': (data: AgentStatusEvent) => void;

  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  'reconnect': (attemptNumber: number) => void;
  'reconnect_attempt': (attemptNumber: number) => void;
  'reconnect_error': (error: Error) => void;
  'reconnect_failed': () => void;
}

// Event handler type helper
export type EventHandler<T extends keyof SocketEvents> = (
  ...args: Parameters<SocketEvents[T]>
) => void;
```

## Complete Implementation

### WebSocket Client Manager

```typescript
// lib/websocket/client.ts

import { io, Socket } from 'socket.io-client';
import { SocketEvents, ConnectionState } from './types';

interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start at 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPongTime: number = 0;
  private eventDeduplicationMap: Map<string, number> = new Map();
  private joinedRooms: Set<string> = new Set();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      autoConnect: false,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.setState('connecting');

    this.socket = io(this.config.url, {
      auth: { token },
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      timeout: this.config.timeout,
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    this.startHeartbeat();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.setState('error');
        reject(new Error('Connection timeout'));
      }, this.config.timeout);

      this.socket!.once('authenticated', () => {
        clearTimeout(timeout);
        this.setState('connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = this.config.reconnectionDelay!;

        // Rejoin rooms after reconnection
        this.rejoinRooms();

        resolve();
      });

      this.socket!.once('auth_error', (error: string) => {
        clearTimeout(timeout);
        this.setState('error');
        reject(new Error(error));
      });

      this.socket!.once('connect_error', (error: Error) => {
        clearTimeout(timeout);
        this.setState('error');
        reject(error);
      });
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.stopHeartbeat();
      this.joinedRooms.clear();
      this.socket.disconnect();
      this.socket = null;
      this.setState('disconnected');
    }
  }

  /**
   * Join a room for scoped updates
   */
  joinRoom(room: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join room: not connected');
      return;
    }

    this.socket.emit('join_room', room);
    this.joinedRooms.add(room);
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('leave_room', room);
    this.joinedRooms.delete(room);
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof SocketEvents>(
    event: K,
    handler: SocketEvents[K]
  ): () => void {
    if (!this.socket) {
      throw new Error('WebSocket not initialized');
    }

    // Wrap handler with deduplication
    const wrappedHandler = (...args: any[]) => {
      if (this.shouldProcessEvent(event, args)) {
        (handler as any)(...args);
      }
    };

    this.socket.on(event as string, wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.socket?.off(event as string, wrappedHandler);
    };
  }

  /**
   * Emit an event to server
   */
  emit<K extends keyof SocketEvents>(
    event: K,
    ...args: Parameters<SocketEvents[K]>
  ): void {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit ${String(event)}: not connected`);
      return;
    }

    this.socket.emit(event as string, ...args);
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Subscribe to connection state changes
   */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.setState('connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      this.setState('disconnected');
      this.stopHeartbeat();

      // Attempt manual reconnection for certain reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, attempt to reconnect
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.setState('error');
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.setState('reconnecting');
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.rejoinRooms();
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed');
      this.setState('error');
    });

    this.socket.on('pong', (data: { timestamp: number }) => {
      this.lastPongTime = Date.now();
    });
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.setState('error');
      return;
    }

    this.reconnectAttempts++;
    this.setState('reconnecting');

    setTimeout(() => {
      if (!this.socket?.connected) {
        this.socket?.connect();
      }
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  /**
   * Rejoin all rooms after reconnection
   */
  private rejoinRooms(): void {
    this.joinedRooms.forEach((room) => {
      this.socket?.emit('join_room', room);
    });
  }

  /**
   * Start heartbeat to monitor connection health
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');

        // Check if we received pong recently
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > 30000) {
          // No pong in 30 seconds, connection might be dead
          console.warn('No heartbeat response, reconnecting...');
          this.socket.disconnect();
          this.attemptReconnect();
        }
      }
    }, 10000); // Ping every 10 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Event deduplication to prevent duplicate processing
   */
  private shouldProcessEvent(event: string | symbol, args: any[]): boolean {
    // Only deduplicate events with timestamps
    const data = args[0];
    if (!data || typeof data !== 'object' || !data.timestamp) {
      return true;
    }

    const key = `${String(event)}:${JSON.stringify(data)}`;
    const lastTimestamp = this.eventDeduplicationMap.get(key);

    if (lastTimestamp && data.timestamp <= lastTimestamp) {
      return false; // Duplicate event
    }

    this.eventDeduplicationMap.set(key, data.timestamp);

    // Clean old entries (keep last 100)
    if (this.eventDeduplicationMap.size > 100) {
      const entries = Array.from(this.eventDeduplicationMap.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.eventDeduplicationMap = new Map(entries.slice(0, 100));
    }

    return true;
  }

  /**
   * Update connection state and notify listeners
   */
  private setState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.stateListeners.forEach((listener) => listener(state));
    }
  }
}

// Singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
    wsClient = new WebSocketClient({ url: wsUrl });
  }
  return wsClient;
}

export { WebSocketClient };
```

### React Hook: useWebSocket

```typescript
// lib/websocket/hooks/useWebSocket.ts

import { useEffect, useState, useCallback } from 'react';
import { getWebSocketClient } from '../client';
import { ConnectionState, SocketEvents } from '../types';
import { useAuth } from '@/lib/auth/hooks/useAuth';

export function useWebSocket() {
  const { token } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);

  const client = getWebSocketClient();

  // Connect on mount
  useEffect(() => {
    if (!token) return;

    const connect = async () => {
      try {
        setError(null);
        await client.connect(token);
      } catch (err) {
        setError(err as Error);
        console.error('WebSocket connection failed:', err);
      }
    };

    connect();

    // Subscribe to state changes
    const unsubscribe = client.onStateChange(setConnectionState);

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [token]);

  /**
   * Subscribe to an event
   */
  const subscribe = useCallback(
    <K extends keyof SocketEvents>(
      event: K,
      handler: SocketEvents[K]
    ): (() => void) => {
      return client.on(event, handler);
    },
    []
  );

  /**
   * Join a room
   */
  const joinRoom = useCallback((room: string) => {
    client.joinRoom(room);
  }, []);

  /**
   * Leave a room
   */
  const leaveRoom = useCallback((room: string) => {
    client.leaveRoom(room);
  }, []);

  /**
   * Emit an event
   */
  const emit = useCallback(
    <K extends keyof SocketEvents>(
      event: K,
      ...args: Parameters<SocketEvents[K]>
    ) => {
      client.emit(event, ...args);
    },
    []
  );

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    error,
    subscribe,
    joinRoom,
    leaveRoom,
    emit,
  };
}
```

### React Hook: useJobProgress

```typescript
// lib/websocket/hooks/useJobProgress.ts

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import {
  JobProgressEvent,
  JobOutputEvent,
  JobStatusEvent,
  JobCompletedEvent,
  JobFailedEvent,
  JobStatus,
  JobResult,
} from '../types';

interface JobProgressState {
  status: JobStatus;
  progress: number;
  currentStep: string;
  output: string[];
  result: JobResult | null;
  error: string | null;
  cost: number;
  duration: number;
  estimatedCompletion: number | null;
}

export function useJobProgress(jobId: string | null) {
  const { isConnected, subscribe, joinRoom, leaveRoom } = useWebSocket();
  const [state, setState] = useState<JobProgressState>({
    status: 'queued',
    progress: 0,
    currentStep: 'Initializing...',
    output: [],
    result: null,
    error: null,
    cost: 0,
    duration: 0,
    estimatedCompletion: null,
  });

  // Join job room
  useEffect(() => {
    if (!jobId || !isConnected) return;

    const room = `job:${jobId}`;
    joinRoom(room);

    return () => {
      leaveRoom(room);
    };
  }, [jobId, isConnected, joinRoom, leaveRoom]);

  // Subscribe to job events
  useEffect(() => {
    if (!jobId) return;

    const unsubscribers: Array<() => void> = [];

    // Progress updates
    unsubscribers.push(
      subscribe('job:progress', (data: JobProgressEvent) => {
        if (data.jobId === jobId) {
          setState((prev) => ({
            ...prev,
            progress: data.progress,
            currentStep: data.currentStep,
            estimatedCompletion: data.estimatedCompletion ?? null,
          }));
        }
      })
    );

    // Output streaming
    unsubscribers.push(
      subscribe('job:output', (data: JobOutputEvent) => {
        if (data.jobId === jobId) {
          setState((prev) => ({
            ...prev,
            output: [...prev.output, data.chunk],
          }));
        }
      })
    );

    // Status changes
    unsubscribers.push(
      subscribe('job:status', (data: JobStatusEvent) => {
        if (data.jobId === jobId) {
          setState((prev) => ({
            ...prev,
            status: data.status,
            currentStep: data.message || prev.currentStep,
          }));
        }
      })
    );

    // Completion
    unsubscribers.push(
      subscribe('job:completed', (data: JobCompletedEvent) => {
        if (data.jobId === jobId) {
          setState((prev) => ({
            ...prev,
            status: 'completed',
            progress: 100,
            result: data.result,
            cost: data.cost,
            duration: data.duration,
          }));
        }
      })
    );

    // Failure
    unsubscribers.push(
      subscribe('job:failed', (data: JobFailedEvent) => {
        if (data.jobId === jobId) {
          setState((prev) => ({
            ...prev,
            status: 'failed',
            error: data.error,
          }));
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [jobId, subscribe]);

  const reset = useCallback(() => {
    setState({
      status: 'queued',
      progress: 0,
      currentStep: 'Initializing...',
      output: [],
      result: null,
      error: null,
      cost: 0,
      duration: 0,
      estimatedCompletion: null,
    });
  }, []);

  return {
    ...state,
    isComplete: state.status === 'completed' || state.status === 'failed',
    isRunning: state.status === 'running',
    reset,
  };
}
```

## State Management

### Zustand Store for Connection State

```typescript
// lib/websocket/store.ts

import { create } from 'zustand';
import { ConnectionState } from './types';

interface WebSocketStore {
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;

  connectedAt: number | null;
  disconnectedAt: number | null;
  reconnectAttempts: number;

  setConnectedAt: (timestamp: number) => void;
  setDisconnectedAt: (timestamp: number) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

export const useWebSocketStore = create<WebSocketStore>((set) => ({
  connectionState: 'disconnected',
  setConnectionState: (state) => set({ connectionState: state }),

  connectedAt: null,
  disconnectedAt: null,
  reconnectAttempts: 0,

  setConnectedAt: (timestamp) => set({ connectedAt: timestamp }),
  setDisconnectedAt: (timestamp) => set({ disconnectedAt: timestamp }),
  incrementReconnectAttempts: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
}));
```

## Performance

### Optimization Strategies

1. **Event Throttling**: Limit rapid event processing
```typescript
import { throttle } from 'lodash';

const handleProgress = throttle((data: JobProgressEvent) => {
  updateProgress(data);
}, 500); // Max once per 500ms
```

2. **Memory Management**: Clean up old event data
```typescript
useEffect(() => {
  const cleanup = setInterval(() => {
    // Remove output older than 1 hour
    setState((prev) => ({
      ...prev,
      output: prev.output.slice(-1000), // Keep last 1000 chunks
    }));
  }, 60000); // Every minute

  return () => clearInterval(cleanup);
}, []);
```

3. **Selective Subscriptions**: Only subscribe to needed events
```typescript
// Don't subscribe if component is hidden
if (!isVisible) return;

const unsub = subscribe('job:progress', handler);
return unsub;
```

## Error Handling

### Connection Failure Handling

```typescript
// components/websocket/ConnectionStatus.tsx

import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ConnectionStatus() {
  const { connectionState, error } = useWebSocket();

  if (connectionState === 'connected') {
    return null;
  }

  return (
    <Alert variant={connectionState === 'error' ? 'destructive' : 'warning'}>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {connectionState === 'connecting' && 'Connecting to real-time updates...'}
          {connectionState === 'reconnecting' && 'Reconnecting...'}
          {connectionState === 'error' && `Connection error: ${error?.message}`}
          {connectionState === 'disconnected' && 'Disconnected from real-time updates'}
        </span>

        {connectionState === 'error' && (
          <Button
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

## Testing

### Unit Tests

```typescript
// __tests__/lib/websocket/client.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '@/lib/websocket/client';
import { io } from 'socket.io-client';

vi.mock('socket.io-client');

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    };

    (io as any).mockReturnValue(mockSocket);

    client = new WebSocketClient({
      url: 'http://localhost:8000',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should connect successfully', async () => {
    const connectPromise = client.connect('test-token');

    // Simulate successful authentication
    const authCallback = mockSocket.once.mock.calls.find(
      (call: any) => call[0] === 'authenticated'
    )[1];
    authCallback({ userId: 'user123', rooms: [] });

    await expect(connectPromise).resolves.toBeUndefined();
    expect(client.getState()).toBe('connected');
  });

  it('should handle connection errors', async () => {
    const connectPromise = client.connect('test-token');

    // Simulate connection error
    const errorCallback = mockSocket.once.mock.calls.find(
      (call: any) => call[0] === 'connect_error'
    )[1];
    errorCallback(new Error('Connection failed'));

    await expect(connectPromise).rejects.toThrow('Connection failed');
    expect(client.getState()).toBe('error');
  });

  it('should join and leave rooms', () => {
    mockSocket.connected = true;

    client.joinRoom('job:123');
    expect(mockSocket.emit).toHaveBeenCalledWith('join_room', 'job:123');

    client.leaveRoom('job:123');
    expect(mockSocket.emit).toHaveBeenCalledWith('leave_room', 'job:123');
  });

  it('should deduplicate events', () => {
    const handler = vi.fn();
    client.on('job:progress', handler);

    const event = {
      jobId: 'job123',
      progress: 50,
      currentStep: 'Processing',
      timestamp: Date.now(),
    };

    // First event should be processed
    const callback = mockSocket.on.mock.calls[0][1];
    callback(event);
    expect(handler).toHaveBeenCalledTimes(1);

    // Duplicate event should be ignored
    callback(event);
    expect(handler).toHaveBeenCalledTimes(1);

    // New event with different timestamp should be processed
    callback({ ...event, timestamp: Date.now() + 1000 });
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests

```typescript
// __tests__/lib/websocket/hooks/useJobProgress.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useJobProgress } from '@/lib/websocket/hooks/useJobProgress';

describe('useJobProgress', () => {
  it('should track job progress', async () => {
    const { result } = renderHook(() => useJobProgress('job123'));

    expect(result.current.status).toBe('queued');
    expect(result.current.progress).toBe(0);

    // Simulate progress event
    // (Would need to mock WebSocket client)

    await waitFor(() => {
      expect(result.current.progress).toBeGreaterThan(0);
    });
  });
});
```

## Accessibility

### Screen Reader Announcements

```typescript
// components/websocket/LiveRegion.tsx

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export function LiveRegion({ message, priority = 'polite' }: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (regionRef.current) {
      regionRef.current.textContent = message;
    }
  }, [message]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

## Troubleshooting

### Common Issues

**Issue**: Connection keeps dropping
```typescript
// Increase timeout and reconnection attempts
const client = new WebSocketClient({
  url: wsUrl,
  timeout: 30000,
  reconnectionAttempts: 10,
  reconnectionDelayMax: 60000,
});
```

**Issue**: Events not received
```typescript
// Verify room subscription
useEffect(() => {
  console.log('Joining room:', `job:${jobId}`);
  joinRoom(`job:${jobId}`);
}, [jobId]);
```

**Issue**: Memory leaks
```typescript
// Always cleanup subscriptions
useEffect(() => {
  const unsub = subscribe('job:progress', handler);
  return () => unsub(); // Critical!
}, []);
```

**Issue**: CORS errors
```typescript
// Backend: Configure CORS for Socket.io
from fastapi import FastAPI
from fastapi_socketio import SocketManager

app = FastAPI()
socket_manager = SocketManager(
    app=app,
    cors_allowed_origins=["http://localhost:3000"]
)
```

## Next Steps

**Phase 5 Continuation:**
- [24_STREAMING_UI.md](./24_STREAMING_UI.md) - Build streaming output components
- [25_NOTIFICATIONS.md](./25_NOTIFICATIONS.md) - Implement toast notifications
- [26_BUDGET_MONITOR.md](./26_BUDGET_MONITOR.md) - Create real-time budget monitoring
- [27_LIVE_UPDATES.md](./27_LIVE_UPDATES.md) - Sync live data across the UI

**Integration:**
- Connect to FastAPI WebSocket server
- Implement server-side event broadcasting
- Add Redis for pub/sub scaling
- Deploy with load balancing

**Enhancement:**
- Add message queuing for offline scenarios
- Implement conflict resolution for concurrent updates
- Add analytics for connection health
- Create admin dashboard for WebSocket monitoring
