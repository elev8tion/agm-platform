# Phase 3.3: Campaign Components

## Overview

Campaign components manage marketing campaigns with budget tracking, performance metrics, content asset associations, and timeline visualization. These components provide a complete campaign management interface from creation through completion.

## Prerequisites

- **Phase 3.1-3.2 Complete**: Types and Content Asset components defined
- **Charting Library**: Recharts for data visualization
- **Date Handling**: date-fns for date formatting

## Component Design

### Visual Specifications

**Campaign Status Colors:**
- `draft`: Slate 500
- `active`: Emerald 500 (with pulsing indicator)
- `paused`: Amber 500
- `completed`: Blue 500
- `archived`: Slate 400

**Metrics Display:**
- Large numbers with abbreviated format (1.2K, 3.5M)
- Percentage changes with up/down indicators
- Color-coded performance (green for positive, red for negative)
- Progress bars for budget utilization

**Card Design:**
- Glow effect for active campaigns
- Budget progress bars with gradient fills
- Metric cards with icons
- Timeline visualization with milestones

## Component Tree

```
CampaignCard (Client)
├── CampaignStatusBadge (Server)
├── BudgetProgressBar (Server)
├── MetricsDisplay (Server)
└── CampaignActions (Client)

CampaignList (Server)
├── CampaignCard[] (Client)
├── FilterBar (Client)
├── SortControls (Client)
└── EmptyState (Server)

CampaignDetail (Server)
├── CampaignHeader (Server)
├── MetricsChart (Client - Recharts)
├── ContentAssetsList (Server)
├── TimelineView (Server)
└── CampaignSettings (Client)

CreateCampaignModal (Client)
├── BasicInfoStep (Client)
├── TargetingStep (Client)
├── BudgetStep (Client)
└── ReviewStep (Server)
```

## Complete Implementation

### components/campaigns/CampaignStatusBadge.tsx

```typescript
/**
 * CampaignStatusBadge Component (Server Component)
 */

import { CampaignStatus } from '@/types';
import { Circle } from 'lucide-react';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  className?: string;
}

const statusConfig = {
  [CampaignStatus.DRAFT]: {
    label: 'Draft',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    showPulse: false
  },
  [CampaignStatus.ACTIVE]: {
    label: 'Active',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    showPulse: true
  },
  [CampaignStatus.PAUSED]: {
    label: 'Paused',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    showPulse: false
  },
  [CampaignStatus.COMPLETED]: {
    label: 'Completed',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    showPulse: false
  },
  [CampaignStatus.ARCHIVED]: {
    label: 'Archived',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    showPulse: false
  }
};

export function CampaignStatusBadge({ status, className = '' }: CampaignStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.className} ${className}
      `}
    >
      {config.showPulse && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {!config.showPulse && <Circle className="w-2 h-2 mr-1.5 fill-current" />}
      {config.label}
    </span>
  );
}
```

### components/campaigns/BudgetProgressBar.tsx

```typescript
/**
 * BudgetProgressBar Component (Server Component)
 */

interface BudgetProgressBarProps {
  budget: number;
  spent: number;
  className?: string;
}

