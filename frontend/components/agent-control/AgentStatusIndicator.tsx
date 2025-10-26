/**
 * Agent Status Indicator
 * Shows agent availability status
 */

'use client';

import { AgentState } from '@/types';
import { cn } from '@/lib/utils';

interface AgentStatusIndicatorProps {
  state: AgentState;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const stateConfig: Record<AgentState, { label: string; color: string; dotColor: string }> = {
  [AgentState.READY]: {
    label: 'Ready',
    color: 'text-emerald-400',
    dotColor: 'bg-emerald-400'
  },
  [AgentState.BUSY]: {
    label: 'Busy',
    color: 'text-amber-400',
    dotColor: 'bg-amber-400'
  },
  [AgentState.IDLE]: {
    label: 'Idle',
    color: 'text-slate-400',
    dotColor: 'bg-slate-400'
  },
  [AgentState.ERROR]: {
    label: 'Error',
    color: 'text-red-400',
    dotColor: 'bg-red-400'
  }
};

const sizeClasses = {
  sm: { dot: 'h-2 w-2', text: 'text-xs' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm' },
  lg: { dot: 'h-3 w-3', text: 'text-base' }
};

export function AgentStatusIndicator({
  state,
  showLabel = true,
  size = 'md',
  className
}: AgentStatusIndicatorProps) {
  const config = stateConfig[state];
  const sizes = sizeClasses[size];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <span
        className={cn(
          'relative flex rounded-full',
          sizes.dot,
          config.dotColor
        )}
      >
        {state === AgentState.BUSY && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
        )}
      </span>
      {showLabel && (
        <span className={cn('font-medium', config.color, sizes.text)}>
          {config.label}
        </span>
      )}
    </div>
  );
}
