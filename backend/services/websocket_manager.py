"""
WebSocket Manager for Real-time Agent Updates
Emits progress updates as agents work
"""
import socketio
from typing import Dict, Any
from loguru import logger

# Create Socket.IO server
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

class WebSocketManager:
    """Manages WebSocket connections and broadcasts agent updates"""

    def __init__(self):
        self.sio = sio

    async def emit_job_created(self, job_id: str, job_data: Dict[str, Any]):
        """Emit when job is created"""
        await self.sio.emit('job_created', {
            'job_id': job_id,
            'agent_type': job_data.get('agent_type'),
            'status': 'queued',
            'timestamp': str(job_data.get('created_at'))
        })
        logger.info(f"WebSocket: Emitted job_created for {job_id}")

    async def emit_job_started(self, job_id: str, agent_type: str):
        """Emit when job starts execution"""
        await self.sio.emit('job_started', {
            'job_id': job_id,
            'agent_type': agent_type,
            'status': 'running',
            'message': f'🚀 {agent_type} agent starting...'
        })
        logger.info(f"WebSocket: Emitted job_started for {job_id}")

    async def emit_job_progress(self, job_id: str, progress: float, message: str):
        """Emit progress update"""
        await self.sio.emit('job_progress', {
            'job_id': job_id,
            'progress': progress,
            'message': message
        })
        logger.debug(f"WebSocket: Progress {job_id} - {progress}%: {message}")

    async def emit_job_thinking(self, job_id: str, thought: str):
        """Emit when agent is thinking/processing"""
        await self.sio.emit('job_thinking', {
            'job_id': job_id,
            'thought': thought,
            'icon': '🤔'
        })

    async def emit_job_streaming(self, job_id: str, chunk: str):
        """Emit streaming content chunks"""
        await self.sio.emit('job_streaming', {
            'job_id': job_id,
            'chunk': chunk
        })

    async def emit_job_completed(self, job_id: str, result: Dict[str, Any]):
        """Emit when job completes successfully"""
        await self.sio.emit('job_completed', {
            'job_id': job_id,
            'status': 'completed',
            'result': result,
            'message': '✅ Agent completed successfully!'
        })
        logger.info(f"WebSocket: Emitted job_completed for {job_id}")

    async def emit_job_failed(self, job_id: str, error: str):
        """Emit when job fails"""
        await self.sio.emit('job_failed', {
            'job_id': job_id,
            'status': 'failed',
            'error': error,
            'message': '❌ Agent failed'
        })
        logger.error(f"WebSocket: Emitted job_failed for {job_id}: {error}")


# Singleton instance
ws_manager = WebSocketManager()


# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    """Client connected"""
    logger.info(f"WebSocket client connected: {sid}")
    await sio.emit('welcome', {
        'message': '🎉 Connected to Agentic Marketing AI',
        'sid': sid
    })


@sio.event
async def disconnect(sid):
    """Client disconnected"""
    logger.info(f"WebSocket client disconnected: {sid}")
