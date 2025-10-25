# Phase 3.2: Content Asset Components

## Overview

Content Asset components display marketing content (blog posts, landing pages, emails, email series) with status indicators, SEO scores, and action controls. These components handle the full content lifecycle from research through publishing.

## Prerequisites

- **Phase 3.1 Complete**: TypeScript types defined
- **Phase 1-2 Complete**: API endpoints available
- **Dependencies**: Next.js 16, React 19, Tailwind CSS v4, Radix UI

## Component Design

### Visual Specifications

**Status Colors:**
- `researching`: Purple (Indigo 400)
- `draft`: Blue (Sky 500)
- `polishing`: Amber (Amber 500)
- `published`: Green (Emerald 500)
- `archived`: Gray (Slate 400)

**Card Design:**
- Semi-transparent background: `bg-slate-900/50`
- Backdrop blur: `backdrop-blur-md`
- Border with status color glow on hover
- Smooth transitions: `transition-all duration-200`

**Typography:**
- Title: `text-lg font-semibold text-slate-100`
- Metadata: `text-sm text-slate-400`
- Body text: `text-slate-300`

## Component Tree

```
ContentAssetCard (Client)
├── StatusBadge (Server)
├── SEOScoreDisplay (Server)
├── WordCountDisplay (Server)
├── ActionButtons (Client)
└── InternalLinksPreview (Server)

ContentAssetList (Server)
├── ContentAssetCard[] (Client)
├── FilterBar (Client)
├── EmptyState (Server)
└── LoadMoreButton (Client)

ContentAssetDetail (Server)
├── ContentHeader (Server)
├── ContentEditor (Client)
├── SEOPanel (Server)
└── PublishControls (Client)

CreateContentAssetModal (Client)
├── Modal (Client)
├── ContentTypeSelector (Client)
├── KeywordInput (Client)
└── AgentActionButtons (Client)
```

## Complete Implementation

### components/content-assets/StatusBadge.tsx

```typescript
/**
 * StatusBadge Component (Server Component)
 *
 * Displays content status with color coding
 */

import { ContentStatus } from '@/types';

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

const statusConfig = {
  [ContentStatus.RESEARCHING]: {
    label: 'Researching',
    className: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
  },
  [ContentStatus.DRAFT]: {
    label: 'Draft',
    className: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
  },
  [ContentStatus.POLISHING]: {
    label: 'Polishing',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  [ContentStatus.PUBLISHED]: {
    label: 'Published',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  [ContentStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.className} ${className}
      `}
    >
      <span className="relative flex h-2 w-2 mr-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      {config.label}
    </span>
  );
}
```

### components/content-assets/SEOScoreDisplay.tsx

```typescript
/**
 * SEOScoreDisplay Component (Server Component)
 *
 * Shows SEO score with visual indicator
 */

interface SEOScoreDisplayProps {
  score?: number;
  className?: string;
}

