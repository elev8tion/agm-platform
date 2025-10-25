# Phase 3.1: TypeScript Types System

## Overview

This document defines the complete TypeScript type system for the Agentic Marketing Dashboard. All types are centralized in the `types/` directory and organized by domain (models, API, utilities). This ensures type safety across the entire application and provides autocomplete/IntelliSense support.

## Prerequisites

- **Phase 1 Complete**: Database schema and API structure defined
- **Phase 2 Complete**: Backend Python models established
- **TypeScript 5.3+**: For latest type features
- **Zod 3.22+**: For runtime validation

## Type System Architecture

### Type Organization

```
types/
├── index.ts         # Re-exports all types (single import point)
├── models.ts        # Domain models (Agent, ContentAsset, Campaign, Job)
├── api.ts           # API request/response types
├── enums.ts         # Enum definitions
├── ui.ts            # UI component prop types
└── utils.ts         # Utility types
```

### Design Principles

1. **Single Source of Truth**: Each type defined once, imported everywhere
2. **Runtime Validation**: Zod schemas for API boundaries
3. **Strict Typing**: No `any` types, prefer `unknown` for unknowns
4. **Branded Types**: Use nominal typing for IDs to prevent mix-ups
5. **Discriminated Unions**: For polymorphic data (e.g., different job types)

## Complete Implementation

### types/enums.ts

```typescript
/**
 * Enum Definitions
 *
 * All enums used throughout the application.
 * These match the Python backend enums.
 */

export enum ContentStatus {
  RESEARCHING = 'researching',
  DRAFT = 'draft',
  POLISHING = 'polishing',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum AgentType {
  SEO_WRITER = 'seo_writer',
  EMAIL_MARKETER = 'email_marketer',
  CMO = 'cmo'
}

export enum AgentState {
  READY = 'ready',
  BUSY = 'busy',
  ERROR = 'error',
  IDLE = 'idle'
}

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum ContentType {
  BLOG_POST = 'blog_post',
  LANDING_PAGE = 'landing_page',
  EMAIL = 'email',
  EMAIL_SERIES = 'email_series',
  SOCIAL_POST = 'social_post'
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

export enum TimeRange {
  LAST_7_DAYS = 'last_7_days',
  LAST_30_DAYS = 'last_30_days',
  LAST_90_DAYS = 'last_90_days',
  LAST_YEAR = 'last_year',
  ALL_TIME = 'all_time'
}
```

### types/models.ts

