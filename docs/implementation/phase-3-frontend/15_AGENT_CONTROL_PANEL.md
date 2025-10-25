# Phase 3.5: Agent Control Panel

## Overview

The Agent Control Panel provides a unified interface for interacting with all three AI marketing agents (SEO Writer, Email Marketer, CMO). Each agent has dedicated action panels with quick forms and status indicators.

## Prerequisites

- **Phase 3.1-3.4 Complete**: All foundational components ready
- **Agent API Endpoints**: Backend routes for agent actions
- **Real-time Updates**: WebSocket or polling for agent status

## Component Design

### Visual Specifications

**Agent State Colors:**
- `ready`: Emerald 500 (available for new jobs)
- `busy`: Indigo 500 (pulsing, currently executing)
- `idle`: Slate 500 (no recent activity)
- `error`: Red 500 (last job failed)

**Panel Layout:**
- Card-based design for each agent
- Quick action buttons prominently displayed
- Collapsible input forms
- Active job indicators
- Stats summary (jobs completed, total cost)

**Agent Icons:**
- SEO Writer: FileText (blue-themed)
- Email Marketer: Mail (purple-themed)
- CMO: BarChart (green-themed)

## Component Tree

```
AgentControlPanel (Client)
├── AgentStatusOverview (Server)
├── SEOAgentPanel (Client)
├── EmailAgentPanel (Client)
└── CMOAgentPanel (Client)

SEOAgentPanel (Client)
├── AgentCard (Server)
├── ResearchForm (Client)
├── WriteForm (Client)
├── OptimizeForm (Client)
└── ActiveJobDisplay (Client)

EmailAgentPanel (Client)
├── AgentCard (Server)
├── CreateEmailForm (Client)
├── CreateSeriesForm (Client)
└── ActiveJobDisplay (Client)

CMOAgentPanel (Client)
├── AgentCard (Server)
├── AnalyzeForm (Client)
├── ReviewForm (Client)
└── ActiveJobDisplay (Client)
```

## Complete Implementation

### components/agent-control/AgentStatusIndicator.tsx

```typescript
/**
 * AgentStatusIndicator Component (Server Component)
 */

import { AgentState } from '@/types';
import { Circle, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface AgentStatusIndicatorProps {
  state: AgentState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const stateConfig = {
  [AgentState.READY]: {
    label: 'Ready',
    icon: CheckCircle,
    className: 'text-emerald-500',
    pulse: false
  },
  [AgentState.BUSY]: {
    label: 'Busy',
    icon: Zap,
    className: 'text-indigo-500',
    pulse: true
  },
  [AgentState.IDLE]: {
    label: 'Idle',
    icon: Circle,
    className: 'text-slate-500',
    pulse: false
  },
  [AgentState.ERROR]: {
    label: 'Error',
    icon: AlertCircle,
    className: 'text-red-500',
    pulse: false
  }
};

export function AgentStatusIndicator({
  state,
  size = 'md',
  showLabel = true,
  className = ''
}: AgentStatusIndicatorProps) {
  const config = stateConfig[state];
  const Icon = config.icon;

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {config.pulse && (
          <span className={`absolute inset-0 ${config.className} opacity-75 animate-ping`}>
            <Icon className={iconSizes[size]} />
          </span>
        )}
        <Icon className={`${iconSizes[size]} ${config.className} relative`} />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${config.className}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}
```

### components/agent-control/SEOAgentPanel.tsx

