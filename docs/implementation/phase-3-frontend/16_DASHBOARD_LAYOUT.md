# Phase 3.6: Dashboard Layout

## Overview

The Dashboard Layout provides the main interface structure for the Agentic Marketing Dashboard, including navigation, KPI cards, tab system, budget meter, and activity feeds. This component orchestrates all feature components into a cohesive user experience.

## Prerequisites

- **Phase 3.1-3.5 Complete**: All feature components implemented
- **Next.js 16 App Router**: For layout patterns
- **Responsive Design**: Mobile-first approach

## Component Design

### Visual Specifications

**Layout Structure:**
- Fixed header with brand logo, budget meter, notifications
- Sidebar navigation (collapsible on mobile)
- Main content area with tab navigation
- Floating action button for quick tasks
- Footer with credits and links

**Color Scheme:**
- Background: Slate 950
- Cards: Slate 900/50 with backdrop-blur
- Primary accent: Indigo 500
- Success: Emerald 500
- Warning: Amber 500
- Error: Red 500

**Spacing:**
- Container: max-w-7xl mx-auto
- Padding: px-4 sm:px-6 lg:px-8
- Gap between sections: gap-6 md:gap-8

## Component Tree

```
MarketingDashboard (Server)
├── DashboardHeader (Server)
│   ├── Logo
│   ├── BudgetMeter (Client)
│   └── NotificationBell (Client)
├── Sidebar (Client)
│   ├── NavLinks
│   └── UserProfile
├── MainContent (Server)
│   ├── DashboardStats (Server)
│   ├── TabNavigation (Client)
│   ├── TabContent (Server)
│   │   ├── ContentAssetsTab
│   │   ├── CampaignsTab
│   │   ├── JobsTab
│   │   └── AgentsTab
│   └── RecentActivityFeed (Server)
├── QuickActionsPanel (Client)
└── Footer (Server)
```

## Complete Implementation

### app/layout.tsx

```typescript
/**
 * Root Layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Agentic Marketing Dashboard',
  description: 'AI-powered marketing automation platform'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

### components/dashboard/DashboardHeader.tsx

```typescript
/**
 * DashboardHeader Component (Server Component)
 */

import { BudgetMeter } from './BudgetMeter';
import { NotificationBell } from './NotificationBell';
import { Menu, Zap } from 'lucide-react';

interface DashboardHeaderProps {
  brandName: string;
  monthlyBudget: number;
  budgetSpent: number;
  onMenuClick?: () => void;
}

export function DashboardHeader({
  brandName,
  monthlyBudget,
  budgetSpent,
  onMenuClick
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/75">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-6 h-6 text-slate-400" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-100">{brandName}</h1>
                <p className="text-xs text-slate-400">Marketing Dashboard</p>
              </div>
            </div>
          </div>

          {/* Budget & Notifications */}
          <div className="flex items-center gap-4">
            <BudgetMeter
              budget={monthlyBudget}
              spent={budgetSpent}
              className="hidden md:block"
            />
            <NotificationBell />
          </div>
        </div>
      </div>
    </header>
  );
}
```

### components/dashboard/BudgetMeter.tsx

```typescript
'use client';

/**
 * BudgetMeter Component (Client Component)
 */

import { DollarSign } from 'lucide-react';

interface BudgetMeterProps {
  budget: number;
  spent: number;
  className?: string;
}

export function BudgetMeter({ budget, spent, className = '' }: BudgetMeterProps) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  const getColor = () => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 75) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800/50 ${className}`}>
      <DollarSign className={`w-5 h-5 ${getColor()}`} />
      <div>
        <div className="text-xs text-slate-400">Monthly Budget</div>
        <div className={`text-sm font-medium ${getColor()}`}>
          ${remaining.toLocaleString()} left
        </div>
      </div>
      <div className="w-12 h-12">
        <svg className="transform -rotate-90 w-12 h-12">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-slate-700"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${percentage * 1.26} 126`}
            className={getColor()}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
```

### components/dashboard/DashboardStats.tsx

```typescript
/**
 * DashboardStats Component (Server Component)
 */