```typescript
/**
 * Domain Models
 *
 * Core business entities matching the database schema
 * and Python Pydantic models.
 */

import { z } from 'zod';
import {
  ContentStatus,
  AgentType,
  AgentState,
  JobStatus,
  CampaignStatus,
  ContentType,
  JobActionType
} from './enums';

// Branded types for IDs (prevents mixing up different ID types)
export type BrandId = string & { readonly brand: unique symbol };
export type CampaignId = string & { readonly brand: unique symbol };
export type ContentAssetId = string & { readonly brand: unique symbol };
export type AgentJobId = string & { readonly brand: unique symbol };

// Zod schemas for runtime validation
export const DateStringSchema = z.string().datetime();
export const URLSchema = z.string().url();

// ==================== Content Asset ====================

export const SEOMetadataSchema = z.object({
  title: z.string().max(60),
  description: z.string().max(160),
  keywords: z.array(z.string()),
  score: z.number().min(0).max(100).optional()
});

export type SEOMetadata = z.infer<typeof SEOMetadataSchema>;

export const InternalLinkSchema = z.object({
  url: z.string(),
  anchor_text: z.string(),
  target_keyword: z.string().optional()
});

export type InternalLink = z.infer<typeof InternalLinkSchema>;

export const ContentAssetSchema = z.object({
  id: z.string(),
  brand_id: z.string(),
  campaign_id: z.string().nullable(),

  // Core fields
  title: z.string(),
  content_type: z.nativeEnum(ContentType),
  status: z.nativeEnum(ContentStatus),

  // Content
  body: z.string().optional(),
  excerpt: z.string().max(300).optional(),

  // SEO
  seo_metadata: SEOMetadataSchema.optional(),
  target_keywords: z.array(z.string()).default([]),
  internal_links: z.array(InternalLinkSchema).default([]),

  // Metadata
  word_count: z.number().int().nonnegative().optional(),
  reading_time: z.number().int().nonnegative().optional(), // minutes

  // Publishing
  published_url: z.string().url().nullable(),
  published_at: DateStringSchema.nullable(),

  // Agent tracking
  created_by_agent: z.nativeEnum(AgentType).optional(),
  created_by_job_id: z.string().optional(),

  // Timestamps
  created_at: DateStringSchema,
  updated_at: DateStringSchema
});

export type ContentAsset = z.infer<typeof ContentAssetSchema>;

// ==================== Campaign ====================

export const CampaignMetricsSchema = z.object({
  impressions: z.number().int().nonnegative().default(0),
  clicks: z.number().int().nonnegative().default(0),
  conversions: z.number().int().nonnegative().default(0),
  revenue: z.number().nonnegative().default(0),
  cost: z.number().nonnegative().default(0)
});

export type CampaignMetrics = z.infer<typeof CampaignMetricsSchema>;

export const CampaignSchema = z.object({
  id: z.string(),
  brand_id: z.string(),

  // Core fields
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.nativeEnum(CampaignStatus),

  // Targeting
  target_audience: z.string().optional(),
  target_keywords: z.array(z.string()).default([]),

  // Budget
  budget: z.number().nonnegative().optional(),
  budget_spent: z.number().nonnegative().default(0),

  // Metrics
  metrics: CampaignMetricsSchema.optional(),

  // Schedule
  start_date: DateStringSchema.nullable(),
  end_date: DateStringSchema.nullable(),

  // Timestamps
  created_at: DateStringSchema,
  updated_at: DateStringSchema
});

export type Campaign = z.infer<typeof CampaignSchema>;

// ==================== Agent Job ====================

export const JobProgressSchema = z.object({
  percentage: z.number().min(0).max(100),
  current_step: z.string().optional(),
  total_steps: z.number().int().positive().optional(),
  completed_steps: z.number().int().nonnegative().optional()
});

export type JobProgress = z.infer<typeof JobProgressSchema>;

export const JobCostSchema = z.object({
  input_tokens: z.number().int().nonnegative().default(0),
  output_tokens: z.number().int().nonnegative().default(0),
  total_cost_usd: z.number().nonnegative().default(0)
});

export type JobCost = z.infer<typeof JobCostSchema>;

export const AgentJobSchema = z.object({
  id: z.string(),
  brand_id: z.string(),

  // Job details
  agent_type: z.nativeEnum(AgentType),
  action_type: z.nativeEnum(JobActionType),
  status: z.nativeEnum(JobStatus),

  // Input/Output
  input_params: z.record(z.any()),
  output_data: z.record(z.any()).optional(),

  // Progress tracking
  progress: JobProgressSchema.optional(),

  // Cost tracking
  cost: JobCostSchema.optional(),

  // Results
  result_content_asset_id: z.string().nullable(),

  // Error handling
  error_message: z.string().optional(),
  retry_count: z.number().int().nonnegative().default(0),

  // Timing
  started_at: DateStringSchema.nullable(),
  completed_at: DateStringSchema.nullable(),
  estimated_completion_at: DateStringSchema.nullable(),

  // Timestamps
  created_at: DateStringSchema,
  updated_at: DateStringSchema
});

export type AgentJob = z.infer<typeof AgentJobSchema>;

// ==================== Brand ====================

export const BrandVoiceSchema = z.object({
  tone: z.string(),
  style: z.string(),
  guidelines: z.string().optional()
});

export type BrandVoice = z.infer<typeof BrandVoiceSchema>;

export const BrandSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  domain: z.string().url().optional(),
  industry: z.string().optional(),

  // Brand voice
  voice: BrandVoiceSchema.optional(),

  // Settings
  default_model: z.string().default('gpt-4o-mini'),
  vector_store_id: z.string().optional(),

  // Budget
  monthly_budget: z.number().nonnegative().optional(),
  budget_spent_this_month: z.number().nonnegative().default(0),

  // Timestamps
  created_at: DateStringSchema,
  updated_at: DateStringSchema
});

export type Brand = z.infer<typeof BrandSchema>;

// ==================== Agent Status ====================

export const AgentStatusSchema = z.object({
  agent_type: z.nativeEnum(AgentType),
  state: z.nativeEnum(AgentState),
  current_job_id: z.string().nullable(),
  last_active_at: DateStringSchema.nullable(),
  total_jobs_completed: z.number().int().nonnegative().default(0),
  total_cost_usd: z.number().nonnegative().default(0)
});

export type AgentStatus = z.infer<typeof AgentStatusSchema>;
```

