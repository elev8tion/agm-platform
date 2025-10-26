/**
 * Dashboard Page
 * Main dashboard with all components
 */

'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TabNavigation, DashboardTab } from '@/components/dashboard/TabNavigation';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { ContentAssetList } from '@/components/content-assets/ContentAssetList';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { AgentControlPanel } from '@/components/agent-control/AgentControlPanel';
import { JobHistoryList } from '@/components/agent-jobs/JobHistoryList';
import { MetricsChart } from '@/components/campaigns/MetricsChart';
import { CreateContentAssetModal } from '@/components/content-assets/CreateContentAssetModal';
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal';
import {
  Brand,
  ContentAsset,
  Campaign,
  AgentJob,
  AgentType,
  AgentState,
  CampaignStatus,
  JobActionType
} from '@/types';

// Mock data - replace with API calls
const mockBrand: Brand = {
  id: '1',
  name: 'Acme Marketing',
  description: 'Digital marketing agency',
  industry: 'Marketing',
  monthly_budget_usd: 5000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockContentAssets: ContentAsset[] = [];
const mockCampaigns: Campaign[] = [];
const mockJobs: AgentJob[] = [];
const mockActivities: any[] = [];
const mockMetricsData: any[] = [];

const mockAgentStatuses: Record<AgentType, AgentState> = {
  [AgentType.SEO_WRITER]: AgentState.READY,
  [AgentType.EMAIL_MARKETER]: AgentState.READY,
  [AgentType.CMO]: AgentState.READY
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('content');
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);

  const handleAgentAction = (
    agentType: AgentType,
    action: JobActionType,
    params: Record<string, any>
  ) => {
    console.log('Agent action:', { agentType, action, params });
    // TODO: Implement API call to trigger agent job
  };

  const handleCreateContent = (data: any) => {
    console.log('Create content:', data);
    // TODO: Implement API call
  };

  const handleCreateCampaign = (data: any) => {
    console.log('Create campaign:', data);
    // TODO: Implement API call
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <DashboardHeader
        brand={mockBrand}
        budgetSpent={1250}
        className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-white/10 p-6"
      />

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats */}
        <DashboardStats
          totalContent={mockContentAssets.length}
          activeCampaigns={mockCampaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length}
          totalImpressions={125000}
          totalSpend={1250}
          contentChange={12.5}
          campaignsChange={5.2}
          impressionsChange={23.1}
          spendChange={-8.3}
        />

        {/* Quick Actions */}
        <QuickActionsPanel
          onCreateContent={() => setShowCreateContent(true)}
          onCreateCampaign={() => setShowCreateCampaign(true)}
          onRunAgent={() => setActiveTab('agents')}
        />

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'content' && (
              <ContentAssetList
                assets={mockContentAssets}
                onAssetClick={(id) => console.log('View asset:', id)}
                onAssetEdit={(id) => console.log('Edit asset:', id)}
                onAssetDelete={(id) => console.log('Delete asset:', id)}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignList
                campaigns={mockCampaigns}
                onCampaignEdit={(id) => console.log('Edit campaign:', id)}
                onCampaignDelete={(id) => console.log('Delete campaign:', id)}
              />
            )}

            {activeTab === 'agents' && (
              <div className="space-y-6">
                <AgentControlPanel
                  agentStatuses={mockAgentStatuses}
                  onAgentAction={handleAgentAction}
                />
                <JobHistoryList
                  jobs={mockJobs}
                  onJobView={(id) => console.log('View job:', id)}
                  onJobDelete={(id) => console.log('Delete job:', id)}
                  maxItems={5}
                />
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <MetricsChart data={mockMetricsData} title="Campaign Performance" />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <RecentActivityFeed activities={mockActivities} maxItems={8} />
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateContentAssetModal
        isOpen={showCreateContent}
        onClose={() => setShowCreateContent(false)}
        onSubmit={handleCreateContent}
      />

      <CreateCampaignModal
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        onSubmit={handleCreateCampaign}
      />
    </div>
  );
}
