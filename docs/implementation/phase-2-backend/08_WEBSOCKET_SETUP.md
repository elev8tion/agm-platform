# Phase 2 Backend: WebSocket Real-Time Updates

## Overview

This document implements Socket.io-based WebSocket communication for streaming real-time progress updates from agent jobs to the frontend. The system provides live status updates, progress tracking, and result streaming without polling.

**Outcomes:**
- Socket.io server integrated with FastAPI
- Room-based event emission per job
- Client connection management
- Real-time progress streaming
- Reconnection handling
- Frontend integration examples

## Prerequisites

- Phase 1 completed (database setup)
- 06_AGENT_ENDPOINTS.md implemented
- 07_BACKGROUND_TASKS.md implemented
- Python 3.13+ installed

**Dependencies:**
```bash
pip install python-socketio aiohttp python-engineio loguru
```

## Architecture

```
WebSocket Flow:
┌──────────────┐
│   Frontend   │
│   (React)    │
└──────┬───────┘
       │ Socket.io Connect
       │ socket.emit("join_job", {job_id})
       ▼
┌──────────────────┐
│  Socket.io       │
│  Server          │
│  - Manage rooms  │
│  - Auth clients  │
└──────┬───────────┘
       │ Join room: job_{id}
       │
       ▼
┌──────────────────┐
│  Background      │
│  Task            │
│  - Update DB     │
│  - Emit event    │
└──────┬───────────┘
       │ sio.emit("job_update", data, room)
       ▼
┌──────────────────┐
│   Frontend       │
│  socket.on       │
│  - Update UI     │
│  - Show progress │
└──────────────────┘
```

## Step-by-Step Implementation

### Step 1: Create Socket.io Server