### types/api.ts

```typescript
/**
 * API Types
 *
 * Request/response types for all API endpoints.
 * Organized by endpoint group.
 */

import { z } from 'zod';
import {
  ContentAsset,
  ContentAssetSchema,
  Campaign,
  CampaignSchema,
  AgentJob,
  AgentJobSchema,
  AgentStatus,
  AgentStatusSchema,
  Brand,
  BrandSchema
} from './models';
import { ContentStatus, CampaignStatus, JobStatus, TimeRange } from './enums';

// ==================== Generic API Types ====================

export const PaginationParamsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total_pages: z.number().int().nonnegative()
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export const APIErrorSchema = z.object({
  error: z.string(),
  details: z.any().optional(),
  code: z.string().optional()
});

export type APIError = z.infer<typeof APIErrorSchema>;

// ==================== Content Asset API ====================

export const CreateContentAssetRequestSchema = z.object({
  title: z.string().min(1).max(200),
  content_type: z.string(),
  campaign_id: z.string().optional(),
  target_keywords: z.array(z.string()).default([])
});

export type CreateContentAssetRequest = z.infer<typeof CreateContentAssetRequestSchema>;

export const UpdateContentAssetRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().optional(),
  excerpt: z.string().max(300).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  seo_metadata: z.any().optional(),
  target_keywords: z.array(z.string()).optional()
});

export type UpdateContentAssetRequest = z.infer<typeof UpdateContentAssetRequestSchema>;

export const ListContentAssetsParamsSchema = PaginationParamsSchema.extend({
  status: z.nativeEnum(ContentStatus).optional(),
  campaign_id: z.string().optional(),
  content_type: z.string().optional(),
  search: z.string().optional()
});

export type ListContentAssetsParams = z.infer<typeof ListContentAssetsParamsSchema>;

export type ListContentAssetsResponse = PaginatedResponse<ContentAsset>;

export const PublishContentAssetRequestSchema = z.object({
  publish_to_cms: z.boolean().default(false),
  schedule_at: z.string().datetime().optional()
});

export type PublishContentAssetRequest = z.infer<typeof PublishContentAssetRequestSchema>;

// ==================== Campaign API ====================

export const CreateCampaignRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  target_audience: z.string().optional(),
  target_keywords: z.array(z.string()).default([]),
  budget: z.number().nonnegative().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
});

export type CreateCampaignRequest = z.infer<typeof CreateCampaignRequestSchema>;

export const UpdateCampaignRequestSchema = CreateCampaignRequestSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional()
});

export type UpdateCampaignRequest = z.infer<typeof UpdateCampaignRequestSchema>;

export const ListCampaignsParamsSchema = PaginationParamsSchema.extend({
  status: z.nativeEnum(CampaignStatus).optional(),
  search: z.string().optional()
});

export type ListCampaignsParams = z.infer<typeof ListCampaignsParamsSchema>;

export type ListCampaignsResponse = PaginatedResponse<Campaign>;

// ==================== Agent Job API ====================

export const CreateAgentJobRequestSchema = z.object({
  agent_type: z.string(),
  action_type: z.string(),
  input_params: z.record(z.any())
});

export type CreateAgentJobRequest = z.infer<typeof CreateAgentJobRequestSchema>;

export const ListAgentJobsParamsSchema = PaginationParamsSchema.extend({
  status: z.nativeEnum(JobStatus).optional(),
  agent_type: z.string().optional(),
  action_type: z.string().optional()
});

export type ListAgentJobsParams = z.infer<typeof ListAgentJobsParamsSchema>;

export type ListAgentJobsResponse = PaginatedResponse<AgentJob>;

export const CancelJobRequestSchema = z.object({
  reason: z.string().optional()
});

export type CancelJobRequest = z.infer<typeof CancelJobRequestSchema>;

// ==================== Agent Control API ====================

export const ResearchRequestSchema = z.object({
  topic: z.string().min(1).max(500),
  target_keywords: z.array(z.string()).default([]),
  campaign_id: z.string().optional()
});

export type ResearchRequest = z.infer<typeof ResearchRequestSchema>;

export const WriteRequestSchema = z.object({
  brief: z.string().min(1),
  target_keywords: z.array(z.string()).default([]),
  campaign_id: z.string().optional(),
  auto_polish: z.boolean().default(true)
});

export type WriteRequest = z.infer<typeof WriteRequestSchema>;

export const OptimizeRequestSchema = z.object({
  url: z.string().url(),
  focus_keywords: z.array(z.string()).optional()
});

export type OptimizeRequest = z.infer<typeof OptimizeRequestSchema>;

export const CreateEmailRequestSchema = z.object({
  brief: z.string().min(1),
  subject_line: z.string().max(100).optional(),
  campaign_id: z.string().optional()
});

export type CreateEmailRequest = z.infer<typeof CreateEmailRequestSchema>;

export const CreateEmailSeriesRequestSchema = z.object({
  brief: z.string().min(1),
  num_emails: z.number().int().min(2).max(10).default(5),
  campaign_id: z.string().optional()
});

export type CreateEmailSeriesRequest = z.infer<typeof CreateEmailSeriesRequestSchema>;

export const AnalyzeRequestSchema = z.object({
  time_range: z.nativeEnum(TimeRange).default(TimeRange.LAST_30_DAYS),
  focus_areas: z.array(z.string()).optional()
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export const ReviewRequestSchema = z.object({
  time_range: z.nativeEnum(TimeRange).default(TimeRange.LAST_30_DAYS),
  include_recommendations: z.boolean().default(true)
});

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;

// ==================== Dashboard API ====================

export const DashboardStatsSchema = z.object({
  total_content_assets: z.number().int().nonnegative(),
  total_campaigns: z.number().int().nonnegative(),
  active_jobs: z.number().int().nonnegative(),
  budget_spent_this_month: z.number().nonnegative(),
  content_by_status: z.record(z.nativeEnum(ContentStatus), z.number().int().nonnegative()),
  jobs_by_status: z.record(z.nativeEnum(JobStatus), z.number().int().nonnegative())
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export const RecentActivitySchema = z.object({
  id: z.string(),
  type: z.enum(['content_created', 'job_completed', 'campaign_started', 'content_published']),
  message: z.string(),
  timestamp: z.string().datetime(),
  related_id: z.string().optional()
});

export type RecentActivity = z.infer<typeof RecentActivitySchema>;

export type GetDashboardResponse = {
  stats: DashboardStats;
  recent_activity: RecentActivity[];
  agent_statuses: AgentStatus[];
};
```

