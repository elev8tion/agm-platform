/**
 * Tab Navigation
 * Tab switcher for dashboard sections
 */

'use client';

import { FileText, Target, Bot, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardTab = 'content' | 'campaigns' | 'agents' | 'analytics';

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  className?: string;
}

const tabs: { id: DashboardTab; label: string; icon: typeof FileText }[] = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'campaigns', label: 'Campaigns', icon: Target },
  { id: 'agents', label: 'AI Agents', icon: Bot },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
];

export function TabNavigation({ activeTab, onTabChange, className }: TabNavigationProps) {
  return (
    <div className={cn('border-b border-white/10', className)}>
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 border-b-2 transition-colors',
                isActive
                  ? 'border-brand text-brand font-medium'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
