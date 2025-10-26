/**
 * Dashboard Stats
 * KPI stat cards
 */

'use client';

import { Card } from '@/components/ui/Card';
import { FileText, Target, TrendingUp, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: typeof FileText;
  iconColor: string;
}

function StatCard({ label, value, change, icon: Icon, iconColor }: StatCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('p-2.5 rounded-lg bg-brand/10 border border-brand/20')}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                isPositive && 'text-emerald-400',
                isNegative && 'text-red-400',
                !isPositive && !isNegative && 'text-slate-400'
              )}
            >
              {isPositive && <ArrowUp className="h-3 w-3" />}
              {isNegative && <ArrowDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
        </div>
      </div>
    </Card>
  );
}

interface DashboardStatsProps {
  totalContent: number;
  activeCampaigns: number;
  totalImpressions: number;
  totalSpend: number;
  contentChange?: number;
  campaignsChange?: number;
  impressionsChange?: number;
  spendChange?: number;
  className?: string;
}

export function DashboardStats({
  totalContent,
  activeCampaigns,
  totalImpressions,
  totalSpend,
  contentChange,
  campaignsChange,
  impressionsChange,
  spendChange,
  className
}: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <StatCard
        label="Total Content"
        value={totalContent.toLocaleString()}
        change={contentChange}
        icon={FileText}
        iconColor="text-blue-400"
      />
      <StatCard
        label="Active Campaigns"
        value={activeCampaigns.toLocaleString()}
        change={campaignsChange}
        icon={Target}
        iconColor="text-purple-400"
      />
      <StatCard
        label="Total Impressions"
        value={totalImpressions.toLocaleString()}
        change={impressionsChange}
        icon={TrendingUp}
        iconColor="text-green-400"
      />
      <StatCard
        label="Total Spend"
        value={`$${totalSpend.toLocaleString()}`}
        change={spendChange}
        icon={DollarSign}
        iconColor="text-amber-400"
      />
    </div>
  );
}