### types/ui.ts

```typescript
/**
 * UI Component Types
 *
 * Prop types for all UI components.
 */

import { ReactNode } from 'react';
import { ContentAsset, Campaign, AgentJob, AgentStatus } from './models';

// ==================== Common UI Types ====================

export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type Size = 'sm' | 'md' | 'lg';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// ==================== Layout Props ====================

export interface PageProps {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
}

export interface LayoutProps {
  children: ReactNode;
  params?: Record<string, string>;
}

// ==================== Button Props ====================

export interface ButtonProps extends BaseComponentProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  icon?: ReactNode;
}

// ==================== Card Props ====================

export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  status?: 'default' | 'success' | 'warning' | 'error';
  glow?: boolean;
}

// ==================== Modal Props ====================

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
}

// ==================== Content Asset Component Props ====================

export interface ContentAssetCardProps {
  asset: ContentAsset;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  showActions?: boolean;
}

export interface ContentAssetListProps {
  assets: ContentAsset[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface ContentAssetDetailProps {
  assetId: string;
  onUpdate?: (asset: ContentAsset) => void;
}

export interface CreateContentAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (asset: ContentAsset) => void;
  initialCampaignId?: string;
}

// ==================== Campaign Component Props ====================

export interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showMetrics?: boolean;
}

export interface CampaignListProps {
  campaigns: Campaign[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export interface CampaignDetailProps {
  campaignId: string;
  onUpdate?: (campaign: Campaign) => void;
}

export interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaign: Campaign) => void;
}

// ==================== Agent Job Component Props ====================

export interface AgentJobCardProps {
  job: AgentJob;
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  showOutput?: boolean;
}

export interface JobProgressBarProps {
  job: AgentJob;
  showPercentage?: boolean;
  showEstimate?: boolean;
}

export interface JobStreamingOutputProps {
  jobId: string;
  autoScroll?: boolean;
}

export interface JobHistoryListProps {
  jobs: AgentJob[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// ==================== Agent Control Component Props ====================

export interface AgentControlPanelProps {
  brandId: string;
}

export interface SEOAgentPanelProps {
  status: AgentStatus;
  onResearch: (topic: string, keywords: string[]) => void;
  onWrite: (brief: string, keywords: string[]) => void;
  onOptimize: (url: string, keywords: string[]) => void;
}

export interface EmailAgentPanelProps {
  status: AgentStatus;
  onCreate: (brief: string) => void;
  onCreateSeries: (brief: string, numEmails: number) => void;
}

export interface CMOAgentPanelProps {
  status: AgentStatus;
  onAnalyze: (timeRange: string) => void;
  onReview: (timeRange: string) => void;
}

// ==================== Dashboard Component Props ====================

export interface DashboardStatsProps {
  stats: {
    total_content_assets: number;
    total_campaigns: number;
    active_jobs: number;
    budget_spent_this_month: number;
  };
}

export interface QuickActionsPanelProps {
  onAction: (action: string) => void;
}

export interface RecentActivityFeedProps {
  activities: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  loading?: boolean;
}
```

