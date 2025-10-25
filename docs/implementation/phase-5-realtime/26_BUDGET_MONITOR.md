# Budget Monitor - Real-time Usage Tracking

## Overview

The Budget Monitor provides real-time visualization of AI agent costs, budget consumption, and spending patterns. It integrates with WebSocket events to update instantly as agents execute jobs, helping users stay within budget limits and optimize costs.

**Key Features:**
- Real-time budget meter with threshold alerts
- Cost breakdown by agent type
- Historical usage charts (daily, weekly, monthly)
- Budget alerts at configurable thresholds (80%, 90%, 100%)
- Cost per job tracking
- Reset cycle management
- Admin controls for budget adjustment
- Predictive spending forecasts
- Export reports

## Prerequisites

**Required Phases:**
- Phase 5.1: WebSocket client ([23_WEBSOCKET_CLIENT.md](./23_WEBSOCKET_CLIENT.md))
- Phase 5.3: Notifications ([25_NOTIFICATIONS.md](./25_NOTIFICATIONS.md))
- Phase 2: API client

**Dependencies:**
```json
{
  "recharts": "^2.10.3",
  "date-fns": "^3.0.6",
  "zustand": "^4.4.7",
  "framer-motion": "^10.16.16"
}
```

## Architecture

### Data Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Backend    │────────▶│  WebSocket   │────────▶│   Budget     │
│  (Job Cost)  │         │    Event     │         │    Store     │
└──────────────┘         └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                         ┌──────────────────────────────────────┐
                         │         UI Components                │
                         ├──────────────────────────────────────┤
                         │  • BudgetMeter (progress bar)        │
                         │  • CostBreakdown (pie chart)         │
                         │  • UsageChart (line/bar chart)       │
                         │  • BudgetAlerts (warnings)           │
                         └──────────────────────────────────────┘
```

## Complete Implementation

### Budget Types

```typescript
// lib/budget/types.ts

export interface BudgetConfig {
  total: number; // Total budget in dollars
  resetCycle: 'daily' | 'weekly' | 'monthly' | 'never';
  resetDay?: number; // 1-31 for monthly, 0-6 for weekly
  alertThresholds: number[]; // e.g., [80, 90, 100]
  costPerModel: {
    [modelName: string]: {
      inputTokenCost: number;  // Cost per 1M input tokens
      outputTokenCost: number; // Cost per 1M output tokens
    };
  };
}

export interface BudgetUsage {
  used: number;
  total: number;
  percentage: number;
  remaining: number;
  breakdown: {
    [agentType: string]: {
      cost: number;
      jobs: number;
      tokens: {
        input: number;
        output: number;
      };
    };
  };
  history: BudgetHistoryEntry[];
  lastReset: number;
  nextReset: number;
}

export interface BudgetHistoryEntry {
  timestamp: number;
  cost: number;
  jobId?: string;
  agentType?: string;
  modelName?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface BudgetStore {
  config: BudgetConfig;
  usage: BudgetUsage;
  isLoading: boolean;
  error: string | null;

  updateConfig: (config: Partial<BudgetConfig>) => void;
  updateUsage: (usage: Partial<BudgetUsage>) => void;
  addHistoryEntry: (entry: BudgetHistoryEntry) => void;
  resetBudget: () => void;
  fetchBudgetData: () => Promise<void>;
}
```

### Budget Store

```typescript
// lib/budget/store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BudgetConfig, BudgetUsage, BudgetStore, BudgetHistoryEntry } from './types';
import { apiClient } from '@/lib/api/client';

const defaultConfig: BudgetConfig = {
  total: 100,
  resetCycle: 'monthly',
  resetDay: 1,
  alertThresholds: [80, 90, 100],
  costPerModel: {
    'gpt-4o-mini': {
      inputTokenCost: 0.15, // $0.15 per 1M tokens
      outputTokenCost: 0.60, // $0.60 per 1M tokens
    },
    'gpt-4o': {
      inputTokenCost: 2.50,
      outputTokenCost: 10.00,
    },
  },
};

const defaultUsage: BudgetUsage = {
  used: 0,
  total: 100,
  percentage: 0,
  remaining: 100,
  breakdown: {},
  history: [],
  lastReset: Date.now(),
  nextReset: calculateNextReset('monthly', 1),
};

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      usage: defaultUsage,
      isLoading: false,
      error: null,

