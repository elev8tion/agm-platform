/**
 * Skeleton Component
 * Loading placeholder with animation
 */

import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full',
    circular: 'rounded-full w-12 h-12',
    rectangular: 'rounded-lg w-full h-24'
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-800/50',
        variantStyles[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}
