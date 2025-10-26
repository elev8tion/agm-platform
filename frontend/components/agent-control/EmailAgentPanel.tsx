/**
 * Email Agent Panel
 * Controls for Email Marketer agent
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { AgentState, JobActionType } from '@/types';
import { Mail, FileText, List } from 'lucide-react';

interface EmailAgentPanelProps {
  agentState: AgentState;
  onAction: (action: JobActionType, params: Record<string, any>) => void;
  className?: string;
}

export function EmailAgentPanel({ agentState, onAction, className }: EmailAgentPanelProps) {
  const [brief, setBrief] = useState('');
  const [seriesCount, setSeriesCount] = useState(3);

  const handleCreateEmail = () => {
    if (!brief.trim()) return;
    onAction(JobActionType.CREATE_EMAIL, { brief });
    setBrief('');
  };

  const handleCreateSeries = () => {
    if (!brief.trim()) return;
    onAction(JobActionType.CREATE_SERIES, { brief, count: seriesCount });
    setBrief('');
  };

  const isDisabled = agentState === AgentState.BUSY || agentState === AgentState.ERROR;

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <Mail className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">Email Marketer</h3>
              <p className="text-xs text-slate-400">Email campaigns & sequences</p>
            </div>
          </div>
          <AgentStatusIndicator state={agentState} />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Create Single Email */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Create Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateEmail()}
                disabled={isDisabled}
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                placeholder="Enter email brief..."
              />
              <Button
                onClick={handleCreateEmail}
                disabled={isDisabled || !brief.trim()}
                variant="primary"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Create Email Series */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Create Email Series
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                disabled={isDisabled}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                placeholder="Enter series brief..."
              />
              <div className="flex gap-2">
                <select
                  value={seriesCount}
                  onChange={(e) => setSeriesCount(parseInt(e.target.value))}
                  disabled={isDisabled}
                  className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                >
                  <option value={3}>3 emails</option>
                  <option value={5}>5 emails</option>
                  <option value={7}>7 emails</option>
                  <option value={10}>10 emails</option>
                </select>
                <Button
                  onClick={handleCreateSeries}
                  disabled={isDisabled || !brief.trim()}
                  variant="secondary"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
