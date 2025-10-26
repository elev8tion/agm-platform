/**
 * Quick Actions Panel
 * Floating action buttons for common tasks
 */

'use client';

import { Button } from '@/components/ui/Button';
import { FileText, Target, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionsPanelProps {
  onCreateContent?: () => void;
  onCreateCampaign?: () => void;
  onRunAgent?: () => void;
  className?: string;
}

export function QuickActionsPanel({
  onCreateContent,
  onCreateCampaign,
  onRunAgent,
  className
}: QuickActionsPanelProps) {
  return (
    <div className={cn('flex gap-3', className)}>
      <Button
        onClick={onCreateContent}
        variant="secondary"
        className="flex-1"
      >
        <FileText className="h-4 w-4 mr-2" />
        New Content
      </Button>

      <Button
        onClick={onCreateCampaign}
        variant="secondary"
        className="flex-1"
      >
        <Target className="h-4 w-4 mr-2" />
        New Campaign
      </Button>

      <Button
        onClick={onRunAgent}
        variant="primary"
        className="flex-1"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Run AI Agent
      </Button>
    </div>
  );
}