```typescript
'use client';

/**
 * SEOAgentPanel Component (Client Component)
 * Controls for SEO Writer Agent
 */

import { useState } from 'react';
import { AgentStatus } from '@/types';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, PenTool, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';

interface SEOAgentPanelProps {
  status: AgentStatus;
  onResearch: (topic: string, keywords: string[]) => Promise<void>;
  onWrite: (brief: string, keywords: string[]) => Promise<void>;
  onOptimize: (url: string, keywords: string[]) => Promise<void>;
}

type Action = 'research' | 'write' | 'optimize' | null;

export function SEOAgentPanel({
  status,
  onResearch,
  onWrite,
  onOptimize
}: SEOAgentPanelProps) {
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [topic, setTopic] = useState('');
  const [brief, setBrief] = useState('');
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  const parseKeywords = () => {
    return keywords.split(',').map((k) => k.trim()).filter(Boolean);
  };

  async function handleResearch() {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    try {
      setLoading(true);
      await onResearch(topic, parseKeywords());
      toast.success('Research job started!');
      setTopic('');
      setKeywords('');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to start research');
    } finally {
      setLoading(false);
    }
  }

  async function handleWrite() {
    if (!brief.trim()) {
      toast.error('Please enter a brief');
      return;
    }

    try {
      setLoading(true);
      await onWrite(brief, parseKeywords());
      toast.success('Writing job started!');
      setBrief('');
      setKeywords('');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to start writing');
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimize() {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    try {
      setLoading(true);
      await onOptimize(url, parseKeywords());
      toast.success('Optimization job started!');
      setUrl('');
      setKeywords('');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to start optimization');
    } finally {
      setLoading(false);
    }
  }

  const isBusy = status.state === 'busy';

  return (
    <Card className="border-blue-500/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">SEO Writer</h3>
              <p className="text-sm text-slate-400">Content research & creation</p>
            </div>
          </div>
          <AgentStatusIndicator state={status.state} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-xs text-slate-400 mb-1">Jobs Completed</div>
            <div className="text-xl font-bold text-slate-100">
              {status.total_jobs_completed}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Total Cost</div>
            <div className="text-xl font-bold text-slate-100">
              ${status.total_cost_usd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Active Job */}
        {status.current_job_id && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="text-xs text-indigo-400 mb-1">Currently Running</div>
            <div className="text-sm text-slate-300">Job in progress...</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'research' ? null : 'research')}
            disabled={isBusy}
            icon={<Search className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Research Topic
          </Button>

          {activeAction === 'research' && (
            <div className="pl-4 space-y-3 pb-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic to research..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Keywords (comma-separated)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="secondary"
                onClick={handleResearch}
                loading={loading}
                className="w-full"
              >
                Start Research
              </Button>
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'write' ? null : 'write')}
            disabled={isBusy}
            icon={<PenTool className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Write Article
          </Button>

          {activeAction === 'write' && (
            <div className="pl-4 space-y-3 pb-3">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                placeholder="Enter content brief..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Keywords (comma-separated)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="secondary"
                onClick={handleWrite}
                loading={loading}
                className="w-full"
              >
                Start Writing
              </Button>
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'optimize' ? null : 'optimize')}
            disabled={isBusy}
            icon={<Sparkles className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Optimize Content
          </Button>

          {activeAction === 'optimize' && (
            <div className="pl-4 space-y-3 pb-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to optimize..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Focus keywords (optional)"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="secondary"
                onClick={handleOptimize}
                loading={loading}
                className="w-full"
              >
                Start Optimization
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### components/agent-control/EmailAgentPanel.tsx

```typescript
'use client';

/**
 * EmailAgentPanel Component (Client Component)
 * Controls for Email Marketer Agent
 */

import { useState } from 'react';
import { AgentStatus } from '@/types';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, ListOrdered } from 'lucide-react';
import { toast } from '@/lib/toast';

interface EmailAgentPanelProps {
  status: AgentStatus;
  onCreate: (brief: string) => Promise<void>;
  onCreateSeries: (brief: string, numEmails: number) => Promise<void>;
}

type Action = 'single' | 'series' | null;

