/**
 * Job Progress Bar
 * Visual indicator for job progress
 */

'use client';

import { JobProgress } from '@/types';
import { cn } from '@/lib/utils';

interface JobProgressBarProps {
  progress: JobProgress;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function JobProgressBar({
  progress,
  showLabel = true,
  size = 'md',
  className
}: JobProgressBarProps) {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-300">{progress.current_step}</span>
          <span className="text-sm text-slate-400">
            {progress.percentage.toFixed(0)}%
          </span>
        </div>
      )}

      <div className={cn('w-full bg-slate-800/60 rounded-full overflow-hidden', heightClasses[size])}>
        <div
          className="h-full bg-brand transition-all duration-500 rounded-full"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {showLabel && (
        <div className="text-xs text-slate-400 mt-1">
          Step {progress.completed_steps} of {progress.total_steps}
        </div>
      )}
    </div>
  );
}