```python
# api/websocket.py
import socketio
from typing import Dict, Any, Optional, Set
from loguru import logger
import jwt
import os
from datetime import datetime

from db.session import AsyncSessionLocal
from db.models import User, AgentJob
from sqlalchemy import select


# Create Socket.io server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        os.getenv("FRONTEND_URL", "https://your-netlify-site.netlify.app")
    ],
    logger=True,
    engineio_logger=False
)

# Wrap with ASGI app
socket_app = socketio.ASGIApp(
    sio,
    socketio_path='/socket.io'
)


# Connection tracking
class ConnectionManager:
    """Manage WebSocket connections and room memberships"""

    def __init__(self):
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        self.job_subscribers: Dict[int, Set[str]] = {}

    async def connect(
        self,
        sid: str,
        user_id: int,
        user_email: str
    ):
        """Register new connection"""
        self.active_connections[sid] = {
            "user_id": user_id,
            "user_email": user_email,
            "connected_at": datetime.utcnow(),
            "rooms": set()
        }
        logger.info(f"Client connected: {sid} (user: {user_email})")

    async def disconnect(self, sid: str):
        """Remove connection and cleanup rooms"""
        if sid in self.active_connections:
            user_data = self.active_connections[sid]

            # Remove from all job rooms
            for job_id in list(user_data["rooms"]):
                await self.leave_job_room(sid, job_id)

            del self.active_connections[sid]
            logger.info(f"Client disconnected: {sid}")

    async def join_job_room(
        self,
        sid: str,
        job_id: int
    ):
        """Add client to job-specific room"""
        if sid not in self.active_connections:
            return False

        room_name = f"job_{job_id}"

        # Add to Socket.io room
        await sio.enter_room(sid, room_name)

        # Track in connection manager
        self.active_connections[sid]["rooms"].add(job_id)

        if job_id not in self.job_subscribers:
            self.job_subscribers[job_id] = set()
        self.job_subscribers[job_id].add(sid)

        logger.info(f"Client {sid} joined job room: {job_id}")
        return True

    async def leave_job_room(
        self,
        sid: str,
        job_id: int
    ):
        """Remove client from job-specific room"""
        if sid not in self.active_connections:
            return

        room_name = f"job_{job_id}"
        await sio.leave_room(sid, room_name)

        # Remove from tracking
        if job_id in self.active_connections[sid]["rooms"]:
            self.active_connections[sid]["rooms"].remove(job_id)

        if job_id in self.job_subscribers and sid in self.job_subscribers[job_id]:
            self.job_subscribers[job_id].remove(sid)
            if not self.job_subscribers[job_id]:
                del self.job_subscribers[job_id]

        logger.info(f"Client {sid} left job room: {job_id}")

    def get_user_id(self, sid: str) -> Optional[int]:
        """Get user ID for connection"""
        if sid in self.active_connections:
            return self.active_connections[sid]["user_id"]
        return None

    def get_connection_count(self) -> int:
        """Get total active connections"""
        return len(self.active_connections)

    def get_job_subscriber_count(self, job_id: int) -> int:
        """Get number of clients watching a job"""
        return len(self.job_subscribers.get(job_id, set()))


# Global connection manager
manager = ConnectionManager()


# Event Handlers

@sio.event
async def connect(sid, environ, auth):
    """
    Handle client connection

    Expects auth data:
    {
        "token": "JWT_TOKEN"
    }
    """
    try:
        # Verify JWT token
        if not auth or "token" not in auth:
            logger.warning(f"Connection rejected: No auth token provided")
            await sio.disconnect(sid)
            return False

        token = auth["token"]
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=["HS256"]
        )

        user_id = payload.get("sub")
        user_email = payload.get("email")

        if not user_id:
            logger.warning(f"Connection rejected: Invalid token")
            await sio.disconnect(sid)
            return False

        # Verify user exists in database
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(User).where(User.id == int(user_id))
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.warning(f"Connection rejected: User {user_id} not found")
                await sio.disconnect(sid)
                return False

        # Register connection
        await manager.connect(sid, int(user_id), user_email or "unknown")

        # Send welcome message
        await sio.emit('connected', {
            'message': 'Connected to Agentic Marketing Dashboard',
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=sid)

        return True

    except jwt.ExpiredSignatureError:
        logger.warning(f"Connection rejected: Token expired")
        await sio.disconnect(sid)
        return False

    except jwt.InvalidTokenError as e:
        logger.warning(f"Connection rejected: Invalid token - {e}")
        await sio.disconnect(sid)
        return False

    except Exception as e:
        logger.error(f"Connection error: {e}")
        await sio.disconnect(sid)
        return False


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    await manager.disconnect(sid)


@sio.event
async def join_job(sid, data):
    """
    Subscribe to job updates

    Expects:
    {
        "job_id": 123
    }
    """
    try:
        job_id = data.get("job_id")

        if not job_id:
            await sio.emit('error', {
                'message': 'job_id is required'
            }, room=sid)
            return

        # Verify user owns this job
        user_id = manager.get_user_id(sid)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AgentJob).where(
                    AgentJob.id == job_id,
                    AgentJob.user_id == user_id
                )
            )
            job = result.scalar_one_or_none()

            if not job:
                await sio.emit('error', {
                    'message': f'Job {job_id} not found or access denied'
                }, room=sid)
                return

            # Join room
            await manager.join_job_room(sid, job_id)

            # Send current job status
            await sio.emit('job_status', {
                'job_id': job.id,
                'status': job.status,
                'progress': job.progress,
                'message': f'Subscribed to job {job_id}'
            }, room=sid)

            logger.info(f"Client {sid} subscribed to job {job_id}")

    except Exception as e:
        logger.error(f"Error joining job room: {e}")
        await sio.emit('error', {
            'message': f'Failed to join job: {str(e)}'
        }, room=sid)


@sio.event
async def leave_job(sid, data):
    """
    Unsubscribe from job updates

    Expects:
    {
        "job_id": 123
    }
    """
    try:
        job_id = data.get("job_id")

        if not job_id:
            return

        await manager.leave_job_room(sid, job_id)

        await sio.emit('job_unsubscribed', {
            'job_id': job_id,
            'message': f'Unsubscribed from job {job_id}'
        }, room=sid)

    except Exception as e:
        logger.error(f"Error leaving job room: {e}")


@sio.event
async def ping(sid):
    """Health check / keep-alive"""
    await sio.emit('pong', {
        'timestamp': datetime.utcnow().isoformat()
    }, room=sid)


# Helper Functions for Emitting Updates

async def emit_job_update(
    job_id: int,
    data: Dict[str, Any]
):
    """
    Emit update to all clients watching a job

    Args:
        job_id: Job ID
        data: Update data (status, progress, result, etc.)
    """
    room = f"job_{job_id}"
    subscriber_count = manager.get_job_subscriber_count(job_id)

    if subscriber_count == 0:
        logger.debug(f"No subscribers for job {job_id}, skipping emit")
        return

    # Add timestamp
    data["timestamp"] = datetime.utcnow().isoformat()
    data["job_id"] = job_id

    await sio.emit('job_update', data, room=room)

    logger.debug(
        f"Emitted job_update for {job_id} to {subscriber_count} clients: "
        f"{data.get('status')} ({data.get('progress')}%)"
    )


async def emit_job_progress(
    job_id: int,
    progress: int,
    message: Optional[str] = None
):
    """
    Emit progress update for a job

    Args:
        job_id: Job ID
        progress: Progress percentage (0-100)
        message: Optional progress message
    """
    data = {
        "progress": progress,
        "status": "running"
    }

    if message:
        data["message"] = message

    await emit_job_update(job_id, data)


async def emit_job_completed(
    job_id: int,
    result: Dict[str, Any]
):
    """
    Emit completion event for a job

    Args:
        job_id: Job ID
        result: Job result data
    """
    await emit_job_update(job_id, {
        "status": "completed",
        "progress": 100,
        "result": result,
        "message": "Job completed successfully"
    })


async def emit_job_failed(
    job_id: int,
    error_message: str
):
    """
    Emit failure event for a job

    Args:
        job_id: Job ID
        error_message: Error description
    """
    await emit_job_update(job_id, {
        "status": "failed",
        "error": error_message,
        "message": f"Job failed: {error_message}"
    })


async def emit_job_cancelled(
    job_id: int
):
    """
    Emit cancellation event for a job

    Args:
        job_id: Job ID
    """
    await emit_job_update(job_id, {
        "status": "cancelled",
        "message": "Job was cancelled"
    })


# Stats endpoint for monitoring

async def get_websocket_stats() -> Dict[str, Any]:
    """Get WebSocket server statistics"""
    return {
        "total_connections": manager.get_connection_count(),
        "active_job_rooms": len(manager.job_subscribers),
        "connections": [
            {
                "sid": sid[:8],  # Truncate for privacy
                "user_id": data["user_id"],
                "connected_at": data["connected_at"].isoformat(),
                "watching_jobs": len(data["rooms"])
            }
            for sid, data in manager.active_connections.items()
        ]
    }
```