export function EmailAgentPanel({
  status,
  onCreate,
  onCreateSeries
}: EmailAgentPanelProps) {
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [brief, setBrief] = useState('');
  const [numEmails, setNumEmails] = useState(5);
  const [loading, setLoading] = useState(false);

  async function handleCreateEmail() {
    if (!brief.trim()) {
      toast.error('Please enter a brief');
      return;
    }

    try {
      setLoading(true);
      await onCreate(brief);
      toast.success('Email creation started!');
      setBrief('');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to create email');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSeries() {
    if (!brief.trim()) {
      toast.error('Please enter a brief');
      return;
    }

    try {
      setLoading(true);
      await onCreateSeries(brief, numEmails);
      toast.success('Email series creation started!');
      setBrief('');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to create email series');
    } finally {
      setLoading(false);
    }
  }

  const isBusy = status.state === 'busy';

  return (
    <Card className="border-purple-500/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Email Marketer</h3>
              <p className="text-sm text-slate-400">Email campaigns & sequences</p>
            </div>
          </div>
          <AgentStatusIndicator state={status.state} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-xs text-slate-400 mb-1">Jobs Completed</div>
            <div className="text-xl font-bold text-slate-100">
              {status.total_jobs_completed}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Total Cost</div>
            <div className="text-xl font-bold text-slate-100">
              ${status.total_cost_usd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Active Job */}
        {status.current_job_id && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="text-xs text-indigo-400 mb-1">Currently Running</div>
            <div className="text-sm text-slate-300">Job in progress...</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'single' ? null : 'single')}
            disabled={isBusy}
            icon={<Mail className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Create Email
          </Button>

          {activeAction === 'single' && (
            <div className="pl-4 space-y-3 pb-3">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                placeholder="Describe the email campaign..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Button
                variant="secondary"
                onClick={handleCreateEmail}
                loading={loading}
                className="w-full"
              >
                Generate Email
              </Button>
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'series' ? null : 'series')}
            disabled={isBusy}
            icon={<ListOrdered className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Create Email Series
          </Button>

          {activeAction === 'series' && (
            <div className="pl-4 space-y-3 pb-3">
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={4}
                placeholder="Describe the email series..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Number of Emails
                </label>
                <input
                  type="number"
                  value={numEmails}
                  onChange={(e) => setNumEmails(parseInt(e.target.value))}
                  min={2}
                  max={10}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleCreateSeries}
                loading={loading}
                className="w-full"
              >
                Generate Series
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### components/agent-control/CMOAgentPanel.tsx

```typescript
'use client';

/**
 * CMOAgentPanel Component (Client Component)
 * Controls for CMO Agent
 */

import { useState } from 'react';
import { AgentStatus, TimeRange } from '@/types';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart, TrendingUp } from 'lucide-react';
import { toast } from '@/lib/toast';

interface CMOAgentPanelProps {
  status: AgentStatus;
  onAnalyze: (timeRange: TimeRange) => Promise<void>;
  onReview: (timeRange: TimeRange) => Promise<void>;
}

type Action = 'analyze' | 'review' | null;

export function CMOAgentPanel({
  status,
  onAnalyze,
  onReview
}: CMOAgentPanelProps) {
  const [activeAction, setActiveAction] = useState<Action>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_30_DAYS);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    try {
      setLoading(true);
      await onAnalyze(timeRange);
      toast.success('Analysis started!');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to start analysis');
    } finally {
      setLoading(false);
    }
  }

  async function handleReview() {
    try {
      setLoading(true);
      await onReview(timeRange);
      toast.success('Review started!');
      setActiveAction(null);
    } catch (error) {
      toast.error('Failed to start review');
    } finally {
      setLoading(false);
    }
  }

  const isBusy = status.state === 'busy';

  return (
    <Card className="border-emerald-500/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <BarChart className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-100">CMO</h3>
              <p className="text-sm text-slate-400">Strategy & analytics</p>
            </div>
          </div>
          <AgentStatusIndicator state={status.state} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-xs text-slate-400 mb-1">Jobs Completed</div>
            <div className="text-xl font-bold text-slate-100">
              {status.total_jobs_completed}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Total Cost</div>
            <div className="text-xl font-bold text-slate-100">
              ${status.total_cost_usd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Active Job */}
        {status.current_job_id && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="text-xs text-indigo-400 mb-1">Currently Running</div>
            <div className="text-sm text-slate-300">Job in progress...</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'analyze' ? null : 'analyze')}
            disabled={isBusy}
            icon={<BarChart className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Analyze Performance
          </Button>

          {activeAction === 'analyze' && (
            <div className="pl-4 space-y-3 pb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={TimeRange.LAST_7_DAYS}>Last 7 Days</option>
                  <option value={TimeRange.LAST_30_DAYS}>Last 30 Days</option>
                  <option value={TimeRange.LAST_90_DAYS}>Last 90 Days</option>
                  <option value={TimeRange.LAST_YEAR}>Last Year</option>
                  <option value={TimeRange.ALL_TIME}>All Time</option>
                </select>
              </div>
              <Button
                variant="secondary"
                onClick={handleAnalyze}
                loading={loading}
                className="w-full"
              >
                Run Analysis
              </Button>
            </div>
          )}

          <Button
            variant="primary"
            onClick={() => setActiveAction(activeAction === 'review' ? null : 'review')}
            disabled={isBusy}
            icon={<TrendingUp className="w-4 h-4" />}
            className="w-full justify-start"
          >
            Performance Review
          </Button>

          {activeAction === 'review' && (
            <div className="pl-4 space-y-3 pb-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={TimeRange.LAST_7_DAYS}>Last 7 Days</option>
                  <option value={TimeRange.LAST_30_DAYS}>Last 30 Days</option>
                  <option value={TimeRange.LAST_90_DAYS}>Last 90 Days</option>
                  <option value={TimeRange.LAST_YEAR}>Last Year</option>
                  <option value={TimeRange.ALL_TIME}>All Time</option>
                </select>
              </div>
              <Button
                variant="secondary"
                onClick={handleReview}
                loading={loading}
                className="w-full"
              >
                Generate Review
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### components/agent-control/AgentControlPanel.tsx

```typescript
'use client';

/**
 * AgentControlPanel Component (Client Component)
 * Main dashboard for all agents
 */

import { useEffect, useState } from 'react';
import { AgentStatus, AgentType, TimeRange } from '@/types';
import { SEOAgentPanel } from './SEOAgentPanel';
import { EmailAgentPanel } from './EmailAgentPanel';
import { CMOAgentPanel } from './CMOAgentPanel';

interface AgentControlPanelProps {
  brandId: string;
}

export function AgentControlPanel({ brandId }: AgentControlPanelProps) {
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentType, AgentStatus>>({} as any);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentStatuses();

    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchAgentStatuses, 5000);
    return () => clearInterval(interval);
  }, [brandId]);

  async function fetchAgentStatuses() {
    try {
      const response = await fetch(`/api/agents/status?brand_id=${brandId}`);
      const data = await response.json();

      const statusMap: Record<AgentType, AgentStatus> = {} as any;
      data.forEach((status: AgentStatus) => {
        statusMap[status.agent_type] = status;
      });

      setAgentStatuses(statusMap);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch agent statuses:', error);
    }
  }

  async function handleResearch(topic: string, keywords: string[]) {
    const response = await fetch('/api/agents/seo/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, target_keywords: keywords })
    });

    if (!response.ok) throw new Error('Failed to start research');
    await fetchAgentStatuses();
  }

  async function handleWrite(brief: string, keywords: string[]) {
    const response = await fetch('/api/agents/seo/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, target_keywords: keywords, auto_polish: true })
    });

    if (!response.ok) throw new Error('Failed to start writing');
    await fetchAgentStatuses();
  }

  async function handleOptimize(url: string, keywords: string[]) {
    const response = await fetch('/api/agents/seo/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, focus_keywords: keywords })
    });

    if (!response.ok) throw new Error('Failed to start optimization');
    await fetchAgentStatuses();
  }

  async function handleCreateEmail(brief: string) {
    const response = await fetch('/api/agents/email/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief })
    });

    if (!response.ok) throw new Error('Failed to create email');
    await fetchAgentStatuses();
  }

  async function handleCreateSeries(brief: string, numEmails: number) {
    const response = await fetch('/api/agents/email/create-series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, num_emails: numEmails })
    });

    if (!response.ok) throw new Error('Failed to create series');
    await fetchAgentStatuses();
  }

  async function handleAnalyze(timeRange: TimeRange) {
    const response = await fetch('/api/agents/cmo/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_range: timeRange })
    });

    if (!response.ok) throw new Error('Failed to start analysis');
    await fetchAgentStatuses();
  }

  async function handleReview(timeRange: TimeRange) {
    const response = await fetch('/api/agents/cmo/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ time_range: timeRange })
    });

    if (!response.ok) throw new Error('Failed to start review');
    await fetchAgentStatuses();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 rounded-lg bg-slate-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {agentStatuses[AgentType.SEO_WRITER] && (
        <SEOAgentPanel
          status={agentStatuses[AgentType.SEO_WRITER]}
          onResearch={handleResearch}
          onWrite={handleWrite}
          onOptimize={handleOptimize}
        />
      )}

      {agentStatuses[AgentType.EMAIL_MARKETER] && (
        <EmailAgentPanel
          status={agentStatuses[AgentType.EMAIL_MARKETER]}
          onCreate={handleCreateEmail}
          onCreateSeries={handleCreateSeries}
        />
      )}

      {agentStatuses[AgentType.CMO] && (
        <CMOAgentPanel
          status={agentStatuses[AgentType.CMO]}
          onAnalyze={handleAnalyze}
          onReview={handleReview}
        />
      )}
    </div>
  );
}
```

## Accessibility

- Form inputs have associated labels
- Status indicators have `aria-label` for screen readers
- Disabled states clearly communicated
- Keyboard navigation through forms (Tab, Enter)
- Error messages announced to screen readers
- Loading states have `aria-busy` attribute

## Usage Examples

```typescript
// app/agents/page.tsx
import { AgentControlPanel } from '@/components/agent-control/AgentControlPanel';

