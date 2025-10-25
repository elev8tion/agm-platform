# Streaming UI - Real-time Agent Output Display

## Overview

The Streaming UI system provides real-time visualization of agent activity, showing thinking processes, progress, and output as it happens. Users see live updates with smooth animations, creating an engaging experience that builds trust in the AI agents.

**Key Features:**
- Streaming text output with typewriter effect
- Real-time progress bars with smooth animations
- Token usage meter with live updates
- Agent status indicators with pulsing animations
- Scrolling behavior with auto-scroll and manual control
- Pause/Resume streaming controls
- Syntax highlighting for code output
- Accessibility with screen reader support

## Prerequisites

**Required Phases:**
- Phase 5.1: WebSocket client ([23_WEBSOCKET_CLIENT.md](./23_WEBSOCKET_CLIENT.md))
- Phase 2: UI components and design system
- Phase 3: Agent architecture

**Dependencies:**
```json
{
  "framer-motion": "^10.16.16",
  "react-markdown": "^9.0.1",
  "react-syntax-highlighter": "^15.5.0",
  "zustand": "^4.4.7"
}
```

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────┐
│         JobExecutionPanel               │
│  ┌───────────────────────────────────┐  │
│  │     StreamingOutput               │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │   OutputChunk (animated)    │  │  │
│  │  │   OutputChunk (animated)    │  │  │
│  │  │   OutputChunk (typing...)   │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │       ProgressBar                 │  │
│  │  [████████░░░░░░░░] 65%          │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │       AgentStatus                 │  │
│  │  🟢 Writing... │ Tokens: 1,234    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │       StreamControls              │  │
│  │  [Pause] [Clear] [Download]       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Complete Implementation

### Streaming Output Component

```typescript
// components/streaming/StreamingOutput.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJobProgress } from '@/lib/websocket/hooks/useJobProgress';
import { JobOutputEvent } from '@/lib/websocket/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Pause, Play, Download, Trash2, ArrowDown } from 'lucide-react';

interface StreamingOutputProps {
  jobId: string;
  className?: string;
  maxHeight?: string;
  showControls?: boolean;
  autoScroll?: boolean;
}

interface OutputChunk {
  id: string;
  text: string;
  type: 'thinking' | 'writing' | 'tool_call' | 'result';
  timestamp: number;
  isComplete: boolean;
}

export function StreamingOutput({
  jobId,
  className = '',
  maxHeight = '600px',
  showControls = true,
  autoScroll: initialAutoScroll = true,
}: StreamingOutputProps) {
  const { output, isRunning, status } = useJobProgress(jobId);
  const [chunks, setChunks] = useState<OutputChunk[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef(0);
  const bufferRef = useRef<string[]>([]);

  // Process output chunks
  useEffect(() => {
    if (isPaused || output.length === 0) return;

    // Convert raw output to structured chunks
    const newChunks: OutputChunk[] = output.map((text, index) => ({
      id: `chunk-${index}`,
      text,
      type: detectChunkType(text),
      timestamp: Date.now() + index,
      isComplete: true,
    }));

    setChunks(newChunks);
  }, [output, isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current && isRunning) {
      const scrollElement = scrollRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [chunks, autoScroll, isRunning]);

  // Detect scroll position
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setShowScrollButton(!isAtBottom);

    // Disable auto-scroll if user scrolls up
    if (scrollTop < lastScrollTop.current && autoScroll) {
      setAutoScroll(false);
    }

    lastScrollTop.current = scrollTop;
  }, [autoScroll]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setAutoScroll(true);
    }
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const clearOutput = useCallback(() => {
    setChunks([]);
    bufferRef.current = [];
  }, []);

  const downloadOutput = useCallback(() => {
    const text = chunks.map((chunk) => chunk.text).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-output-${jobId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [chunks, jobId]);

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              disabled={!isRunning}
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={clearOutput}
              disabled={chunks.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={downloadOutput}
              disabled={chunks.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{chunks.length} chunks</span>
            <span>•</span>
            <span>
              {chunks.reduce((sum, c) => sum + c.text.length, 0).toLocaleString()}{' '}
              characters
            </span>
          </div>
        </div>
      )}

      {/* Output Display */}
      <div className="relative">
        <ScrollArea
          ref={scrollRef}
          className="rounded-lg border bg-background"
          style={{ height: maxHeight }}
          onScroll={handleScroll}
        >
          <div className="p-4 space-y-4">
            <AnimatePresence mode="popLayout">
              {chunks.map((chunk, index) => (
                <OutputChunk
                  key={chunk.id}
                  chunk={chunk}
                  index={index}
                  isLatest={index === chunks.length - 1 && isRunning}
                />
              ))}
            </AnimatePresence>

            {chunks.length === 0 && (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                {isRunning ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span>Waiting for agent output...</span>
                  </div>
                ) : (
                  <span>No output yet</span>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 right-4"
            >
              <Button
                size="sm"
                variant="secondary"
                className="shadow-lg"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Scroll to bottom
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live region for screen readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isRunning && chunks.length > 0 && (
          <span>Agent is {status}. {chunks.length} outputs received.</span>
        )}
      </div>
    </div>
  );
}

// Individual output chunk with animations
function OutputChunk({
  chunk,
  index,
  isLatest,
}: {
  chunk: OutputChunk;
  index: number;
  isLatest: boolean;
}) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(isLatest);

  // Typewriter effect for latest chunk
  useEffect(() => {
    if (!isLatest) {
      setDisplayText(chunk.text);
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    setIsTyping(true);

    const interval = setInterval(() => {
      if (currentIndex <= chunk.text.length) {
        setDisplayText(chunk.text.slice(0, currentIndex));
        currentIndex += 3; // Type 3 characters at a time for speed
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20); // 20ms per update = smooth typing

    return () => clearInterval(interval);
  }, [chunk.text, isLatest]);

  const bgColor = {
    thinking: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    writing: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    tool_call: 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
    result: 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800',
  }[chunk.type];

  const icon = {
    thinking: '🤔',
    writing: '✍️',
    tool_call: '🔧',
    result: '✅',
  }[chunk.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-lg border p-4 ${bgColor}`}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayText}
            </ReactMarkdown>
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 ml-1 bg-current"
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Detect chunk type from content
function detectChunkType(
  text: string
): 'thinking' | 'writing' | 'tool_call' | 'result' {
  if (text.includes('[THINKING]') || text.includes('analyzing')) {
    return 'thinking';
  }
  if (text.includes('[TOOL_CALL]') || text.includes('Calling')) {
    return 'tool_call';
  }
  if (text.includes('[RESULT]') || text.includes('Completed')) {
    return 'result';
  }
  return 'writing';
}
```

### Progress Bar Component

```typescript
// components/streaming/ProgressBar.tsx

