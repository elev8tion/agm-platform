/**
 * Core type definitions for the application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  startDate: string;
  endDate?: string;
  metrics: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  roi: number;
}

export interface ContentAsset {
  id: string;
  title: string;
  type: 'blog' | 'email' | 'social' | 'video';
  status: 'draft' | 'review' | 'published';
  content: string;
  metadata: Record<string, unknown>;
  agentId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  type: 'seo_writer' | 'email_marketer' | 'social_media' | 'analyst';
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  completedTasks: number;
  createdAt: string;
}

export interface AgentJob {
  id: string;
  agentId: string;
  type: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  createdAt: string;
}
