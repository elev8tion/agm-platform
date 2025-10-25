# Phase 3.4: Agent Job Components

## Overview

Agent Job components display real-time AI agent execution status, streaming output, progress tracking, and job history. These components handle WebSocket connections for live updates and provide controls for managing running jobs.

## Prerequisites

- **Phase 3.1-3.3 Complete**: Types, Content Asset, and Campaign components
- **WebSocket Support**: For real-time job updates
- **Dependencies**: date-fns, lucide-react

## Component Design

### Visual Specifications

**Job Status Colors:**
- `pending`: Slate 400 (queued, not started)
- `running`: Indigo 500 (actively executing, pulsing)
- `completed`: Emerald 500 (successful)
- `failed`: Red 500 (error occurred)
- `cancelled`: Amber 500 (user cancelled)

**Progress Indicators:**
- Animated progress bar with gradient
- Percentage display (0-100%)
- Current step indicator
- Estimated time remaining
- Cost tracking in real-time

**Streaming Output:**
- Terminal-style display
- Auto-scroll to latest output
- Syntax highlighting for code
- Collapsible sections

## Component Tree

```
AgentJobCard (Client)
├── JobStatusBadge (Server)
├── JobProgressBar (Client)
├── AgentTypeIcon (Server)
└── JobActions (Client)

JobProgressBar (Client)
├── AnimatedBar (Client)
├── PercentageDisplay (Server)
└── EstimateDisplay (Server)

JobStreamingOutput (Client - WebSocket)
├── OutputLine[] (Server)
├── AutoScrollContainer (Client)
└── CodeHighlight (Server)

JobHistoryList (Server)
├── JobHistoryCard[] (Client)
├── FilterControls (Client)
└── TimelineView (Server)
```

## Complete Implementation

### components/agent-jobs/JobStatusBadge.tsx

```typescript
/**
 * JobStatusBadge Component (Server Component)
 */

import { JobStatus } from '@/types';
import { Circle, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig = {
  [JobStatus.PENDING]: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    showPulse: false
  },
  [JobStatus.RUNNING]: {
    label: 'Running',
    icon: Circle,
    className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    showPulse: true
  },
  [JobStatus.COMPLETED]: {
    label: 'Completed',
    icon: CheckCircle,
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    showPulse: false
  },
  [JobStatus.FAILED]: {
    label: 'Failed',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    showPulse: false
  },
  [JobStatus.CANCELLED]: {
    label: 'Cancelled',
    icon: Ban,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    showPulse: false
  }
};

export function JobStatusBadge({ status, className = '' }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.className} ${className}
      `}
    >
      {config.showPulse ? (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      ) : (
        <Icon className="w-3 h-3 mr-1.5" />
      )}
      {config.label}
    </span>
  );
}
```

### components/agent-jobs/JobProgressBar.tsx

```typescript
'use client';

/**
 * JobProgressBar Component (Client Component)
 * Animated progress bar with percentage and estimate
 */

import { AgentJob } from '@/types';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobProgressBarProps {
  job: AgentJob;
  showPercentage?: boolean;
  showEstimate?: boolean;
  className?: string;
}

export function JobProgressBar({
  job,
  showPercentage = true,
  showEstimate = true,
  className = ''
}: JobProgressBarProps) {
  const percentage = job.progress?.percentage || 0;
  const currentStep = job.progress?.current_step;
  const completedSteps = job.progress?.completed_steps || 0;
  const totalSteps = job.progress?.total_steps || 0;

  const getEstimate = () => {
    if (!job.estimated_completion_at) return null;
    const estimate = new Date(job.estimated_completion_at);
    return formatDistanceToNow(estimate, { addSuffix: true });
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {showPercentage && (
            <span className="text-sm font-medium text-slate-300">
              {percentage.toFixed(0)}%
            </span>
          )}
          {currentStep && (
            <span className="text-xs text-slate-400">
              {currentStep}
            </span>
          )}
        </div>

        {totalSteps > 0 && (
          <span className="text-xs text-slate-400">
            {completedSteps}/{totalSteps} steps
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Estimate */}
      {showEstimate && getEstimate() && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>Completes {getEstimate()}</span>
        </div>
      )}
    </div>
  );
}
```

### components/agent-jobs/AgentJobCard.tsx

```typescript
'use client';

/**
 * AgentJobCard Component (Client Component)
 */

import { AgentJob, AgentType, JobActionType } from '@/types';
import { JobStatusBadge } from './JobStatusBadge';
import { JobProgressBar } from './JobProgressBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Ban, RotateCcw, Eye, DollarSign, FileText, Mail, BarChart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentJobCardProps {
  job: AgentJob;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  onViewOutput?: (id: string) => void;
  showOutput?: boolean;
}

