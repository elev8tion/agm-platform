/**
 * Card Component
 * Container with professional styling
 * Phase 3.7: UI Primitives
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardStatus = 'default' | 'success' | 'warning' | 'error';

export interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  status?: CardStatus;
  glow?: boolean;
  className?: string;
}

const statusStyles: Record<CardStatus, string> = {
  default: 'border-white/10',
  success: 'border-emerald-500/50',
  warning: 'border-amber-500/50',
  error: 'border-red-500/50'
};

const glowStyles: Record<CardStatus, string> = {
  default: '',
  success: 'shadow-emerald-500/20 shadow-lg',
  warning: 'shadow-amber-500/20 shadow-lg',
  error: 'shadow-red-500/20 shadow-lg'
};

export function Card({
  children,
  title,
  description,
  footer,
  status = 'default',
  glow = false,
  className
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-slate-900/50 backdrop-blur-md transition-all duration-200',
        statusStyles[status],
        glow && glowStyles[status],
        className
      )}
    >
      {(title || description) && (
        <div className="px-6 py-4 border-b border-white/10">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-slate-400 mt-1">{description}</p>
          )}
        </div>
      )}

      {children}

      {footer && (
        <div className="px-6 py-4 border-t border-white/10">
          {footer}
        </div>
      )}
    </div>
  );
}