export function SEOScoreDisplay({ score, className = '' }: SEOScoreDisplayProps) {
  if (score === undefined) {
    return (
      <div className={`text-sm text-slate-400 ${className}`}>
        No SEO score yet
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${score * 1.76} 176`}
            className={getScoreColor(score)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-300">SEO Score</span>
        <span className={`text-xs ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
```

### components/content-assets/ContentAssetCard.tsx

```typescript
'use client';

/**
 * ContentAssetCard Component (Client Component)
 *
 * Displays individual content asset with actions
 */

import { ContentAsset } from '@/types';
import { StatusBadge } from './StatusBadge';
import { SEOScoreDisplay } from './SEOScoreDisplay';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, Edit, Trash2, ExternalLink, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContentAssetCardProps {
  asset: ContentAsset;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  onPolish?: (id: string) => void;
  showActions?: boolean;
}

export function ContentAssetCard({
  asset,
  onEdit,
  onDelete,
  onPublish,
  onPolish,
  showActions = true
}: ContentAssetCardProps) {
  const canPublish = asset.status === 'draft' || asset.status === 'polishing';
  const canPolish = asset.status === 'draft';

  return (
    <Card
      className="group hover:border-indigo-500/50 transition-all duration-200"
      status={asset.status === 'published' ? 'success' : 'default'}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-100 truncate">
                {asset.title}
              </h3>
              {asset.published_url && (
                <a
                  href={asset.published_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="capitalize">{asset.content_type.replace('_', ' ')}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(asset.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          <StatusBadge status={asset.status} />
        </div>

        {/* Excerpt */}
        {asset.excerpt && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">
            {asset.excerpt}
          </p>
        )}

        {/* Metadata Row */}
        <div className="flex items-center gap-6 mb-4">
          {/* Word Count */}
          {asset.word_count && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="font-mono">{asset.word_count.toLocaleString()}</span>
              <span>words</span>
            </div>
          )}

          {/* Reading Time */}
          {asset.reading_time && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="font-mono">{asset.reading_time}</span>
              <span>min read</span>
            </div>
          )}

          {/* Keywords */}
          {asset.target_keywords && asset.target_keywords.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="font-mono">{asset.target_keywords.length}</span>
              <span>keywords</span>
            </div>
          )}

          {/* Internal Links */}
          {asset.internal_links && asset.internal_links.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-slate-400">
              <span className="font-mono">{asset.internal_links.length}</span>
              <span>links</span>
            </div>
          )}
        </div>

        {/* SEO Score */}
        {asset.seo_metadata?.score !== undefined && (
          <div className="mb-4">
            <SEOScoreDisplay score={asset.seo_metadata.score} />
          </div>
        )}

        {/* Keywords Preview */}
        {asset.target_keywords && asset.target_keywords.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {asset.target_keywords.slice(0, 5).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                >
                  {keyword}
                </span>
              ))}
              {asset.target_keywords.length > 5 && (
                <span className="px-2 py-1 text-xs text-slate-400">
                  +{asset.target_keywords.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(asset.id)}
                icon={<Edit className="w-4 h-4" />}
              >
                Edit
              </Button>
            )}

            {canPolish && onPolish && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onPolish(asset.id)}
                icon={<Sparkles className="w-4 h-4" />}
              >
                Polish
              </Button>
            )}

            {canPublish && onPublish && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onPublish(asset.id)}
              >
                Publish
              </Button>
            )}

            {asset.published_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(asset.published_url!, '_blank')}
                icon={<Eye className="w-4 h-4" />}
              >
                View
              </Button>
            )}

            {onDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(asset.id)}
                icon={<Trash2 className="w-4 h-4" />}
                className="ml-auto"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
```

### components/content-assets/ContentAssetList.tsx

```typescript
/**
 * ContentAssetList Component (Server Component)
 *
 * Displays grid of content assets with filtering
 */

import { ContentAsset } from '@/types';
import { ContentAssetCard } from './ContentAssetCard';
import { FileText } from 'lucide-react';