export function BudgetProgressBar({ budget, spent, className = '' }: BudgetProgressBarProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const displayPercentage = Math.min(percentage, 100);

  const getBarColor = () => {
    if (isOverBudget) return 'bg-red-500';
    if (percentage > 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-300">Budget</span>
        <span className={`text-sm font-medium ${isOverBudget ? 'text-red-400' : 'text-slate-300'}`}>
          ${spent.toLocaleString()} / ${budget.toLocaleString()}
        </span>
      </div>
      <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full ${getBarColor()} transition-all duration-500`}
          style={{ width: `${displayPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
        </div>
      </div>
      {isOverBudget && (
        <p className="text-xs text-red-400 mt-1">
          Over budget by ${(spent - budget).toLocaleString()}
        </p>
      )}
    </div>
  );
}
```

### components/campaigns/CampaignCard.tsx

```typescript
'use client';

/**
 * CampaignCard Component (Client Component)
 */

import { Campaign } from '@/types';
import { CampaignStatusBadge } from './CampaignStatusBadge';
import { BudgetProgressBar } from './BudgetProgressBar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2, Play, Pause, TrendingUp, Users, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: Campaign;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, newStatus: string) => void;
  showMetrics?: boolean;
}

export function CampaignCard({
  campaign,
  onEdit,
  onDelete,
  onToggleStatus,
  showMetrics = true
}: CampaignCardProps) {
  const isActive = campaign.status === 'active';
  const canToggle = campaign.status === 'active' || campaign.status === 'paused';

  // Calculate ROI
  const roi = campaign.metrics && campaign.budget_spent > 0
    ? ((campaign.metrics.revenue - campaign.budget_spent) / campaign.budget_spent) * 100
    : 0;

  return (
    <Card
      className={`group transition-all duration-200 ${
        isActive ? 'border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'hover:border-indigo-500/50'
      }`}
      status={isActive ? 'success' : 'default'}
      glow={isActive}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-100 truncate mb-2">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>
                {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
              </span>
              {campaign.start_date && campaign.end_date && (
                <>
                  <span>•</span>
                  <span>
                    {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </div>

        {/* Description */}
        {campaign.description && (
          <p className="text-sm text-slate-300 mb-4 line-clamp-2">
            {campaign.description}
          </p>
        )}

        {/* Metrics Grid */}
        {showMetrics && campaign.metrics && (
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Impressions</div>
              <div className="text-lg font-bold text-slate-100">
                {campaign.metrics.impressions.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Clicks</div>
              <div className="text-lg font-bold text-slate-100">
                {campaign.metrics.clicks.toLocaleString()}
              </div>
            </div>
            <div className="text-center p-3 bg-slate-800/50 rounded-lg">
              <div className="text-xs text-slate-400 mb-1">Conversions</div>
              <div className="text-lg font-bold text-slate-100">
                {campaign.metrics.conversions.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* ROI Display */}
        {showMetrics && campaign.metrics && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
            <TrendingUp className={`w-5 h-5 ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            <div className="flex-1">
              <div className="text-xs text-slate-400">ROI</div>
              <div className={`text-lg font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Revenue</div>
              <div className="text-sm font-medium text-slate-300">
                ${campaign.metrics.revenue.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Budget Progress */}
        {campaign.budget && (
          <BudgetProgressBar
            budget={campaign.budget}
            spent={campaign.budget_spent}
            className="mb-4"
          />
        )}

        {/* Target Audience */}
        {campaign.target_audience && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-slate-800/50 rounded-lg">
            <Users className="w-4 h-4 text-slate-400" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-400 mb-0.5">Target Audience</div>
              <div className="text-sm text-slate-300 truncate">{campaign.target_audience}</div>
            </div>
          </div>
        )}

        {/* Keywords */}
        {campaign.target_keywords && campaign.target_keywords.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-slate-400 mb-2">Target Keywords</div>
            <div className="flex flex-wrap gap-2">
              {campaign.target_keywords.slice(0, 5).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                >
                  {keyword}
                </span>
              ))}
              {campaign.target_keywords.length > 5 && (
                <span className="px-2 py-1 text-xs text-slate-400">
                  +{campaign.target_keywords.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
          {canToggle && onToggleStatus && (
            <Button
              variant={isActive ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => onToggleStatus(campaign.id, isActive ? 'paused' : 'active')}
              icon={isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isActive ? 'Pause' : 'Resume'}
            </Button>
          )}

          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(campaign.id)}
              icon={<Edit className="w-4 h-4" />}
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(campaign.id)}
              icon={<Trash2 className="w-4 h-4" />}
              className="ml-auto"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### components/campaigns/CampaignList.tsx

```typescript
/**
 * CampaignList Component (Server Component)
 */

import { Campaign } from '@/types';
import { CampaignCard } from './CampaignCard';
import { Target } from 'lucide-react';

interface CampaignListProps {
  campaigns: Campaign[];
  loading?: boolean;
  emptyMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export function CampaignList({
  campaigns,
  loading = false,
  emptyMessage = 'No campaigns yet. Create your first campaign!',
  onLoadMore,
  hasMore = false
}: CampaignListProps) {
  // Empty state
  if (!loading && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <Target className="w-8 h-8 text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No Campaigns</h3>
        <p className="text-sm text-slate-400 text-center max-w-md">
          {emptyMessage}
        </p>
      </div>
    );
  }

  // Loading skeleton
  if (loading && campaigns.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-96 rounded-lg bg-slate-900/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            showMetrics={true}
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

### components/campaigns/MetricsChart.tsx

```typescript
'use client';

/**
 * MetricsChart Component (Client Component)
 * Uses Recharts for visualization
 */

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MetricsChartProps {
  data: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
  className?: string;
}

export function MetricsChart({ data, className = '' }: MetricsChartProps) {
  return (
    <div className={`p-6 bg-slate-900/50 backdrop-blur-md rounded-lg border border-slate-800 ${className}`}>
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Performance Metrics</h3>

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9'
            }}
          />
          <Legend
            wrapperStyle={{ color: '#94a3b8' }}
          />
          <Area
            type="monotone"
            dataKey="impressions"
            stroke="#818cf8"
            fill="url(#impressionsGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="#34d399"
            fill="url(#clicksGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke="#fbbf24"
            fill="url(#conversionsGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### components/campaigns/CreateCampaignModal.tsx

```typescript
'use client';

/**
 * CreateCampaignModal Component (Client Component)
 * Multi-step form for campaign creation
 */

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CreateCampaignRequest } from '@/types';
import { Target, Users, DollarSign, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaignId: string) => void;
}

type Step = 'basic' | 'targeting' | 'budget' | 'review';

export function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCampaignModalProps) {
  const [step, setStep] = useState<Step>('basic');
  const [formData, setFormData] = useState<Partial<CreateCampaignRequest>>({
    name: '',
    description: '',
    target_audience: '',
    target_keywords: [],
    budget: undefined,
    start_date: undefined,
    end_date: undefined
  });
  const [submitting, setSubmitting] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');

  async function handleSubmit() {
    try {
      setSubmitting(true);

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create campaign');

      const campaign = await response.json();
      toast.success('Campaign created successfully!');
      onSuccess?.(campaign.id);
      handleClose();
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setStep('basic');
    setFormData({
      name: '',
      description: '',
      target_audience: '',
      target_keywords: [],
      budget: undefined,
      start_date: undefined,
      end_date: undefined
    });
    setKeywordInput('');
    onClose();
  }

  function updateFormData(updates: Partial<CreateCampaignRequest>) {
    setFormData({ ...formData, ...updates });
  }

  function addKeyword() {
    if (!keywordInput.trim()) return;

    updateFormData({
      target_keywords: [...(formData.target_keywords || []), keywordInput.trim()]
    });
    setKeywordInput('');
  }

  function removeKeyword(index: number) {
    const newKeywords = [...(formData.target_keywords || [])];
    newKeywords.splice(index, 1);
    updateFormData({ target_keywords: newKeywords });
  }

  const steps: Record<Step, { title: string; icon: any }> = {
    basic: { title: 'Basic Info', icon: Target },
    targeting: { title: 'Targeting', icon: Users },
    budget: { title: 'Budget & Schedule', icon: DollarSign },
    review: { title: 'Review', icon: CheckCircle }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Campaign"
      size="lg"
    >
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {Object.entries(steps).map(([key, { title, icon: Icon }], idx) => (
            <div key={key} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${
                    step === key
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                      : 'border-slate-700 text-slate-500'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
              {idx < Object.keys(steps).length - 1 && (
                <div className="w-16 h-0.5 bg-slate-700 mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                placeholder="Summer Product Launch"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={4}
                placeholder="Describe your campaign goals and strategy..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              variant="primary"
              onClick={() => setStep('targeting')}
              disabled={!formData.name?.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'targeting' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Audience
              </label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) => updateFormData({ target_audience: e.target.value })}
                placeholder="Tech-savvy millennials interested in productivity"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Target Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="productivity app"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button variant="secondary" onClick={addKeyword}>
                  Add
                </Button>
              </div>

              {formData.target_keywords && formData.target_keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.target_keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-2"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(idx)}
                        className="text-indigo-400/60 hover:text-indigo-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('basic')} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep('budget')} className="flex-1">
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'budget' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget (USD)
              </label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => updateFormData({ budget: parseFloat(e.target.value) })}
                placeholder="5000"
                min="0"
                step="100"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                  onChange={(e) => updateFormData({ start_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                  onChange={(e) => updateFormData({ end_date: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('targeting')} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={() => setStep('review')} className="flex-1">
                Review
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-lg space-y-3">
              <div>
                <div className="text-xs text-slate-400">Campaign Name</div>
                <div className="text-sm text-slate-100 font-medium">{formData.name}</div>
              </div>

              {formData.description && (
                <div>
                  <div className="text-xs text-slate-400">Description</div>
                  <div className="text-sm text-slate-300">{formData.description}</div>
                </div>
              )}

              {formData.target_audience && (
                <div>
                  <div className="text-xs text-slate-400">Target Audience</div>
                  <div className="text-sm text-slate-300">{formData.target_audience}</div>
                </div>
              )}

              {formData.target_keywords && formData.target_keywords.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.target_keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.budget && (
                <div>
                  <div className="text-xs text-slate-400">Budget</div>
                  <div className="text-sm text-slate-100 font-medium">
                    ${formData.budget.toLocaleString()}
                  </div>
                </div>
              )}

              {formData.start_date && formData.end_date && (
                <div>
                  <div className="text-xs text-slate-400">Duration</div>
                  <div className="text-sm text-slate-300">
                    {new Date(formData.start_date).toLocaleDateString()} - {new Date(formData.end_date).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('budget')} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                className="flex-1"
              >
                Create Campaign
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
```

## Accessibility

- Progress indicators have `aria-current` for active step
- Form inputs have associated labels
- Loading states announced to screen readers
- Keyboard navigation through steps (Tab, Enter)
- Focus management on modal open/close

## Usage Examples

```typescript
// app/campaigns/page.tsx
import { CampaignList } from '@/components/campaigns/CampaignList';

export default async function CampaignsPage() {
  const response = await fetch('/api/campaigns');
  const campaigns = await response.json();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-100 mb-8">Campaigns</h1>
      <CampaignList campaigns={campaigns.items} />
    </div>
  );
}
```

## Next Steps

Proceed to:
- **Document 14**: Agent Job Components
- **Document 15**: Agent Control Panel
