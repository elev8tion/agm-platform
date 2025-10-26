/**
 * Recent Activity Feed
 * Timeline of recent activities
 */

'use client';

import { Card } from '@/components/ui/Card';
import { FileText, Target, Bot, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'content' | 'campaign' | 'job';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'pending' | 'failed';
}

interface RecentActivityFeedProps {
  activities: Activity[];
  maxItems?: number;
  className?: string;
}

const activityIcons = {
  content: FileText,
  campaign: Target,
  job: Bot
};

const activityColors = {
  content: 'text-blue-400',
  campaign: 'text-purple-400',
  job: 'text-green-400'
};

const statusIcons = {
  completed: CheckCircle2,
  pending: Clock,
  failed: Clock
};

export function RecentActivityFeed({
  activities,
  maxItems = 10,
  className
}: RecentActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card title="Recent Activity" className={className}>
      <div className="divide-y divide-white/10">
        {displayActivities.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            No recent activity
          </div>
        ) : (
          displayActivities.map((activity) => {
            const Icon = activityIcons[activity.type];
            const StatusIcon = activity.status ? statusIcons[activity.status] : null;

            return (
              <div key={activity.id} className="p-4 hover:bg-slate-900/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
                    <Icon className={cn('h-4 w-4', activityColors[activity.type])} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium text-slate-200 truncate">
                        {activity.title}
                      </h4>
                      {StatusIcon && (
                        <StatusIcon
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            activity.status === 'completed' && 'text-emerald-400',
                            activity.status === 'pending' && 'text-amber-400',
                            activity.status === 'failed' && 'text-red-400'
                          )}
                        />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-1">{activity.description}</p>
                    <time className="text-xs text-slate-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </time>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