### types/utils.ts

```typescript
/**
 * Utility Types
 *
 * Helper types for common patterns.
 */

// Async utilities
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export type PromiseValue<T> = T extends Promise<infer U> ? U : T;

// Form utilities
export type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
};

export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
};

// Filter utilities
export type FilterParams<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export type SortDirection = 'asc' | 'desc';

export type SortParams<T> = {
  field: keyof T;
  direction: SortDirection;
};

// API utilities
export type APIResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type MutationState<T> = {
  data?: T;
  error?: Error;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
};

// Component utilities
export type PropsWithClassName<P = {}> = P & {
  className?: string;
};

export type PropsWithChildren<P = {}> = P & {
  children?: React.ReactNode;
};

// Conditional utilities
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Event utilities
export type EventHandler<T = void> = (event: T) => void;

export type ChangeHandler<T> = (value: T) => void;

// WebSocket utilities
export type WebSocketMessage<T = any> = {
  type: string;
  payload: T;
  timestamp: string;
};

export type WebSocketState =
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'disconnected'
  | 'error';
```

### types/index.ts

```typescript
/**
 * Central Type Exports
 *
 * Single import point for all types:
 * import { ContentAsset, AgentJob, ... } from '@/types';
 */

// Enums
export * from './enums';

// Models
export * from './models';

// API
export * from './api';

// UI
export * from './ui';

// Utils
export * from './utils';

// Re-export Zod for validation
export { z } from 'zod';
```

## Zod Schema Validation

### Client-Side Form Validation

```typescript
// Example: Validating a form before submission
import { CreateContentAssetRequestSchema } from '@/types';

function validateContentForm(data: unknown) {
  try {
    const validated = CreateContentAssetRequestSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.flatten().fieldErrors
      };
    }
    throw error;
  }
}
```

### API Response Validation