const agentIcons = {
  [AgentType.SEO_WRITER]: FileText,
  [AgentType.EMAIL_MARKETER]: Mail,
  [AgentType.CMO]: BarChart
};

export function AgentJobCard({
  job,
  onCancel,
  onRetry,
  onViewOutput,
  showOutput = false
}: AgentJobCardProps) {
  const AgentIcon = agentIcons[job.agent_type];
  const canCancel = job.status === 'running' || job.status === 'pending';
  const canRetry = job.status === 'failed';

  const getActionLabel = (action: JobActionType): string => {
    const labels: Record<JobActionType, string> = {
      [JobActionType.RESEARCH]: 'Research',
      [JobActionType.WRITE]: 'Write Article',
      [JobActionType.OPTIMIZE]: 'Optimize Content',
      [JobActionType.CREATE_EMAIL]: 'Create Email',
      [JobActionType.CREATE_SERIES]: 'Create Email Series',
      [JobActionType.ANALYZE]: 'Analyze Performance',
      [JobActionType.REVIEW]: 'Review Performance'
    };
    return labels[action] || action;
  };

  return (
    <Card
      className={`
        transition-all duration-200
        ${job.status === 'running' ? 'border-indigo-500/50 shadow-indigo-500/10 shadow-lg' : ''}
        ${job.status === 'failed' ? 'border-red-500/50' : ''}
        ${job.status === 'completed' ? 'border-emerald-500/50' : ''}
      `}
      status={
        job.status === 'completed' ? 'success' :
        job.status === 'failed' ? 'error' :
        'default'
      }
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <AgentIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-100 mb-1">
                {getActionLabel(job.action_type)}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="capitalize">{job.agent_type.replace('_', ' ')}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Input Preview */}
        {job.input_params && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Input</div>
            <div className="text-sm text-slate-300 line-clamp-2">
              {job.input_params.topic || job.input_params.brief || job.input_params.url || 'Processing...'}
            </div>
          </div>
        )}

        {/* Progress */}
        {(job.status === 'running' || job.status === 'pending') && (
          <JobProgressBar job={job} className="mb-4" />
        )}

        {/* Cost */}
        {job.cost && job.cost.total_cost_usd > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div className="flex-1">
              <div className="text-xs text-slate-400">Cost</div>
              <div className="text-sm font-medium text-slate-300">
                ${job.cost.total_cost_usd.toFixed(4)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Tokens</div>
              <div className="text-xs text-slate-500">
                {(job.cost.input_tokens + job.cost.output_tokens).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error_message && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="text-xs text-red-400 mb-1">Error</div>
            <div className="text-sm text-red-300">{job.error_message}</div>
          </div>
        )}

        {/* Result Link */}
        {job.status === 'completed' && job.result_content_asset_id && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-400 mb-1">Result</div>
            <a
              href={`/content-assets/${job.result_content_asset_id}`}
              className="text-sm text-emerald-300 hover:text-emerald-200 underline"
            >
              View created content →
            </a>
          </div>
        )}

        {/* Timing */}
        {job.started_at && (
          <div className="text-xs text-slate-500 mb-4">
            {job.status === 'running' && `Started ${formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}`}
            {job.status === 'completed' && job.completed_at && (
              `Completed in ${Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)}s`
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
          {onViewOutput && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewOutput(job.id)}
              icon={<Eye className="w-4 h-4" />}
            >
              View Output
            </Button>
          )}

          {canCancel && onCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(job.id)}
              icon={<Ban className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}

          {canRetry && onRetry && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onRetry(job.id)}
              icon={<RotateCcw className="w-4 h-4" />}
            >
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### components/agent-jobs/JobStreamingOutput.tsx

```typescript
'use client';

/**
 * JobStreamingOutput Component (Client Component)
 * Real-time streaming output via WebSocket
 */

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Terminal } from 'lucide-react';

interface JobStreamingOutputProps {
  jobId: string;
  autoScroll?: boolean;
  className?: string;
}

interface OutputLine {
  timestamp: string;
  content: string;
  type: 'stdout' | 'stderr' | 'info' | 'error';
}

export function JobStreamingOutput({
  jobId,
  autoScroll = true,
  className = ''
}: JobStreamingOutputProps) {
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [connected, setConnected] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/jobs/${jobId}/stream`);

    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to job stream');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLines((prev) => [...prev, data]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Disconnected from job stream');
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [jobId]);

  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, autoScroll]);

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-400';
      case 'stderr':
        return 'text-amber-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <Card className={className}>
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-medium text-slate-300">Agent Output</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`
              inline-flex h-2 w-2 rounded-full
              ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}
            `}
          />
          <span className="text-xs text-slate-400">
            {connected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div
        ref={outputRef}
        className="h-96 overflow-y-auto bg-slate-950 font-mono text-xs p-4 space-y-1"
      >
        {lines.length === 0 && (
          <div className="text-slate-500 italic">
            Waiting for output...
          </div>
        )}

        {lines.map((line, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-slate-600 select-none shrink-0">
              {new Date(line.timestamp).toLocaleTimeString()}
            </span>
            <span className={`${getLineColor(line.type)} whitespace-pre-wrap break-words flex-1`}>
              {line.content}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### components/agent-jobs/JobHistoryList.tsx

```typescript
/**
 * JobHistoryList Component (Server Component)
 */

