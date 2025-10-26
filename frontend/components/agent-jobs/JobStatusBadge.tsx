/**
 * Job Status Badge
 * Displays job status with appropriate styling
 */

'use client';

import { JobStatus } from '@/types';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Loader2, CheckCircle2, XCircle, Clock, Ban } from 'lucide-react';

interface JobStatusBadgeProps {
  status: JobStatus;
  showIcon?: boolean;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; variant: BadgeVariant; icon: typeof Loader2 }> = {
  [JobStatus.PENDING]: { label: 'Pending', variant: 'default', icon: Clock },
  [JobStatus.RUNNING]: { label: 'Running', variant: 'primary', icon: Loader2 },
  [JobStatus.COMPLETED]: { label: 'Completed', variant: 'success', icon: CheckCircle2 },
  [JobStatus.FAILED]: { label: 'Failed', variant: 'danger', icon: XCircle },
  [JobStatus.CANCELLED]: { label: 'Cancelled', variant: 'default', icon: Ban }
};

export function JobStatusBadge({ status, showIcon = true, className }: JobStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      {showIcon && (
        <Icon className={`h-3 w-3 mr-1 ${status === JobStatus.RUNNING ? 'animate-spin' : ''}`} />
      )}
      {config.label}
    </Badge>
  );
}