import { Card } from '@/components/ui/Card';
import { FileText, Target, Zap, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    total_content_assets: number;
    total_campaigns: number;
    active_jobs: number;
    budget_spent_this_month: number;
    content_assets_change?: number;
    campaigns_change?: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      label: 'Content Assets',
      value: stats.total_content_assets,
      change: stats.content_assets_change,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Active Campaigns',
      value: stats.total_campaigns,
      change: stats.campaigns_change,
      icon: Target,
      color: 'purple'
    },
    {
      label: 'Active Jobs',
      value: stats.active_jobs,
      icon: Zap,
      color: 'indigo'
    },
    {
      label: 'Budget Spent',
      value: `$${stats.budget_spent_this_month.toLocaleString()}`,
      icon: DollarSign,
      color: 'emerald'
    }
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    indigo: 'bg-indigo-500/20 text-indigo-400',
    emerald: 'bg-emerald-500/20 text-emerald-400'
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        const isPositive = stat.change && stat.change > 0;

        return (
          <Card key={stat.label}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${colorMap[stat.color]} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(stat.change)}%</span>
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-slate-100 mb-1">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

### components/dashboard/TabNavigation.tsx

```typescript
'use client';

/**
 * TabNavigation Component (Client Component)
 */

import { useState } from 'react';
import { FileText, Target, History, Bot } from 'lucide-react';

interface TabNavigationProps {
  onTabChange: (tab: string) => void;
  defaultTab?: string;
}

const tabs = [
  { id: 'content', label: 'Content Assets', icon: FileText },
  { id: 'campaigns', label: 'Campaigns', icon: Target },
  { id: 'jobs', label: 'Job History', icon: History },
  { id: 'agents', label: 'AI Agents', icon: Bot }
];

export function TabNavigation({ onTabChange, defaultTab = 'content' }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    onTabChange(tabId);
  }

  return (
    <div className="border-b border-slate-800">
      <nav className="flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-4 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
```

### components/dashboard/RecentActivityFeed.tsx

```typescript
/**
 * RecentActivityFeed Component (Server Component)
 */

import { Card } from '@/components/ui/Card';
import { Clock, FileText, CheckCircle, PlayCircle, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'content_created' | 'job_completed' | 'campaign_started' | 'content_published';
  message: string;
  timestamp: string;
  related_id?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const activityIcons = {
  content_created: FileText,
  job_completed: CheckCircle,
  campaign_started: PlayCircle,
  content_published: Target
};

const activityColors = {
  content_created: 'text-blue-400',
  job_completed: 'text-emerald-400',
  campaign_started: 'text-purple-400',
  content_published: 'text-indigo-400'
};

export function RecentActivityFeed({ activities, loading = false }: RecentActivityFeedProps) {
  if (loading) {
    return (
      <Card title="Recent Activity">
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-800/50 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card title="Recent Activity">
        <div className="p-6 text-center text-slate-400">
          No recent activity
        </div>
      </Card>
    );
  }

  return (
    <Card title="Recent Activity">
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, idx) => {
            const Icon = activityIcons[activity.type];
            const color = activityColors[activity.type];

            return (
              <div key={activity.id} className="relative">
                {idx < activities.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800" />
                )}

                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300">{activity.message}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
```

### components/dashboard/QuickActionsPanel.tsx

```typescript
'use client';

/**
 * QuickActionsPanel Component (Client Component)
 * Floating action button with quick actions menu
 */

import { useState } from 'react';
import { Plus, Search, PenTool, Mail, Target } from 'lucide-react';

interface QuickActionsPanelProps {
  onAction: (action: string) => void;
}

export function QuickActionsPanel({ onAction }: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'research', label: 'Research Topic', icon: Search, color: 'bg-blue-500' },
    { id: 'write', label: 'Write Article', icon: PenTool, color: 'bg-indigo-500' },
    { id: 'email', label: 'Create Email', icon: Mail, color: 'bg-purple-500' },
    { id: 'campaign', label: 'New Campaign', icon: Target, color: 'bg-emerald-500' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onAction(action.id);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-100 whitespace-nowrap">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          bg-gradient-to-r from-indigo-500 to-purple-500
          hover:shadow-indigo-500/50 hover:shadow-xl
          transition-all duration-200
          ${isOpen ? 'rotate-45' : ''}
        `}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}
