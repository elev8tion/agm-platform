'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sparkles, Loader2, CheckCircle2, XCircle, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentMessage {
  id: string;
  type: 'thinking' | 'progress' | 'streaming' | 'completed' | 'failed';
  content: string;
  timestamp: Date;
  progress?: number;
}

interface AgentExecutionPanelProps {
  jobId?: string | null;
  agentType?: string;
  className?: string;
}

export function AgentExecutionPanel({ jobId, agentType, className }: AgentExecutionPanelProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Update ref when jobId changes
  useEffect(() => {
    currentJobIdRef.current = jobId;
  }, [jobId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect to WebSocket (only once)
  useEffect(() => {
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      setConnected(true);
      addMessage('thinking', '🎉 Connected to AI agent system');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      addMessage('failed', '⚠️ Disconnected from server');
    });

    newSocket.on('welcome', (data) => {
      addMessage('thinking', data.message);
    });

    newSocket.on('job_created', (data) => {
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        addMessage('thinking', `📋 Job queued: ${data.agent_type}`);
      }
    });

    newSocket.on('job_started', (data) => {
      console.log('🚀 job_started event received:', data);
      console.log('Current jobId ref:', currentJobIdRef.current);
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        console.log('✅ Job ID matches! Updating UI...');
        setCurrentStatus('running');
        addMessage('progress', data.message);
        setProgress(10);
      } else {
        console.log('❌ Job ID mismatch or no current job');
      }
    });

    newSocket.on('job_thinking', (data) => {
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        addMessage('thinking', `${data.icon} ${data.thought}`);
        setProgress(prev => Math.min(prev + 5, 80));
      }
    });

    newSocket.on('job_progress', (data) => {
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        addMessage('progress', data.message, data.progress);
        setProgress(data.progress);
      }
    });

    newSocket.on('job_streaming', (data) => {
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        addMessage('streaming', data.chunk);
        setProgress(prev => Math.min(prev + 2, 95));
      }
    });

    newSocket.on('job_completed', (data) => {
      console.log('✨ job_completed event received:', data);
      console.log('Current jobId ref:', currentJobIdRef.current);
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        console.log('✅ Job ID matches! Showing results...');
        setCurrentStatus('completed');
        setProgress(100);
        setResult(data.result);
        addMessage('completed', data.message);
      } else {
        console.log('❌ Job ID mismatch or no current job');
      }
    });

    newSocket.on('job_failed', (data) => {
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        setCurrentStatus('failed');
        addMessage('failed', `${data.message}: ${data.error}`);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addMessage = (type: AgentMessage['type'], content: string, progress?: number) => {
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        type,
        content,
        timestamp: new Date(),
        progress,
      },
    ]);
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'running':
        return 'border-blue-500/40 bg-blue-950/20';
      case 'completed':
        return 'border-green-500/40 bg-green-950/20';
      case 'failed':
        return 'border-red-500/40 bg-red-950/20';
      default:
        return 'border-white/10';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-brand" />;
    }
  };

  return (
    <Card className={cn('relative overflow-hidden', getStatusColor(), className)}>
      {/* Animated gradient background */}
      {currentStatus === 'running' && (
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient" />
        </div>
      )}

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {agentType ? `${agentType} Agent` : 'AI Agent Execution'}
              </h3>
              <p className="text-sm text-white/60">
                {connected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
          </div>

          {jobId && (
            <Badge variant="secondary" className="font-mono text-xs">
              {jobId.slice(0, 8)}
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        {currentStatus === 'running' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/80">Progress</span>
              <span className="text-brand font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out animate-shimmer"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages Feed */}
        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Result Display */}
        {result && currentStatus === 'completed' && (
          <div className="mt-4 p-4 bg-green-950/30 border border-green-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Agent Output
            </h4>
            <pre className="text-xs text-white/80 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && currentStatus === 'idle' && (
          <div className="text-center py-12 text-white/40">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Waiting for agent to start...</p>
            <p className="text-xs mt-1">Real-time updates will appear here</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const getIcon = () => {
    switch (message.type) {
      case 'thinking':
        return <Brain className="h-4 w-4 text-purple-400" />;
      case 'progress':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case 'streaming':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case 'thinking':
        return 'bg-purple-950/30 border-purple-500/20';
      case 'progress':
        return 'bg-blue-950/30 border-blue-500/20';
      case 'streaming':
        return 'bg-yellow-950/30 border-yellow-500/20';
      case 'completed':
        return 'bg-green-950/30 border-green-500/20';
      case 'failed':
        return 'bg-red-950/30 border-red-500/20';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border animate-in slide-in-from-bottom-2 duration-300',
        getBgColor()
      )}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 break-words">{message.content}</p>
        <p className="text-xs text-white/40 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
        {message.progress !== undefined && (
          <div className="mt-2 text-xs text-white/60">
            Progress: {Math.round(message.progress)}%
          </div>
        )}
      </div>
    </div>
  );
}