### Step 2: Integrate with FastAPI Main App

```python
# main.py (updated)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from db.session import engine, Base
from api.routes import seo_routes, email_routes, cmo_routes, job_routes
from api.websocket import socket_app, get_websocket_stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Agentic Marketing Dashboard API",
    description="AI Marketing Employees powered by OpenAI Agents",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        os.getenv("FRONTEND_URL", "https://your-netlify-site.netlify.app")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(seo_routes.router)
app.include_router(email_routes.router)
app.include_router(cmo_routes.router)
app.include_router(job_routes.router)


@app.get("/")
async def root():
    return {
        "message": "Agentic Marketing Dashboard API",
        "version": "2.0.0",
        "docs": "/docs",
        "websocket": "/socket.io"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/websocket/stats")
async def websocket_stats():
    """WebSocket server statistics"""
    return await get_websocket_stats()


# Mount Socket.io app
app.mount("/", socket_app)
```

### Step 3: Update Progress Tracker to Emit Events

```python
# services/progress_tracker.py (updated)
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from services.job_service import job_service
from api.websocket import emit_job_progress


class ProgressTracker:
    """Helper for tracking job progress within agent execution"""

    def __init__(self, db: AsyncSession, job_id: int):
        self.db = db
        self.job_id = job_id
        self.current_progress = 0

    async def update(
        self,
        progress: int,
        message: Optional[str] = None
    ):
        """
        Update job progress and emit WebSocket event

        Args:
            progress: Progress percentage (0-100)
            message: Optional progress message
        """
        if progress < 0 or progress > 100:
            logger.warning(f"Invalid progress value: {progress}")
            return

        self.current_progress = progress

        # Update database
        await job_service.update_job_status(
            db=self.db,
            job_id=self.job_id,
            status="running",
            progress=progress
        )

        # Emit WebSocket event
        await emit_job_progress(
            job_id=self.job_id,
            progress=progress,
            message=message
        )

        if message:
            logger.info(f"Job {self.job_id} progress: {progress}% - {message}")

    async def increment(
        self,
        amount: int,
        message: Optional[str] = None
    ):
        """
        Increment progress by amount

        Args:
            amount: Amount to increment
            message: Optional progress message
        """
        new_progress = min(self.current_progress + amount, 100)
        await self.update(new_progress, message)

    async def set_stage(
        self,
        stage: str,
        progress: int
    ):
        """
        Set named stage with progress

        Args:
            stage: Stage name (e.g., "Researching", "Drafting", "Polishing")
            progress: Progress percentage for this stage
        """
        await self.update(progress, f"Stage: {stage}")
```

