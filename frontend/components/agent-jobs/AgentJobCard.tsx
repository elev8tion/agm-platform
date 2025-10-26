/**
 * Agent Job Card
 * Displays agent job with status and progress
 */

'use client';

import { AgentJob, AgentType, JobActionType } from '@/types';
import { Card } from '@/components/ui/Card';
import { JobStatusBadge } from './JobStatusBadge';
import { JobProgressBar } from './JobProgressBar';
import { Sparkles, Mail, TrendingUp, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentJobCardProps {
  job: AgentJob;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const agentConfig: Record<AgentType, { icon: typeof Sparkles; label: string; color: string }> = {
  [AgentType.SEO_WRITER]: { icon: Sparkles, label: 'SEO Writer', color: 'text-purple-400' },
  [AgentType.EMAIL_MARKETER]: { icon: Mail, label: 'Email Marketer', color: 'text-blue-400' },
  [AgentType.CMO]: { icon: TrendingUp, label: 'CMO', color: 'text-green-400' }
};

const actionLabels: Record<JobActionType, string> = {
  [JobActionType.RESEARCH]: 'Research',
  [JobActionType.WRITE]: 'Write Content',
  [JobActionType.OPTIMIZE]: 'Optimize',
  [JobActionType.CREATE_EMAIL]: 'Create Email',
  [JobActionType.CREATE_SERIES]: 'Create Series',
  [JobActionType.ANALYZE]: 'Analyze',
  [JobActionType.REVIEW]: 'Review'
};

export function AgentJobCard({ job, onView, onDelete, className }: AgentJobCardProps) {
  const agentData = agentConfig[job.agent_type];
  const AgentIcon = agentData.icon;

  return (
    <Card className={cn('hover:border-brand/40 transition-colors', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <AgentIcon className={cn('h-5 w-5', agentData.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">
                {actionLabels[job.action_type]}
              </h3>
              <p className="text-xs text-slate-400">{agentData.label}</p>
            </div>
          </div>

          <JobStatusBadge status={job.status} />
        </div>

        {/* Progress */}
        {job.progress && (
          <div className="mb-4">
            <JobProgressBar progress={job.progress} />
          </div>
        )}

        {/* Error Message */}
        {job.error_message && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{job.error_message}</p>
          </div>
        )}

        {/* Cost */}
        {job.cost && (
          <div className="mb-4 p-3 rounded-lg bg-slate-800/30 border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Total Cost</span>
              <span className="text-sm font-semibold text-slate-200">
                ${job.cost.total_cost_usd.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-500">
                {job.cost.input_tokens.toLocaleString()} in / {job.cost.output_tokens.toLocaleString()} out
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="text-xs text-slate-400">
            {job.completed_at
              ? `Completed ${new Date(job.completed_at).toLocaleString()}`
              : `Started ${new Date(job.created_at).toLocaleString()}`}
          </div>

          <div className="flex items-center gap-1">
            {job.result_content_asset_id && (
              <button
                onClick={() => onView?.(job.id)}
                className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
                title="View Result"
              >
                <Eye className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <button
              onClick={() => onDelete?.(job.id)}
              className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
