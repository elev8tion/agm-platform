/**
 * Campaign List
 * Grid of campaign cards with filtering
 */

'use client';

import { Campaign, CampaignStatus } from '@/types';
import { CampaignCard } from './CampaignCard';

interface CampaignListProps {
  campaigns: Campaign[];
  onCampaignEdit?: (id: string) => void;
  onCampaignDelete?: (id: string) => void;
  filterStatus?: CampaignStatus;
  className?: string;
}

export function CampaignList({
  campaigns,
  onCampaignEdit,
  onCampaignDelete,
  filterStatus,
  className
}: CampaignListProps) {
  // Filter campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filterStatus && campaign.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className={className}>
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No campaigns found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={onCampaignEdit}
              onDelete={onCampaignDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