### Step 4: Update Job Service to Emit Events

```python
# services/job_service.py (update update_job_status method)
from api.websocket import emit_job_update, emit_job_completed, emit_job_failed, emit_job_cancelled

async def update_job_status(
    self,
    db: AsyncSession,
    job_id: int,
    status: str,
    progress: Optional[int] = None,
    result: Optional[Dict[str, Any]] = None,
    error_message: Optional[str] = None
):
    """
    Update job status and emit WebSocket event

    Args:
        db: Database session
        job_id: Job ID
        status: New status (running, completed, failed, cancelled)
        progress: Progress percentage (0-100)
        result: Job result data
        error_message: Error message if failed
    """
    update_data = {"status": status}

    if progress is not None:
        update_data["progress"] = progress

    if result is not None:
        update_data["result"] = result

    if error_message is not None:
        update_data["error_message"] = error_message

    # Set timestamps based on status
    if status == "running" and not update_data.get("started_at"):
        update_data["started_at"] = datetime.utcnow()
    elif status in ("completed", "failed", "cancelled"):
        update_data["completed_at"] = datetime.utcnow()

    # Update database
    await db.execute(
        update(AgentJob)
        .where(AgentJob.id == job_id)
        .values(**update_data)
    )
    await db.commit()

    # Emit appropriate WebSocket event
    if status == "completed" and result:
        await emit_job_completed(job_id, result)
    elif status == "failed" and error_message:
        await emit_job_failed(job_id, error_message)
    elif status == "cancelled":
        await emit_job_cancelled(job_id)
    else:
        # Generic update
        await emit_job_update(job_id, {
            "status": status,
            "progress": progress or 0
        })

    logger.info(f"Job {job_id} updated: {status} ({progress}%)")
```

### Step 5: Frontend Integration (React Example)

