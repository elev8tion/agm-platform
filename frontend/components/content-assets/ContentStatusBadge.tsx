/**
 * Content Status Badge
 * Displays content status with appropriate styling
 */

'use client';

import { ContentStatus } from '@/types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

interface ContentStatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

const statusConfig: Record<ContentStatus, { label: string; variant: BadgeVariant }> = {
  [ContentStatus.DRAFT]: { label: 'Draft', variant: 'default' },
  [ContentStatus.REVIEW]: { label: 'In Review', variant: 'warning' },
  [ContentStatus.APPROVED]: { label: 'Approved', variant: 'success' },
  [ContentStatus.PUBLISHED]: { label: 'Published', variant: 'primary' },
  [ContentStatus.ARCHIVED]: { label: 'Archived', variant: 'default' }
};

export function ContentStatusBadge({ status, className }: ContentStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