import { AgentJob } from '@/types';
import { AgentJobCard } from './AgentJobCard';
import { History } from 'lucide-react';

interface JobHistoryListProps {
  jobs: AgentJob[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function JobHistoryList({
  jobs,
  loading = false,
  emptyMessage = 'No job history yet.',
  onLoadMore,
  hasMore = false
}: JobHistoryListProps) {
  // Empty state
  if (!loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <History className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Jobs Yet</h3>
        <p className="text-sm text-slate-400 text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Loading skeleton
  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div
            key={idx}
            className="h-48 rounded-lg bg-slate-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="space-y-4">
        {jobs.map((job, idx) => (
          <div key={job.id} className="relative">
            {/* Timeline connector */}
            {idx < jobs.length - 1 && (
              <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-slate-800 -z-10" />
            )}

            <AgentJobCard job={job} showOutput={false} />
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### hooks/useJobStream.ts

```typescript
'use client';

/**
 * Custom hook for WebSocket job streaming
 */

import { useEffect, useState, useRef } from 'react';

interface JobStreamMessage {
  type: 'progress' | 'output' | 'complete' | 'error';
  payload: any;
}

export function useJobStream(jobId: string) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>();
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [isComplete, setIsComplete] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket>();

  useEffect(() => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/jobs/${jobId}/stream`);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const message: JobStreamMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'progress':
          setProgress(message.payload.percentage);
          setCurrentStep(message.payload.current_step);
          break;

        case 'output':
          setOutput((prev) => [...prev, message.payload.content]);
          break;

        case 'complete':
          setIsComplete(true);
          setProgress(100);
          break;

        case 'error':
          setError(message.payload.error);
          break;
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [jobId]);

  return {
    progress,
    currentStep,
    output,
    error,
    isComplete,
    isConnected
  };
}
```

## Styling

Custom CSS for animations:

```css
/* globals.css */

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

## Accessibility

- Progress bars have `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Live regions for streaming output (`aria-live="polite"`)
- Status updates announced to screen readers
- Keyboard controls for cancel/retry actions
- Focus management in modal/streaming views

## Usage Examples

```typescript
// app/jobs/[id]/page.tsx
import { JobStreamingOutput } from '@/components/agent-jobs/JobStreamingOutput';
import { AgentJobCard } from '@/components/agent-jobs/AgentJobCard';

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const response = await fetch(`/api/jobs/${params.id}`);
  const job = await response.json();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <AgentJobCard job={job} showOutput={true} />
      {job.status === 'running' && (
        <JobStreamingOutput jobId={params.id} />
      )}
    </div>
  );
}
```

## Testing

```typescript
// __tests__/JobProgressBar.test.tsx
import { render, screen } from '@testing-library/react';
import { JobProgressBar } from '@/components/agent-jobs/JobProgressBar';
import { JobStatus } from '@/types';

describe('JobProgressBar', () => {
  const mockJob = {
    id: '123',
    status: JobStatus.RUNNING,
    progress: {
      percentage: 45,
      current_step: 'Writing outline',
      completed_steps: 2,
      total_steps: 5
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  it('displays correct percentage', () => {
    render(<JobProgressBar job={mockJob} />);
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('shows current step', () => {
    render(<JobProgressBar job={mockJob} />);
    expect(screen.getByText('Writing outline')).toBeInTheDocument();
  });

  it('displays step progress', () => {
    render(<JobProgressBar job={mockJob} />);
    expect(screen.getByText('2/5 steps')).toBeInTheDocument();
  });
});
```

## Troubleshooting

**Issue: WebSocket not connecting**
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify WebSocket server is running
- Check browser console for connection errors

**Issue: Progress not updating**
- Ensure job ID is correct
- Verify WebSocket messages are being sent from backend
- Check for JavaScript errors in console

**Issue: Auto-scroll not working**
- Ensure `autoScroll` prop is true
- Check that `outputRef` is attached to correct element
- Verify `useEffect` dependency array includes `lines`

## Next Steps

Proceed to:
- **Document 15**: Agent Control Panel
- **Document 16**: Dashboard Layout
