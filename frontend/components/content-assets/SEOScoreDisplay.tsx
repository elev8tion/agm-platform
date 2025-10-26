/**
 * SEO Score Display
 * Visual indicator for SEO score with color coding
 */

'use client';

import { cn } from '@/lib/utils';

interface SEOScoreDisplayProps {
  score: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SEOScoreDisplay({
  score,
  showLabel = true,
  size = 'md',
  className
}: SEOScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-semibold',
        getScoreColor(score),
        sizeClasses[size],
        className
      )}
    >
      <span>{score}/100</span>
      {showLabel && <span className="text-xs opacity-80">SEO</span>}
    </div>
  );
}
