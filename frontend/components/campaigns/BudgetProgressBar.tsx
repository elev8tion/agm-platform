/**
 * Budget Progress Bar
 * Visual indicator for budget usage
 */

'use client';

import { cn } from '@/lib/utils';

interface BudgetProgressBarProps {
  spent: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BudgetProgressBar({
  spent,
  total,
  showLabel = true,
  size = 'md',
  className
}: BudgetProgressBarProps) {
  const percentage = Math.min((spent / total) * 100, 100);
  const remaining = Math.max(total - spent, 0);

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-300">
            ${spent.toLocaleString()} / ${total.toLocaleString()}
          </span>
          <span className="text-sm text-slate-400">
            {percentage.toFixed(1)}% used
          </span>
        </div>
      )}

      <div className={cn('w-full bg-slate-800/60 rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className={cn(
            'h-full transition-all duration-500 rounded-full',
            getProgressColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <div className="text-xs text-slate-400 mt-1">
          ${remaining.toLocaleString()} remaining
        </div>
      )}
    </div>
  );
}
