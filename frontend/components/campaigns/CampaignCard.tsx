/**
 * Campaign Card
 * Displays campaign overview with metrics
 */

'use client';

import { Campaign, CampaignGoal } from '@/types';
import { Card } from '@/components/ui/Card';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { BudgetProgressBar } from './BudgetProgressBar';
import {
  Target,
  Users,
  TrendingUp,
  ShoppingCart,
  BarChart3,
  Calendar,
  Edit2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

const goalConfig: Record<CampaignGoal, { icon: typeof Target; label: string; color: string }> = {
  [CampaignGoal.AWARENESS]: { icon: Users, label: 'Brand Awareness', color: 'text-blue-400' },
  [CampaignGoal.ENGAGEMENT]: { icon: TrendingUp, label: 'Engagement', color: 'text-purple-400' },
  [CampaignGoal.CONVERSION]: { icon: ShoppingCart, label: 'Conversion', color: 'text-green-400' },
  [CampaignGoal.RETENTION]: { icon: BarChart3, label: 'Retention', color: 'text-amber-400' }
};

export function CampaignCard({ campaign, onEdit, onDelete, className }: CampaignCardProps) {
  const goalData = goalConfig[campaign.goal];
  const GoalIcon = goalData.icon;

  return (
    <Card className={cn('hover:border-brand/40 transition-colors', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <GoalIcon className={cn('h-5 w-5', goalData.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 mb-1">{campaign.name}</h3>
              <p className="text-xs text-slate-400">{goalData.label}</p>
            </div>
          </div>

          <CampaignStatusBadge status={campaign.status} />
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Budget */}
        <div className="mb-4">
          <BudgetProgressBar
            spent={campaign.budget_spent_usd}
            total={campaign.budget_usd}
          />
        </div>

        {/* Metrics */}
        {campaign.metrics && (
          <div className="grid grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-slate-800/30 border border-white/5">
            {campaign.metrics.impressions !== undefined && (
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Impressions</div>
                <div className="text-sm font-semibold text-slate-200">
                  {campaign.metrics.impressions.toLocaleString()}
                </div>
              </div>
            )}
            {campaign.metrics.clicks !== undefined && (
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Clicks</div>
                <div className="text-sm font-semibold text-slate-200">
                  {campaign.metrics.clicks.toLocaleString()}
                </div>
              </div>
            )}
            {campaign.metrics.ctr !== undefined && (
              <div>
                <div className="text-xs text-slate-400 mb-0.5">CTR</div>
                <div className="text-sm font-semibold text-emerald-400">
                  {campaign.metrics.ctr.toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {campaign.start_date
              ? new Date(campaign.start_date).toLocaleDateString()
              : 'No start date'}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit?.(campaign.id)}
              className="p-1.5 rounded hover:bg-slate-800/60 transition-colors"
              title="Edit"
            >
              <Edit2 className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => onDelete?.(campaign.id)}
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
