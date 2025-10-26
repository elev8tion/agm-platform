/**
 * Enums for Agentic Marketing Dashboard
 * Phase 3.1: TypeScript Types
 */

// Content Asset Enums
export enum ContentType {
  BLOG_POST = 'blog_post',
  EMAIL = 'email',
  LANDING_PAGE = 'landing_page',
  SOCIAL_POST = 'social_post',
  VIDEO_SCRIPT = 'video_script',
  AD_COPY = 'ad_copy'
}

export enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Campaign Enums
export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum CampaignGoal {
  AWARENESS = 'awareness',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  RETENTION = 'retention'
}

// Agent Enums
export enum AgentType {
  SEO_WRITER = 'seo_writer',
  EMAIL_MARKETER = 'email_marketer',
  CMO = 'cmo'
}

export enum AgentState {
  READY = 'ready',
  BUSY = 'busy',
  IDLE = 'idle',
  ERROR = 'error'
}

// Job Enums
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum JobActionType {
  RESEARCH = 'research',
  WRITE = 'write',
  OPTIMIZE = 'optimize',
  CREATE_EMAIL = 'create_email',
  CREATE_SERIES = 'create_series',
  ANALYZE = 'analyze',
  REVIEW = 'review'
}

// Time Range Enum
export enum TimeRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  ALL_TIME = 'all_time'
}