export default function AgentsPage() {
  const brandId = 'your-brand-id'; // Get from auth/context

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-100 mb-8">AI Agent Control Panel</h1>
      <AgentControlPanel brandId={brandId} />
    </div>
  );
}
```

## Testing

```typescript
// __tests__/SEOAgentPanel.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SEOAgentPanel } from '@/components/agent-control/SEOAgentPanel';
import { AgentState } from '@/types';

describe('SEOAgentPanel', () => {
  const mockStatus = {
    agent_type: 'seo_writer',
    state: AgentState.READY,
    current_job_id: null,
    total_jobs_completed: 5,
    total_cost_usd: 2.50
  };

  it('calls onResearch with correct params', async () => {
    const onResearch = vi.fn().mockResolvedValue(undefined);

    render(
      <SEOAgentPanel
        status={mockStatus}
        onResearch={onResearch}
        onWrite={vi.fn()}
        onOptimize={vi.fn()}
      />
    );

    // Click research button
    fireEvent.click(screen.getByText('Research Topic'));

    // Fill form
    const topicInput = screen.getByPlaceholderText('Enter topic to research...');
    fireEvent.change(topicInput, { target: { value: 'AI marketing' } });

    const keywordsInput = screen.getByPlaceholderText('Keywords (comma-separated)');
    fireEvent.change(keywordsInput, { target: { value: 'ai, marketing, automation' } });

    // Submit
    fireEvent.click(screen.getByText('Start Research'));

    await waitFor(() => {
      expect(onResearch).toHaveBeenCalledWith('AI marketing', ['ai', 'marketing', 'automation']);
    });
  });

  it('disables actions when agent is busy', () => {
    const busyStatus = { ...mockStatus, state: AgentState.BUSY };

    render(
      <SEOAgentPanel
        status={busyStatus}
        onResearch={vi.fn()}
        onWrite={vi.fn()}
        onOptimize={vi.fn()}
      />
    );

    const researchButton = screen.getByText('Research Topic');
    expect(researchButton).toBeDisabled();
  });
});
```

## Next Steps

Proceed to:
- **Document 16**: Dashboard Layout
- **Document 17**: UI Primitives
