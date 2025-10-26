/**
 * CMO Agent Panel
 * Controls for CMO agent
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { AgentState, JobActionType, TimeRange } from '@/types';
import { TrendingUp, BarChart3, FileText } from 'lucide-react';

interface CMOAgentPanelProps {
  agentState: AgentState;
  onAction: (action: JobActionType, params: Record<string, any>) => void;
  className?: string;
}

export function CMOAgentPanel({ agentState, onAction, className }: CMOAgentPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.LAST_30_DAYS);

  const handleAnalyze = () => {
    onAction(JobActionType.ANALYZE, { time_range: timeRange });
  };

  const handleReview = () => {
    onAction(JobActionType.REVIEW, { time_range: timeRange });
  };

  const isDisabled = agentState === AgentState.BUSY || agentState === AgentState.ERROR;

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">CMO</h3>
              <p className="text-xs text-slate-400">Strategy & analytics</p>
            </div>
          </div>
          <AgentStatusIndicator state={agentState} />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Time Range Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Analysis Period
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              disabled={isDisabled}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40 disabled:opacity-50"
            >
              <option value={TimeRange.LAST_7_DAYS}>Last 7 days</option>
              <option value={TimeRange.LAST_30_DAYS}>Last 30 days</option>
              <option value={TimeRange.LAST_90_DAYS}>Last 90 days</option>
              <option value={TimeRange.LAST_YEAR}>Last year</option>
              <option value={TimeRange.ALL_TIME}>All time</option>
            </select>
          </div>

          {/* Analyze Performance */}
          <Button
            onClick={handleAnalyze}
            disabled={isDisabled}
            variant="primary"
            className="w-full"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyze Performance
          </Button>

          {/* Review Content */}
          <Button
            onClick={handleReview}
            disabled={isDisabled}
            variant="secondary"
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Review Content
          </Button>
        </div>
      </div>
    </Card>
  );
}
