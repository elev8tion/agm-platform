"""
WebSocket Manager - Socket.IO server for real-time updates
"""
import socketio
from typing import Dict, Any, Optional, Set
from loguru import logger
import jwt
import os
from datetime import datetime

from config.database import AsyncSessionLocal
from models.agent_job import AgentJob
from sqlalchemy import select


# Create Socket.io server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
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
        self.job_subscribers: Dict[str, Set[str]] = {}

    async def connect(
        self,
        sid: str,
        user_id: str,
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
        job_id: str
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
        job_id: str
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

    def get_user_id(self, sid: str) -> Optional[str]:
        """Get user ID for connection"""
        if sid in self.active_connections:
            return self.active_connections[sid]["user_id"]
        return None

    def get_connection_count(self) -> int:
        """Get total active connections"""
        return len(self.active_connections)

    def get_job_subscriber_count(self, job_id: str) -> int:
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
        # For development, allow connections without auth
        if not auth or "token" not in auth:
            logger.info(f"Development connection (no auth): {sid}")
            await manager.connect(sid, "dev-user", "dev@example.com")

            # Emit welcome message to match frontend expectations
            await sio.emit('welcome', {
                'message': 'Welcome to Agentic Marketing AI',
                'sid': sid
            }, room=sid)

            return True

        token = auth["token"]
        payload = jwt.decode(
            token,
            os.getenv("JWT_SECRET", "dev-secret-key"),
            algorithms=["HS256"]
        )

        user_id = payload.get("sub")
        user_email = payload.get("email")

        if not user_id:
            logger.warning(f"Connection rejected: Invalid token")
            await sio.disconnect(sid)
            return False

        # Register connection
        await manager.connect(sid, user_id, user_email or "unknown")

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
        "job_id": "job-uuid-123"
    }
    """
    try:
        job_id = data.get("job_id")

        if not job_id:
            await sio.emit('error', {
                'message': 'job_id is required'
            }, room=sid)
            return

        # Verify user owns this job (skip in dev mode)
        user_id = manager.get_user_id(sid)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AgentJob).where(AgentJob.id == job_id)
            )
            job = result.scalar_one_or_none()

            if not job:
                await sio.emit('error', {
                    'message': f'Job {job_id} not found'
                }, room=sid)
                return

            # Join room
            await manager.join_job_room(sid, job_id)

            # Send current job status
            await sio.emit('job_status', {
                'job_id': job.id,
                'status': str(job.status.value),
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
        "job_id": "job-uuid-123"
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
    job_id: str,
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
    job_id: str,
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
    job_id: str,
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
    job_id: str,
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
    job_id: str
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
