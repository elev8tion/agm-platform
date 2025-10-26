/**
 * API Request/Response Types
 * Phase 3.1: TypeScript Types
 */

import {
  ContentAsset,
  Campaign,
  AgentJob,
  AgentStatus,
  Brand
} from './models';
import {
  ContentType,
  ContentStatus,
  CampaignStatus,
  CampaignGoal,
  TimeRange
} from './enums';

// Generic API Response
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Content Asset API
export interface CreateContentAssetRequest {
  brand_id: string;
  content_type: ContentType;
  title: string;
  content: string;
  seo_metadata: {
    title_tag: string;
    meta_description: string;
    target_keywords: string[];
  };
  campaign_id?: string;
}

export interface UpdateContentAssetRequest {
  title?: string;
  content?: string;
  status?: ContentStatus;
  seo_metadata?: {
    title_tag?: string;
    meta_description?: string;
    target_keywords?: string[];
  };
}

export interface ListContentAssetsRequest {
  brand_id: string;
  content_type?: ContentType;
  status?: ContentStatus;
  campaign_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

// Campaign API
export interface CreateCampaignRequest {
  brand_id: string;
  name: string;
  description?: string;
  goal: CampaignGoal;
  budget_usd: number;
  start_date?: string;
  end_date?: string;
  target_keywords: string[];
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  budget_usd?: number;
  start_date?: string;
  end_date?: string;
  target_keywords?: string[];
}

// Agent API
export interface StartResearchJobRequest {
  brand_id: string;
  topic: string;
  target_keywords?: string[];
}

export interface StartWriteJobRequest {
  brand_id: string;
  brief: string;
  target_keywords?: string[];
  auto_polish?: boolean;
  campaign_id?: string;
}

export interface StartOptimizeJobRequest {
  brand_id: string;
  url: string;
  focus_keywords?: string[];
}

export interface StartEmailJobRequest {
  brand_id: string;
  brief: string;
  campaign_id?: string;
}

export interface StartEmailSeriesRequest {
  brand_id: string;
  brief: string;
  num_emails: number;
  campaign_id?: string;
}

export interface StartAnalysisJobRequest {
  brand_id: string;
  time_range: TimeRange;
}

// Dashboard API
export interface DashboardStats {
  total_content_assets: number;
  total_campaigns: number;
  active_jobs: number;
  budget_spent_this_month: number;
  content_assets_change?: number;
  campaigns_change?: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recent_activity: Activity[];
}

export interface Activity {
  id: string;
  type: 'content_created' | 'job_completed' | 'campaign_started' | 'content_published';
  message: string;
  timestamp: string;
  related_id?: string;
}