      updateConfig: (newConfig) => {
        set((state) => {
          const config = { ...state.config, ...newConfig };
          const nextReset = calculateNextReset(
            config.resetCycle,
            config.resetDay
          );

          return {
            config,
            usage: {
              ...state.usage,
              total: newConfig.total ?? state.usage.total,
              nextReset,
            },
          };
        });
      },

      updateUsage: (newUsage) => {
        set((state) => {
          const usage = { ...state.usage, ...newUsage };
          usage.percentage = (usage.used / usage.total) * 100;
          usage.remaining = usage.total - usage.used;
          return { usage };
        });
      },

      addHistoryEntry: (entry) => {
        set((state) => {
          const history = [...state.usage.history, entry];
          const used = state.usage.used + entry.cost;
          const percentage = (used / state.usage.total) * 100;
          const remaining = state.usage.total - used;

          // Update breakdown
          const breakdown = { ...state.usage.breakdown };
          if (entry.agentType) {
            if (!breakdown[entry.agentType]) {
              breakdown[entry.agentType] = {
                cost: 0,
                jobs: 0,
                tokens: { input: 0, output: 0 },
              };
            }
            breakdown[entry.agentType].cost += entry.cost;
            breakdown[entry.agentType].jobs += 1;
            if (entry.tokens) {
              breakdown[entry.agentType].tokens.input += entry.tokens.input;
              breakdown[entry.agentType].tokens.output += entry.tokens.output;
            }
          }

          return {
            usage: {
              ...state.usage,
              used,
              percentage,
              remaining,
              breakdown,
              history,
            },
          };
        });
      },

      resetBudget: () => {
        set((state) => ({
          usage: {
            ...defaultUsage,
            total: state.config.total,
            lastReset: Date.now(),
            nextReset: calculateNextReset(
              state.config.resetCycle,
              state.config.resetDay
            ),
          },
        }));
      },

      fetchBudgetData: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get('/budget/usage');
          set({ usage: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch budget data',
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'budget-storage',
      partialize: (state) => ({
        config: state.config,
        usage: {
          ...state.usage,
          history: state.usage.history.slice(-1000), // Keep last 1000 entries
        },
      }),
    }
  )
);

