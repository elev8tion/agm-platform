/**
 * Agent Control Panel
 * Main panel with tabs for each agent
 */

'use client';

import { useState } from 'react';
import { AgentType, AgentState, JobActionType } from '@/types';
import { SEOAgentPanel } from './SEOAgentPanel';
import { EmailAgentPanel } from './EmailAgentPanel';
import { CMOAgentPanel } from './CMOAgentPanel';
import { Sparkles, Mail, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentControlPanelProps {
  agentStatuses: Record<AgentType, AgentState>;
  onAgentAction: (agentType: AgentType, action: JobActionType, params: Record<string, any>) => void;
  className?: string;
}

const agentTabs = [
  { type: AgentType.SEO_WRITER, label: 'SEO Writer', icon: Sparkles },
  { type: AgentType.EMAIL_MARKETER, label: 'Email Marketer', icon: Mail },
  { type: AgentType.CMO, label: 'CMO', icon: TrendingUp }
];

export function AgentControlPanel({
  agentStatuses,
  onAgentAction,
  className
}: AgentControlPanelProps) {
  const [activeTab, setActiveTab] = useState<AgentType>(AgentType.SEO_WRITER);

  const handleAction = (action: JobActionType, params: Record<string, any>) => {
    onAgentAction(activeTab, action, params);
  };

  return (
    <div className={className}>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {agentTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.type;

          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
                isActive
                  ? 'bg-brand/20 text-brand border-brand/30'
                  : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-brand/20 hover:text-slate-300'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium">{tab.label}</span>
              {agentStatuses[tab.type] === AgentState.BUSY && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Panel */}
      {activeTab === AgentType.SEO_WRITER && (
        <SEOAgentPanel
          agentState={agentStatuses[AgentType.SEO_WRITER]}
          onAction={handleAction}
        />
      )}
      {activeTab === AgentType.EMAIL_MARKETER && (
        <EmailAgentPanel
          agentState={agentStatuses[AgentType.EMAIL_MARKETER]}
          onAction={handleAction}
        />
      )}
      {activeTab === AgentType.CMO && (
        <CMOAgentPanel
          agentState={agentStatuses[AgentType.CMO]}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
