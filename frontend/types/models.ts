/**
 * Core Data Models
 * Phase 3.1: TypeScript Types
 */

import {
  ContentType,
  ContentStatus,
  CampaignStatus,
  CampaignGoal,
  AgentType,
  AgentState,
  JobStatus,
  JobActionType,
  TimeRange
} from './enums';

// Content Asset Models
export interface SEOMetadata {
  title_tag: string;
  meta_description: string;
  target_keywords: string[];
  seo_score?: number;
  word_count?: number;
  readability_score?: number;
}

export interface ContentAsset {
  id: string;
  brand_id: string;
  content_type: ContentType;
  title: string;
  content: string;
  status: ContentStatus;
  seo_metadata: SEOMetadata;
  campaign_id?: string;
  agent_job_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

// Campaign Models
export interface CampaignMetrics {
  impressions?: number;
  clicks?: number;
  conversions?: number;
  ctr?: number;
  conversion_rate?: number;
}

export interface Campaign {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  budget_usd: number;
  budget_spent_usd: number;
  start_date?: string;
  end_date?: string;
  target_keywords: string[];
  metrics?: CampaignMetrics;
  created_at: string;
  updated_at: string;
}

// Agent Models
export interface JobProgress {
  percentage: number;
  current_step: string;
  completed_steps: number;
  total_steps: number;
}

export interface JobCost {
  input_tokens: number;
  output_tokens: number;
  total_cost_usd: number;
}

export interface AgentJob {
  id: string;
  brand_id: string;
  agent_type: AgentType;
  action_type: JobActionType;
  status: JobStatus;
  input_params: Record<string, any>;
  progress?: JobProgress;
  result_content_asset_id?: string;
  cost?: JobCost;
  error_message?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion_at?: string;
}

export interface AgentStatus {
  agent_type: AgentType;
  state: AgentState;
  current_job_id?: string;
  total_jobs_completed: number;
  total_cost_usd: number;
  last_activity_at?: string;
}

// Brand Model
export interface Brand {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  monthly_budget_usd: number;
  created_at: string;
  updated_at: string;
}
