/**
 * Budget Meter
 * Displays budget usage with visual meter
 */

'use client';

import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BudgetMeterProps {
  spent: number;
  total: number;
  compact?: boolean;
  className?: string;
}

export function BudgetMeter({ spent, total, compact = false, className }: BudgetMeterProps) {
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = Math.max(total - spent, 0);

  const getColor = (percent: number) => {
    if (percent >= 90) return 'text-red-400 border-red-500/30 bg-red-500/10';
    if (percent >= 75) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  };

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border',
          getColor(percentage),
          className
        )}
      >
        <DollarSign className="h-4 w-4" />
        <div className="text-sm font-semibold">
          ${spent.toLocaleString()} / ${total.toLocaleString()}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('p-4 rounded-lg bg-slate-900/50 border border-white/10', className)}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-5 w-5 text-brand" />
        <h3 className="font-semibold text-slate-100">Monthly Budget</h3>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-slate-100">
            ${spent.toLocaleString()}
          </span>
          <span className="text-sm text-slate-400">
            of ${total.toLocaleString()}
          </span>
        </div>

        <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-500',
              percentage >= 90 ? 'bg-red-500' : percentage >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className={getColor(percentage)}>
            {percentage.toFixed(1)}% used
          </span>
          <span className="text-slate-400">
            ${remaining.toLocaleString()} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