interface ContentAssetListProps {
  assets: ContentAsset[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function ContentAssetList({
  assets,
  loading = false,
  emptyMessage = 'No content assets yet. Create your first one!',
  onLoadMore,
  hasMore = false
}: ContentAssetListProps) {
  // Empty state
  if (!loading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Content Yet</h3>
        <p className="text-sm text-slate-400 text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Loading skeleton
  if (loading && assets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-64 rounded-lg bg-slate-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <ContentAssetCard
            key={asset.id}
            asset={asset}
            showActions={true}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### components/content-assets/ContentAssetDetail.tsx

```typescript
'use client';

/**
 * ContentAssetDetail Component (Client Component)
 *
 * Full detail view with editing capabilities
 */

import { useState, useEffect } from 'react';
import { ContentAsset, UpdateContentAssetRequest } from '@/types';
import { StatusBadge } from './StatusBadge';
import { SEOScoreDisplay } from './SEOScoreDisplay';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Save, Eye, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from '@/lib/toast';

interface ContentAssetDetailProps {
  assetId: string;
  onUpdate?: (asset: ContentAsset) => void;
}

export function ContentAssetDetail({ assetId, onUpdate }: ContentAssetDetailProps) {
  const [asset, setAsset] = useState<ContentAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [excerpt, setExcerpt] = useState('');

  useEffect(() => {
    fetchAsset();
  }, [assetId]);

  async function fetchAsset() {
    try {
      setLoading(true);
      const response = await fetch(`/api/content-assets/${assetId}`);
      if (!response.ok) throw new Error('Failed to fetch asset');

      const data = await response.json();
      setAsset(data);
      setTitle(data.title);
      setBody(data.body || '');
      setExcerpt(data.excerpt || '');
    } catch (error) {
      toast.error('Failed to load content asset');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!asset) return;

    try {
      setSaving(true);

      const updates: UpdateContentAssetRequest = {
        title,
        body,
        excerpt
      };

      const response = await fetch(`/api/content-assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to save');

      const updated = await response.json();
      setAsset(updated);
      onUpdate?.(updated);
      toast.success('Changes saved!');
    } catch (error) {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-800 rounded w-1/3" />
        <div className="h-64 bg-slate-800 rounded" />
      </div>
    );
  }

  if (!asset) {
    return <div className="text-slate-400">Content asset not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-100">{asset.title}</h1>
            {asset.published_url && (
              <a
                href={asset.published_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="capitalize">{asset.content_type.replace('_', ' ')}</span>
            <StatusBadge status={asset.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleSave}
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            Save
          </Button>
          <Button variant="primary" icon={<Eye className="w-4 h-4" />}>
            Preview
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Word Count</div>
            <div className="text-2xl font-bold text-slate-100">
              {asset.word_count?.toLocaleString() || 0}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="text-sm text-slate-400 mb-1">Reading Time</div>
            <div className="text-2xl font-bold text-slate-100">
              {asset.reading_time || 0} min
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <SEOScoreDisplay score={asset.seo_metadata?.score} />
          </div>
        </Card>
      </div>

      {/* Editor */}
      <Card>
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-xs text-slate-400 mt-1">
              {excerpt.length}/300 characters
            </div>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Content
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={20}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* SEO Panel */}
      {asset.seo_metadata && (
        <Card title="SEO Metadata">
          <div className="p-6 space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-300 mb-1">Meta Title</div>
              <div className="text-slate-400">{asset.seo_metadata.title}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300 mb-1">Meta Description</div>
              <div className="text-slate-400">{asset.seo_metadata.description}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300 mb-1">Keywords</div>
              <div className="flex flex-wrap gap-2">
                {asset.seo_metadata.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Internal Links */}
      {asset.internal_links && asset.internal_links.length > 0 && (
        <Card title="Internal Links">
          <div className="p-6">
            <div className="space-y-3">
              {asset.internal_links.map((link, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-300 truncate">
                      {link.anchor_text}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {link.url}
                    </div>
                  </div>
                  {link.target_keyword && (
                    <span className="px-2 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {link.target_keyword}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### components/content-assets/CreateContentAssetModal.tsx

```typescript
'use client';

/**
 * CreateContentAssetModal Component (Client Component)
 *
 * Modal form to trigger research/write actions
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ContentType } from '@/types';
import { Search, PenTool } from 'lucide-react';
import { toast } from '@/lib/toast';

interface CreateContentAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (assetId: string) => void;
  initialCampaignId?: string;
}

export function CreateContentAssetModal({
  isOpen,
  onClose,
  onSuccess,
  initialCampaignId
}: CreateContentAssetModalProps) {
  const [step, setStep] = useState<'type' | 'action' | 'input'>('type');
  const [contentType, setContentType] = useState<ContentType>(ContentType.BLOG_POST);
  const [action, setAction] = useState<'research' | 'write'>('research');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setSubmitting(true);

      const keywordArray = keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const endpoint = action === 'research' ? '/api/agents/seo/research' : '/api/agents/seo/write';
      const body = action === 'research'
        ? { topic, target_keywords: keywordArray, campaign_id: initialCampaignId }
        : { brief: topic, target_keywords: keywordArray, campaign_id: initialCampaignId };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to create job');

      const job = await response.json();
      toast.success(`${action === 'research' ? 'Research' : 'Writing'} job started!`);
      onSuccess?.(job.id);
      handleClose();
    } catch (error) {
      toast.error('Failed to create content');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setStep('type');
    setTopic('');
    setKeywords('');
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Content"
      size="md"
    >
      <div className="space-y-6">
        {/* Step 1: Select Content Type */}
        {step === 'type' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              What type of content do you want to create?
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(ContentType).map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${
                      contentType === type
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }
                  `}
                >
                  <div className="font-medium text-slate-200 capitalize">
                    {type.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="primary"
              onClick={() => setStep('action')}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 2: Select Action */}
        {step === 'action' && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400">
              How would you like to create this content?
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setAction('research');
                  setStep('input');
                }}
                className="w-full p-4 rounded-lg border-2 border-slate-700 hover:border-indigo-500 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">Research First</div>
                    <div className="text-sm text-slate-400">
                      Agent will research topic and create outline
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setAction('write');
                  setStep('input');
                }}
                className="w-full p-4 rounded-lg border-2 border-slate-700 hover:border-indigo-500 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <PenTool className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">Write Directly</div>
                    <div className="text-sm text-slate-400">
                      Provide brief and agent will write full article
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setStep('type')}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step 3: Input */}
        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {action === 'research' ? 'Topic' : 'Brief'}
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                placeholder={
                  action === 'research'
                    ? 'Enter the topic you want to research...'
                    : 'Provide a detailed brief for the content...'
                }
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="seo, content marketing, ai writing"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('action')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!topic.trim()}
                className="flex-1"
              >
                {action === 'research' ? 'Start Research' : 'Start Writing'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

## Styling

All components use consistent Tailwind classes:

- **Cards**: `bg-slate-900/50 backdrop-blur-md border border-slate-800`
- **Hover**: `hover:border-indigo-500/50 transition-all duration-200`
- **Text**: `text-slate-100` (primary), `text-slate-300` (secondary), `text-slate-400` (muted)
- **Buttons**: See UI Primitives document
- **Status**: Dynamic colors based on status enum

## Accessibility

- All interactive elements have `aria-label` or visible text
- Keyboard navigation supported (Tab, Enter, Escape)
- Focus indicators visible (ring-2 ring-indigo-500)
- Screen reader friendly status announcements
- Semantic HTML (headings, lists, buttons)

## Usage Examples

### Page Integration

```typescript
// app/content-assets/page.tsx
import { ContentAssetList } from '@/components/content-assets/ContentAssetList';

export default async function ContentAssetsPage() {
  const response = await fetch('/api/content-assets');
  const assets = await response.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-100 mb-8">Content Assets</h1>
      <ContentAssetList assets={assets.items} />
    </div>
  );
}
```

### Detail Page

```typescript
// app/content-assets/[id]/page.tsx
import { ContentAssetDetail } from '@/components/content-assets/ContentAssetDetail';

export default function ContentAssetDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContentAssetDetail assetId={params.id} />
    </div>
  );
}
```

## Testing

```typescript
// __tests__/ContentAssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentAssetCard } from '@/components/content-assets/ContentAssetCard';
import { ContentStatus } from '@/types';

describe('ContentAssetCard', () => {
  const mockAsset = {
    id: '123',
    brand_id: 'brand-1',
    title: 'Test Post',
    content_type: 'blog_post',
    status: ContentStatus.DRAFT,
    word_count: 1500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  it('renders asset title', () => {
    render(<ContentAssetCard asset={mockAsset} />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<ContentAssetCard asset={mockAsset} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith('123');
  });

  it('shows SEO score if available', () => {
    const assetWithSEO = {
      ...mockAsset,
      seo_metadata: { score: 85, title: 'Test', description: 'Desc', keywords: [] }
    };

    render(<ContentAssetCard asset={assetWithSEO} />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });
});
```

## Troubleshooting

**Issue: Status badge not showing**
- Verify `status` field matches `ContentStatus` enum values
- Check CSS class application in StatusBadge component

**Issue: Images/SEO scores not updating**
- Ensure proper cache invalidation in API routes
- Use `revalidatePath` or `revalidateTag` after updates

**Issue: Load more button not working**
- Check `hasMore` and `onLoadMore` props are passed correctly
- Verify pagination logic in parent component

## Next Steps

Proceed to:
- **Document 13**: Campaign Components
- **Document 14**: Agent Job Components
- **Document 15**: Agent Control Panel