```typescript
// src/lib/websocket.ts
import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

      this.socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('connected', (data) => {
        console.log('📡 Server acknowledged connection:', data);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Max reconnection attempts reached'));
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.warn('⚠️ WebSocket disconnected:', reason);
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToJob(
    jobId: number,
    onUpdate: (data: JobUpdate) => void
  ): () => void {
    if (!this.socket) {
      throw new Error('WebSocket not connected');
    }

    // Join job room
    this.socket.emit('join_job', { job_id: jobId });

    // Listen for updates
    const handleUpdate = (data: JobUpdate) => {
      if (data.job_id === jobId) {
        onUpdate(data);
      }
    };

    this.socket.on('job_update', handleUpdate);
    this.socket.on('job_status', handleUpdate);

    // Return cleanup function
    return () => {
      if (this.socket) {
        this.socket.emit('leave_job', { job_id: jobId });
        this.socket.off('job_update', handleUpdate);
        this.socket.off('job_status', handleUpdate);
      }
    };
  }

  ping(): void {
    if (this.socket) {
      this.socket.emit('ping');
      this.socket.once('pong', (data) => {
        console.log('🏓 Pong received:', data);
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const wsService = new WebSocketService();

export interface JobUpdate {
  job_id: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  result?: any;
  error?: string;
  timestamp: string;
}
```

```typescript
// src/hooks/useJobProgress.ts
import { useEffect, useState } from 'react';
import { wsService, JobUpdate } from '@/lib/websocket';
import { useAuth } from '@/hooks/useAuth';

export function useJobProgress(jobId: number | null) {
  const { token } = useAuth();
  const [jobData, setJobData] = useState<JobUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !jobId) return;

    let cleanup: (() => void) | null = null;

    // Connect to WebSocket
    wsService.connect(token).then(() => {
      setIsConnected(true);

      // Subscribe to job updates
      cleanup = wsService.subscribeToJob(jobId, (data) => {
        console.log('Job update:', data);
        setJobData(data);
      });
    }).catch((error) => {
      console.error('Failed to connect to WebSocket:', error);
      setIsConnected(false);
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [jobId, token]);

  return { jobData, isConnected };
}
```

```tsx
// src/components/JobProgressMonitor.tsx
import React from 'react';
import { useJobProgress } from '@/hooks/useJobProgress';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface JobProgressMonitorProps {
  jobId: number;
}

export function JobProgressMonitor({ jobId }: JobProgressMonitorProps) {
  const { jobData, isConnected } = useJobProgress(jobId);

  if (!isConnected) {
    return (
      <Alert>
        <AlertDescription>
          Connecting to real-time updates...
        </AlertDescription>
      </Alert>
    );
  }

  if (!jobData) {
    return (
      <Alert>
        <AlertDescription>
          Waiting for job updates...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Status: {jobData.status}
          </span>
          <span className="text-sm text-muted-foreground">
            {jobData.progress}%
          </span>
        </div>
        <Progress value={jobData.progress} />
      </div>

      {jobData.message && (
        <p className="text-sm text-muted-foreground">
          {jobData.message}
        </p>
      )}

      {jobData.status === 'completed' && jobData.result && (
        <Alert>
          <AlertDescription>
            ✅ Job completed successfully!
          </AlertDescription>
        </Alert>
      )}

      {jobData.status === 'failed' && jobData.error && (
        <Alert variant="destructive">
          <AlertDescription>
            ❌ Job failed: {jobData.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

## Testing

### 1. Test WebSocket Connection

```python
# test_websocket.py
import pytest
import socketio
import jwt
import os
from datetime import datetime, timedelta

@pytest.mark.asyncio
async def test_websocket_connection():
    # Create test token
    token = jwt.encode(
        {
            "sub": "1",
            "email": "test@example.com",
            "exp": datetime.utcnow() + timedelta(hours=1)
        },
        os.getenv("JWT_SECRET"),
        algorithm="HS256"
    )

    # Connect to WebSocket
    sio_client = socketio.AsyncClient()

    connected = False

    @sio_client.on('connected')
    async def on_connected(data):
        nonlocal connected
        connected = True
        print(f"Connected: {data}")

    await sio_client.connect(
        'http://localhost:8000',
        auth={'token': token},
        socketio_path='/socket.io'
    )

    await sio_client.sleep(1)
    assert connected

    await sio_client.disconnect()