function calculateNextReset(
  cycle: 'daily' | 'weekly' | 'monthly' | 'never',
  day?: number
): number {
  if (cycle === 'never') return Infinity;

  const now = new Date();

  switch (cycle) {
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime();

    case 'weekly':
      const nextWeek = new Date(now);
      const currentDay = nextWeek.getDay();
      const targetDay = day ?? 0;
      const daysUntilReset = (targetDay - currentDay + 7) % 7 || 7;
      nextWeek.setDate(nextWeek.getDate() + daysUntilReset);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek.getTime();

    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(day ?? 1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.getTime();
  }
}
```

### WebSocket Integration Hook

```typescript
// lib/budget/hooks/useBudget.ts

import { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket/hooks/useWebSocket';
import { useBudgetStore } from '../store';
import { BudgetUpdatedEvent, BudgetWarningEvent } from '@/lib/websocket/types';
import { notificationManager } from '@/lib/notifications/manager';

export function useBudget() {
  const { subscribe, isConnected } = useWebSocket();
  const store = useBudgetStore();

  // Fetch initial data
  useEffect(() => {
    if (isConnected) {
      store.fetchBudgetData();
    }
  }, [isConnected]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: Array<() => void> = [];

    // Budget updated
    unsubscribers.push(
      subscribe('budget:updated', (data: BudgetUpdatedEvent) => {
        store.updateUsage({
          used: data.used,
          total: data.total,
          percentage: data.percentage,
          breakdown: data.breakdown,
        });
      })
    );

    // Budget warning
    unsubscribers.push(
      subscribe('budget:warning', (data: BudgetWarningEvent) => {
        const severity = data.threshold >= 100 ? 'error' : 'warning';
        notificationManager.notify(
          severity,
          'Budget Alert',
          data.message,
          {
            persistent: data.threshold >= 100,
            actions: [
              {
                label: 'View Budget',
                onClick: () => {
                  window.location.href = '/settings/budget';
                },
              },
            ],
          }
        );
      })
    );

    // Job completed (update cost)
    unsubscribers.push(
      subscribe('job:completed', (data) => {
        store.addHistoryEntry({
          timestamp: data.timestamp,
          cost: data.cost,
          jobId: data.jobId,
        });
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isConnected, subscribe, store]);

  return store;
}
```

### Budget Meter Component

```typescript
// components/budget/BudgetMeter.tsx

'use client';

import { motion } from 'framer-motion';
import { useBudget } from '@/lib/budget/hooks/useBudget';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BudgetMeter() {
  const { usage, config } = useBudget();

  const thresholdColors = {
    normal: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const getColor = () => {
    if (usage.percentage >= 100) return thresholdColors.critical;
    if (usage.percentage >= 90) return thresholdColors.danger;
    if (usage.percentage >= 80) return thresholdColors.warning;
    return thresholdColors.normal;
  };

  const getStatus = () => {
    if (usage.percentage >= 100) return 'Budget Exceeded';
    if (usage.percentage >= 90) return 'Budget Critical';
    if (usage.percentage >= 80) return 'Budget Warning';
    return 'On Track';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <span>Budget Usage</span>
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {getStatus()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              ${usage.used.toFixed(2)} / ${usage.total.toFixed(2)}
            </span>
            <span className="text-muted-foreground">
              {usage.percentage.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${getColor()} relative`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(usage.percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>

            {/* Threshold markers */}
            {config.alertThresholds.map((threshold) => (
              <div
                key={threshold}
                className="absolute top-0 bottom-0 w-px bg-border"
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>

          {/* Threshold labels */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {config.alertThresholds.map((threshold) => (
              <span key={threshold}>{threshold}%</span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Remaining</span>
            </div>
            <p className="text-2xl font-bold">${usage.remaining.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Next Reset</span>
            </div>
            <p className="text-sm font-medium">
              {config.resetCycle === 'never'
                ? 'Manual'
                : formatDistanceToNow(usage.nextReset, { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Alert Message */}
        {usage.percentage >= 80 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-lg ${
              usage.percentage >= 100
                ? 'bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-800'
                : usage.percentage >= 90
                ? 'bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                : 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
            }`}
          >
            <p className="text-sm font-medium">
              {usage.percentage >= 100
                ? 'Budget limit exceeded! New jobs may be blocked.'
                : usage.percentage >= 90
                ? 'Approaching budget limit. Consider increasing or monitoring usage.'
                : 'Budget usage is high. Monitor your spending closely.'}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Cost Breakdown Component

```typescript
// components/budget/CostBreakdown.tsx

'use client';

import { useBudget } from '@/lib/budget/hooks/useBudget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Bot } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const agentLabels: Record<string, string> = {
  cmo: 'CMO',
  seo_writer: 'SEO Writer',
  email_marketer: 'Email Marketer',
  social_media_manager: 'Social Media',
  analytics_specialist: 'Analytics',
};

export function CostBreakdown() {
  const { usage } = useBudget();

  const data = Object.entries(usage.breakdown).map(([agentType, stats], index) => ({
    name: agentLabels[agentType] || agentType,
    value: stats.cost,
    jobs: stats.jobs,
    tokens: stats.tokens,
    color: COLORS[index % COLORS.length],
  }));

  const totalJobs = data.reduce((sum, item) => sum + item.jobs, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No cost data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Cost Breakdown by Agent
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => `$${value.toFixed(4)}`}
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        {/* Detailed Breakdown */}
        <div className="mt-6 space-y-3">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ background: item.color }}
                />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.jobs} {item.jobs === 1 ? 'job' : 'jobs'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">${item.value.toFixed(4)}</p>
                <p className="text-sm text-muted-foreground">
                  {((item.value / usage.used) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <p className="text-2xl font-bold">{totalJobs}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">${usage.used.toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Usage Chart Component

```typescript
// components/budget/UsageChart.tsx

'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/budget/hooks/useBudget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { TrendingUp } from 'lucide-react';

type TimeRange = '7d' | '30d' | '90d';
type ChartType = 'line' | 'bar';

export function UsageChart() {
  const { usage } = useBudget();
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartType, setChartType] = useState<ChartType>('line');

  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
  };

  // Aggregate data by day
  const chartData = aggregateByDay(usage.history, days[timeRange]);

  const Chart = chartType === 'line' ? LineChart : BarChart;
  const DataComponent = chartType === 'line' ? Line : Bar;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage History
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Time Range */}
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <TabsList>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="90d">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Chart Type */}
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No usage data for selected period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <Chart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => format(new Date(value), 'MMM d')}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
              />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(4)}`}
                labelFormatter={(label) => format(new Date(label), 'PPP')}
                contentStyle={{
                  background: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <DataComponent
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Daily Cost"
              />
            </Chart>
          </ResponsiveContainer>
        )}

        {/* Stats */}
        {chartData.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Average Daily</p>
              <p className="text-lg font-bold">
                ${(
                  chartData.reduce((sum, d) => sum + d.cost, 0) / chartData.length
                ).toFixed(4)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Peak Day</p>
              <p className="text-lg font-bold">
                ${Math.max(...chartData.map((d) => d.cost)).toFixed(4)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Period</p>
              <p className="text-lg font-bold">
                ${chartData.reduce((sum, d) => sum + d.cost, 0).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function aggregateByDay(
  history: Array<{ timestamp: number; cost: number }>,
  days: number
): Array<{ date: string; cost: number }> {
  const now = Date.now();
  const startTime = subDays(now, days).getTime();

  // Filter to time range
  const filtered = history.filter((entry) => entry.timestamp >= startTime);

  // Group by day
  const grouped: Record<string, number> = {};

  filtered.forEach((entry) => {
    const date = format(startOfDay(entry.timestamp), 'yyyy-MM-dd');
    grouped[date] = (grouped[date] || 0) + entry.cost;
  });

  // Convert to array and sort
  return Object.entries(grouped)
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
```

### Budget Alerts Component

```typescript
// components/budget/BudgetAlerts.tsx

'use client';

import { useBudget } from '@/lib/budget/hooks/useBudget';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, DollarSign } from 'lucide-react';
import Link from 'next/link';

export function BudgetAlerts() {
  const { usage, config } = useBudget();

  const activeAlerts = config.alertThresholds.filter(
    (threshold) => usage.percentage >= threshold
  );

  if (activeAlerts.length === 0) {
    return null;
  }

  const highestAlert = Math.max(...activeAlerts);

  const variant = highestAlert >= 100 ? 'destructive' : 'warning';

  return (
    <Alert variant={variant}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Budget Alert: {highestAlert}% Threshold Reached</AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          You have used ${usage.used.toFixed(2)} of your ${usage.total.toFixed(2)}{' '}
          budget ({usage.percentage.toFixed(1)}%).
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/settings/budget">
              <DollarSign className="h-4 w-4 mr-2" />
              Adjust Budget
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/jobs">View Jobs</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

## Admin Controls

```typescript
// components/budget/BudgetSettings.tsx

'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/budget/hooks/useBudget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function BudgetSettings() {
  const { config, updateConfig, resetBudget } = useBudget();
  const [total, setTotal] = useState(config.total.toString());
  const [resetCycle, setResetCycle] = useState(config.resetCycle);

  const handleSave = () => {
    const newTotal = parseFloat(total);
    if (isNaN(newTotal) || newTotal <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    updateConfig({ total: newTotal, resetCycle });
    toast.success('Budget settings updated');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the budget? This cannot be undone.')) {
      resetBudget();
      toast.success('Budget reset successfully');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Configuration</CardTitle>
        <CardDescription>
          Set your monthly budget and reset preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="total">Total Budget ($)</Label>
          <Input
            id="total"
            type="number"
            min="0"
            step="0.01"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resetCycle">Reset Cycle</Label>
          <Select value={resetCycle} onValueChange={(v: any) => setResetCycle(v)}>
            <SelectTrigger id="resetCycle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="never">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={handleReset}>
            Reset Budget
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Performance

### Memoization

```typescript
import { useMemo } from 'react';

const chartData = useMemo(
  () => aggregateByDay(usage.history, days[timeRange]),
  [usage.history, timeRange]
);
```

## Testing

```typescript
// __tests__/lib/budget/store.test.ts

import { describe, it, expect } from 'vitest';
import { useBudgetStore } from '@/lib/budget/store';

describe('BudgetStore', () => {
  it('should add history entry and update usage', () => {
    const store = useBudgetStore.getState();

    store.addHistoryEntry({
      timestamp: Date.now(),
      cost: 5.0,
      agentType: 'seo_writer',
    });

    expect(store.usage.used).toBe(5.0);
    expect(store.usage.history.length).toBe(1);
  });
});
```

## Troubleshooting

**Issue**: Budget not updating in real-time
```typescript
// Verify WebSocket connection
const { isConnected } = useWebSocket();
console.log('Connected:', isConnected);
```

## Next Steps

**Phase 5 Continuation:**
- [27_LIVE_UPDATES.md](./27_LIVE_UPDATES.md) - Live UI synchronization
