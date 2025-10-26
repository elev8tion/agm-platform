/**
 * Badge Component
 * Small status/label indicator
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  primary: 'bg-brand/20 text-brand border-brand/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  danger: 'bg-red-500/20 text-red-400 border-red-500/30'
};

export function Badge({
  children,
  variant = 'default',
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