```

### app/dashboard/page.tsx

```typescript
'use client';

/**
 * Main Dashboard Page
 */

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TabNavigation } from '@/components/dashboard/TabNavigation';
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed';
import { QuickActionsPanel } from '@/components/dashboard/QuickActionsPanel';
import { ContentAssetList } from '@/components/content-assets/ContentAssetList';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { JobHistoryList } from '@/components/agent-jobs/JobHistoryList';
import { AgentControlPanel } from '@/components/agent-control/AgentControlPanel';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('content');
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      setStats(data.stats);
      setActivities(data.recent_activity);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  }

  function handleQuickAction(action: string) {
    // Navigate to appropriate tab and trigger action
    console.log('Quick action:', action);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <DashboardHeader
        brandName="Your Brand"
        monthlyBudget={5000}
        budgetSpent={stats?.budget_spent_this_month || 0}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* KPI Stats */}
          {stats && <DashboardStats stats={stats} />}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Tab Navigation */}
              <TabNavigation onTabChange={setActiveTab} defaultTab="content" />

              {/* Tab Content */}
              <div className="min-h-[600px]">
                {activeTab === 'content' && <ContentAssetList assets={[]} loading={loading} />}
                {activeTab === 'campaigns' && <CampaignList campaigns={[]} loading={loading} />}
                {activeTab === 'jobs' && <JobHistoryList jobs={[]} loading={loading} />}
                {activeTab === 'agents' && <AgentControlPanel brandId="brand-1" />}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <RecentActivityFeed activities={activities} loading={loading} />
            </div>
          </div>
        </div>
      </main>

      {/* Quick Actions */}
      <QuickActionsPanel onAction={handleQuickAction} />
    </div>
  );
}
```

## Responsive Design

### Mobile (< 640px)
- Single column layout
- Collapsible sidebar
- Tab icons only (labels hidden)
- Stacked stat cards
- Simplified header

### Tablet (640px - 1024px)
- Two column grid for stats
- Side-by-side content and activity feed
- Tab labels visible
- Expanded header with budget meter

### Desktop (> 1024px)
- Full 3-column layout
- All features visible
- Expanded sidebar
- Maximum content density

## Accessibility

- Semantic HTML (`header`, `main`, `nav`, `section`)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Arrow keys, Enter)
- Focus indicators visible
- Screen reader announcements for status changes
- Color contrast meets WCAG AA standards

## Usage Example

```typescript
// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to dashboard
  redirect('/dashboard');
}
```

## Testing

```typescript
// __tests__/DashboardPage.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

describe('DashboardPage', () => {
  it('renders all tabs', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Content Assets')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Job History')).toBeInTheDocument();
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
  });

  it('switches tabs on click', () => {
    render(<DashboardPage />);

    const campaignsTab = screen.getByText('Campaigns');
    fireEvent.click(campaignsTab);

    // Verify campaigns content is shown
    // (depends on your implementation)
  });

  it('displays KPI stats', async () => {
    render(<DashboardPage />);

    // Wait for stats to load
    await screen.findByText('Content Assets');
    await screen.findByText('Active Campaigns');
    await screen.findByText('Active Jobs');
    await screen.findByText('Budget Spent');
  });
});
```

## Troubleshooting

**Issue: Tabs not switching**
- Check `onTabChange` callback is firing
- Verify state update in parent component
- Ensure tab IDs match between navigation and content

**Issue: Stats not loading**
- Check API endpoint `/api/dashboard` is working
- Verify fetch error handling
- Check browser console for errors

**Issue: Layout breaking on mobile**
- Use responsive Tailwind classes (sm:, md:, lg:)
- Test with browser dev tools responsive mode
- Check for fixed widths that prevent responsive behavior

## Next Steps

Proceed to:
- **Document 17**: UI Primitives (final document)
