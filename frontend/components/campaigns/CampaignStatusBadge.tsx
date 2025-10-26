/**
 * Campaign Status Badge
 * Displays campaign status with appropriate styling
 */

'use client';

import { CampaignStatus } from '@/types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  className?: string;
}

const statusConfig: Record<CampaignStatus, { label: string; variant: BadgeVariant }> = {
  [CampaignStatus.DRAFT]: { label: 'Draft', variant: 'default' },
  [CampaignStatus.ACTIVE]: { label: 'Active', variant: 'success' },
  [CampaignStatus.PAUSED]: { label: 'Paused', variant: 'warning' },
  [CampaignStatus.COMPLETED]: { label: 'Completed', variant: 'primary' },
  [CampaignStatus.ARCHIVED]: { label: 'Archived', variant: 'default' }
};

export function CampaignStatusBadge({ status, className }: CampaignStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