```typescript
// Example: Validating API responses
import { ContentAssetSchema } from '@/types';

async function fetchContentAsset(id: string) {
  const response = await fetch(`/api/content-assets/${id}`);
  const data = await response.json();

  // Validate the response matches expected schema
  return ContentAssetSchema.parse(data);
}
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/types": ["./types"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Usage Examples

### Type-Safe API Calls

```typescript
import { ContentAsset, ListContentAssetsParams, ListContentAssetsResponse } from '@/types';

async function getContentAssets(params: ListContentAssetsParams): Promise<ListContentAssetsResponse> {
  const query = new URLSearchParams(params as any);
  const response = await fetch(`/api/content-assets?${query}`);
  return response.json();
}
```

### Type-Safe Component Props

```typescript
import { ContentAssetCardProps } from '@/types';

export function ContentAssetCard({ asset, onEdit, onDelete }: ContentAssetCardProps) {
  // TypeScript knows all fields of asset and all prop types
  return (
    <div>
      <h3>{asset.title}</h3>
      <p>Status: {asset.status}</p>
      {onEdit && <button onClick={() => onEdit(asset.id)}>Edit</button>}
    </div>
  );
}
```

### Discriminated Unions

```typescript
import { AsyncState } from '@/types';

function DataDisplay<T>({ state }: { state: AsyncState<T> }) {
  // TypeScript narrows the type based on status
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'success':
      return <div>{JSON.stringify(state.data)}</div>; // data available here
    case 'error':
      return <div>Error: {state.error.message}</div>; // error available here
  }
}
```

## Testing

### Type Testing

```typescript
// types/__tests__/models.test.ts
import { describe, it, expect } from 'vitest';
import { ContentAssetSchema, ContentStatus } from '@/types';

describe('ContentAssetSchema', () => {
  it('validates correct content asset', () => {
    const validAsset = {
      id: '123',
      brand_id: 'brand-1',
      campaign_id: null,
      title: 'Test Post',
      content_type: 'blog_post',
      status: ContentStatus.DRAFT,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(() => ContentAssetSchema.parse(validAsset)).not.toThrow();
  });

  it('rejects invalid status', () => {
    const invalidAsset = {
      id: '123',
      brand_id: 'brand-1',
      title: 'Test',
      content_type: 'blog_post',
      status: 'invalid_status', // Wrong!
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    expect(() => ContentAssetSchema.parse(invalidAsset)).toThrow();
  });
});
```

## Troubleshooting

### Common Type Errors

**Error: Type 'string' is not assignable to type 'ContentStatus'**
```typescript
// ❌ Wrong
const status: ContentStatus = 'draft';

// ✅ Correct
const status: ContentStatus = ContentStatus.DRAFT;
```

**Error: Property 'data' does not exist on type 'AsyncState'**
```typescript
// ❌ Wrong - TypeScript doesn't know status is 'success'
function display(state: AsyncState<string>) {
  return state.data; // Error!
}

// ✅ Correct - Narrow the type first
function display(state: AsyncState<string>) {
  if (state.status === 'success') {
    return state.data; // OK!
  }
  return null;
}
```

**Error: Argument of type 'unknown' is not assignable**
```typescript
// ❌ Wrong - API response not validated
const asset = await response.json();
useAsset(asset); // Type error

// ✅ Correct - Validate with Zod
const data = await response.json();
const asset = ContentAssetSchema.parse(data);
useAsset(asset); // OK!
```

### Zod Validation Errors

```typescript
import { fromZodError } from 'zod-validation-error';

try {
  ContentAssetSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Pretty error messages
    const prettyError = fromZodError(error);
    console.error(prettyError.toString());

    // Field-specific errors
    const fieldErrors = error.flatten().fieldErrors;
    console.error(fieldErrors);
  }
}
```

## Next Steps

With types defined, proceed to:
1. **Document 12**: Build Content Asset Components using these types
2. **Document 13**: Build Campaign Components using these types
3. **Document 14**: Build Agent Job Components using these types
4. **Document 15**: Build Agent Control Panel using these types

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Zod Documentation](https://zod.dev/)
- [Next.js TypeScript](https://nextjs.org/docs/app/building-your-application/configuring/typescript)