'use client';

import { motion } from 'framer-motion';
import { useJobProgress } from '@/lib/websocket/hooks/useJobProgress';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ProgressBarProps {
  jobId: string;
  showDetails?: boolean;
  className?: string;
}

export function ProgressBar({
  jobId,
  showDetails = true,
  className = '',
}: ProgressBarProps) {
  const {
    progress,
    currentStep,
    status,
    estimatedCompletion,
    duration,
  } = useJobProgress(jobId);

  const statusConfig = {
    queued: {
      color: 'bg-gray-500',
      icon: Clock,
      label: 'Queued',
    },
    running: {
      color: 'bg-blue-500',
      icon: Loader2,
      label: 'Running',
    },
    completed: {
      color: 'bg-green-500',
      icon: CheckCircle2,
      label: 'Completed',
    },
    failed: {
      color: 'bg-red-500',
      icon: XCircle,
      label: 'Failed',
    },
    cancelled: {
      color: 'bg-gray-500',
      icon: XCircle,
      label: 'Cancelled',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={className}>
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${config.color} relative`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
          >
            {/* Shimmer effect */}
            {status === 'running' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            )}
          </motion.div>
        </div>

        {/* Percentage Label */}
        <div className="absolute -top-6 left-0 right-0 flex items-center justify-between text-sm">
          <span className="font-medium">{Math.round(progress)}%</span>
          {estimatedCompletion && status === 'running' && (
            <span className="text-muted-foreground">
              ~{Math.round(estimatedCompletion)}s remaining
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon
              className={`h-4 w-4 ${
                status === 'running' ? 'animate-spin' : ''
              }`}
            />
            <span className="font-medium">{config.label}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{currentStep}</span>
          </div>

          {duration > 0 && (
            <span className="text-muted-foreground">
              {formatDuration(duration)}
            </span>
          )}
        </div>
      )}

      {/* Step Indicators */}
      {showDetails && status === 'running' && (
        <div className="mt-4 flex items-center gap-2">
          {['Initializing', 'Processing', 'Finalizing'].map((step, index) => {
            const stepProgress = (index + 1) * 33.33;
            const isActive = progress >= stepProgress - 33.33;
            const isComplete = progress >= stepProgress;

            return (
              <div key={step} className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isComplete
                        ? 'bg-green-500'
                        : isActive
                        ? 'bg-blue-500 animate-pulse'
                        : 'bg-muted'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}
```

### Token Meter Component

```typescript
// components/streaming/TokenMeter.tsx

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { BudgetUpdatedEvent } from '@/lib/websocket/types';
import { DollarSign, Zap } from 'lucide-react';

interface TokenMeterProps {
  jobId?: string;
  showCost?: boolean;
  className?: string;
}

export function TokenMeter({
  jobId,
  showCost = true,
  className = '',
}: TokenMeterProps) {
  const { subscribe } = useWebSocket();
  const [tokens, setTokens] = useState({ input: 0, output: 0 });
  const [cost, setCost] = useState(0);

  useEffect(() => {
    const unsub = subscribe('budget:updated', (data: BudgetUpdatedEvent) => {
      // Extract token usage from budget update
      // This would be sent from the backend
      setCost(data.used);
    });

    return unsub;
  }, [subscribe]);

  const totalTokens = tokens.input + tokens.output;
  const inputPercentage = totalTokens > 0 ? (tokens.input / totalTokens) * 100 : 0;
  const outputPercentage = totalTokens > 0 ? (tokens.output / totalTokens) * 100 : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Token Usage Bar */}
      <div>
        <div className="flex items-center justify-between mb-2 text-sm">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Token Usage</span>
          </div>
          <span className="text-muted-foreground">
            {totalTokens.toLocaleString()} tokens
          </span>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${inputPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${outputPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>Input: {tokens.input.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>Output: {tokens.output.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Cost */}
      {showCost && (
        <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">Estimated Cost</span>
          </div>
          <motion.span
            key={cost}
            initial={{ scale: 1.2, color: '#10b981' }}
            animate={{ scale: 1, color: 'inherit' }}
            className="font-mono"
          >
            ${cost.toFixed(4)}
          </motion.span>
        </div>
      )}
    </div>
  );
}
```

### Agent Status Component

```typescript
// components/streaming/AgentStatus.tsx

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { AgentStatusEvent, AgentType, AgentStatus } from '@/lib/websocket/types';
import { Bot, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface AgentStatusProps {
  agentType: AgentType;
  showQueue?: boolean;
  className?: string;
}

const agentLabels: Record<AgentType, string> = {
  cmo: 'Chief Marketing Officer',
  seo_writer: 'SEO Writer',
  email_marketer: 'Email Marketer',
  social_media_manager: 'Social Media Manager',
  analytics_specialist: 'Analytics Specialist',
};

export function AgentStatus({
  agentType,
  showQueue = true,
  className = '',
}: AgentStatusProps) {
  const { subscribe, joinRoom, leaveRoom } = useWebSocket();
  const [status, setStatus] = useState<AgentStatus>('ready');
  const [currentJob, setCurrentJob] = useState<string | null>(null);
  const [queueDepth, setQueueDepth] = useState(0);

  useEffect(() => {
    const room = `agent:${agentType}`;
    joinRoom(room);

    const unsub = subscribe('agent:status', (data: AgentStatusEvent) => {
      if (data.agentType === agentType) {
        setStatus(data.status);
        setCurrentJob(data.currentJob || null);
        setQueueDepth(data.queueDepth || 0);
      }
    });

    return () => {
      leaveRoom(room);
      unsub();
    };
  }, [agentType, subscribe, joinRoom, leaveRoom]);

  const statusConfig = {
    ready: {
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      icon: CheckCircle2,
      label: 'Ready',
      pulse: false,
    },
    busy: {
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      icon: Loader2,
      label: 'Working',
      pulse: true,
    },
    error: {
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      icon: AlertCircle,
      label: 'Error',
      pulse: false,
    },
    offline: {
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      icon: AlertCircle,
      label: 'Offline',
      pulse: false,
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${className}`}>
      {/* Status Indicator */}
      <div className="relative">
        <div className={`p-3 rounded-full ${config.bgColor}`}>
          <Icon
            className={`h-5 w-5 ${config.color} ${
              status === 'busy' ? 'animate-spin' : ''
            }`}
          />
        </div>

        {/* Pulsing ring */}
        {config.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.bgColor} opacity-75`}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Agent Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium truncate">{agentLabels[agentType]}</h3>
        </div>

        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span className={config.color}>{config.label}</span>
          {currentJob && (
            <>
              <span>•</span>
              <span className="truncate">{currentJob}</span>
            </>
          )}
        </div>

        {/* Queue Depth */}
        {showQueue && queueDepth > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {queueDepth} {queueDepth === 1 ? 'job' : 'jobs'} in queue
          </div>
        )}
      </div>
    </div>
  );
}
```

## Animation Utilities

```typescript
// lib/animations/streaming.ts

import { Variants } from 'framer-motion';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const slideIn: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(59, 130, 246, 0.7)',
      '0 0 0 10px rgba(59, 130, 246, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
    },
  },
};

export const typewriter = {
  hidden: { width: 0 },
  visible: {
    width: '100%',
    transition: {
      duration: 2,
      ease: 'linear',
    },
  },
};
```

## Accessibility

### Screen Reader Support

```typescript
// components/streaming/AccessibleStreamingOutput.tsx

import { useEffect, useRef } from 'react';
import { useJobProgress } from '@/lib/websocket/hooks/useJobProgress';

export function StreamingAccessibility({ jobId }: { jobId: string }) {
  const { progress, currentStep, status, output } = useJobProgress(jobId);
  const announcementRef = useRef<HTMLDivElement>(null);
  const lastProgressRef = useRef(0);

  // Announce progress milestones
  useEffect(() => {
    if (Math.floor(progress / 25) > Math.floor(lastProgressRef.current / 25)) {
      announce(`Progress: ${Math.round(progress)}%. ${currentStep}`);
    }
    lastProgressRef.current = progress;
  }, [progress, currentStep]);

  // Announce completion
  useEffect(() => {
    if (status === 'completed') {
      announce('Job completed successfully');
    } else if (status === 'failed') {
      announce('Job failed');
    }
  }, [status]);

  const announce = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
  };

  return (
    <div
      ref={announcementRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
```

## Performance

### Optimization Techniques

```typescript
// Use virtualization for long output lists
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedStreamingOutput({ chunks }: { chunks: OutputChunk[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: chunks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <OutputChunk chunk={chunks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Error Handling

```typescript
// Handle streaming errors gracefully
export function StreamingErrorBoundary({ children, jobId }: PropsWithChildren<{ jobId: string }>) {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="font-medium text-red-900">Streaming Error</h3>
        <p className="text-sm text-red-700 mt-1">{error.message}</p>
        <Button
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => setError(null)}
        >
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
```

## Testing

```typescript
// __tests__/components/streaming/StreamingOutput.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { StreamingOutput } from '@/components/streaming/StreamingOutput';

describe('StreamingOutput', () => {
  it('renders streaming chunks', async () => {
    render(<StreamingOutput jobId="job123" />);

    await waitFor(() => {
      expect(screen.getByText(/Waiting for agent output/i)).toBeInTheDocument();
    });
  });

  it('displays typewriter effect for latest chunk', async () => {
    render(<StreamingOutput jobId="job123" />);

    // Mock streaming event
    // (Would trigger through WebSocket mock)

    await waitFor(() => {
      expect(screen.getByText(/typing/i)).toBeInTheDocument();
    });
  });
});
```

## Troubleshooting

**Issue**: Jerky animations
```typescript
// Use CSS transforms instead of layout properties
<motion.div
  style={{ transform: `translateY(${offset}px)` }}
  // Instead of: style={{ top: `${offset}px` }}
/>
```

**Issue**: Memory leaks with long streams
```typescript
// Limit buffer size
const MAX_CHUNKS = 1000;
setChunks(prev => prev.slice(-MAX_CHUNKS));
```

## Next Steps

**Phase 5 Continuation:**
- [25_NOTIFICATIONS.md](./25_NOTIFICATIONS.md) - Toast notification system
- [26_BUDGET_MONITOR.md](./26_BUDGET_MONITOR.md) - Real-time budget tracking
- [27_LIVE_UPDATES.md](./27_LIVE_UPDATES.md) - Live UI synchronization