```

### 2. Test Job Subscription

```bash
# Using wscat tool
npm install -g wscat

# Connect with token
wscat -c "ws://localhost:8000/socket.io/?EIO=4&transport=websocket" \
  --auth "token=YOUR_JWT_TOKEN"

# Subscribe to job
{"type": "event", "data": ["join_job", {"job_id": 123}]}

# You should receive job_update events as job progresses
```

### 3. Manual Testing with Frontend

```bash
# Start backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Start frontend
cd agentic-crm-template
npm run dev

# Create job and watch progress bar update in real-time
```

## Troubleshooting

### Issue: "WebSocket connection failed"

**Cause:** CORS or auth token issue

**Solution:**
```python
# Verify CORS origins include your frontend
cors_allowed_origins=[
    "http://localhost:5173",
    "https://your-netlify-site.netlify.app"
]

# Check token is valid
jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
```

### Issue: Events not received on frontend

**Cause:** Not joined to job room

**Solution:**
```typescript
// Ensure you join the room
socket.emit('join_job', { job_id: 123 });

// Listen for confirmation
socket.on('job_status', (data) => {
  console.log('Joined job room:', data);
});
```

### Issue: Connection drops frequently

**Cause:** Network issues or timeout

**Solution:**
```typescript
// Implement reconnection logic
const socket = io(wsUrl, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on('reconnect', (attempt) => {
  console.log(`Reconnected after ${attempt} attempts`);
  // Re-subscribe to jobs
});
```

## Performance Considerations

### 1. Limit Events per Second

```python
# api/websocket.py
import asyncio
from datetime import datetime

class RateLimiter:
    def __init__(self, max_per_second: int = 10):
        self.max_per_second = max_per_second
        self.events = []

    async def throttle(self):
        now = datetime.utcnow()
        self.events = [t for t in self.events if (now - t).total_seconds() < 1]

        if len(self.events) >= self.max_per_second:
            await asyncio.sleep(0.1)
            return await self.throttle()

        self.events.append(now)

rate_limiter = RateLimiter()

async def emit_job_update(job_id: int, data: Dict[str, Any]):
    await rate_limiter.throttle()
    # ... rest of emit logic
```

### 2. Batch Progress Updates

```python
# Only emit significant progress changes
async def update(self, progress: int, message: Optional[str] = None):
    # Only emit if progress changed by >= 5%
    if abs(progress - self.current_progress) < 5:
        return

    self.current_progress = progress
    await emit_job_progress(self.job_id, progress, message)
```

### 3. Clean Up Inactive Connections

```python
# Background task to clean up stale connections
import asyncio

async def cleanup_inactive_connections():
    while True:
        await asyncio.sleep(300)  # Every 5 minutes

        now = datetime.utcnow()
        stale_sids = []

        for sid, data in manager.active_connections.items():
            # Disconnect if inactive for 30+ minutes
            if (now - data['connected_at']).total_seconds() > 1800:
                stale_sids.append(sid)

        for sid in stale_sids:
            await sio.disconnect(sid)
            logger.info(f"Disconnected stale connection: {sid}")
```

## Next Steps

With WebSocket streaming implemented, proceed to:

1. **09_BUDGET_SYSTEM.md** - Cost tracking and budget enforcement
2. **10_JOB_QUEUE.md** - Advanced queue management with priorities

**Integration Complete:**
- Real-time progress updates ✅
- Job status streaming ✅
- Frontend hooks ready ✅
- Connection management ✅

**Production Checklist:**
- [ ] SSL/TLS configured for wss://
- [ ] Rate limiting implemented
- [ ] Reconnection logic tested
- [ ] Error handling verified
- [ ] Load testing completed
- [ ] Monitoring/alerting configured
