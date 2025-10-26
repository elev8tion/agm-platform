/**
 * Job History List
 * Timeline of past agent jobs
 */

'use client';

import { AgentJob } from '@/types';
import { AgentJobCard } from './AgentJobCard';

interface JobHistoryListProps {
  jobs: AgentJob[];
  onJobView?: (id: string) => void;
  onJobDelete?: (id: string) => void;
  maxItems?: number;
  className?: string;
}

export function JobHistoryList({
  jobs,
  onJobView,
  onJobDelete,
  maxItems,
  className
}: JobHistoryListProps) {
  // Sort by most recent first
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Limit items if maxItems is specified
  const displayJobs = maxItems ? sortedJobs.slice(0, maxItems) : sortedJobs;

  return (
    <div className={className}>
      {displayJobs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No job history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayJobs.map((job) => (
            <AgentJobCard
              key={job.id}
              job={job}
              onView={onJobView}
              onDelete={onJobDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
