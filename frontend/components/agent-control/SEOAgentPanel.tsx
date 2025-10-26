/**
 * SEO Agent Panel
 * Controls for SEO Writer agent
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { AgentState, JobActionType } from '@/types';
import { Sparkles, Search, FileText, TrendingUp } from 'lucide-react';

interface SEOAgentPanelProps {
  agentState: AgentState;
  onAction: (action: JobActionType, params: Record<string, any>) => void;
  className?: string;
}

export function SEOAgentPanel({ agentState, onAction, className }: SEOAgentPanelProps) {
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

  const handleResearch = () => {
    if (!topic.trim()) return;
    onAction(JobActionType.RESEARCH, { topic });
    setTopic('');
  };

  const handleWrite = () => {
    if (!topic.trim()) return;
    onAction(JobActionType.WRITE, { brief: topic });
    setTopic('');
  };

  const handleOptimize = () => {
    if (!url.trim()) return;
    onAction(JobActionType.OPTIMIZE, { url });
    setUrl('');
  };

  const isDisabled = agentState === AgentState.BUSY || agentState === AgentState.ERROR;

  return (
    <Card className={className}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">SEO Writer</h3>
              <p className="text-xs text-slate-400">Content creation & optimization</p>
            </div>
          </div>
          <AgentStatusIndicator state={agentState} />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Research */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Research Topic
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                disabled={isDisabled}
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                placeholder="Enter topic to research..."
              />
              <Button
                onClick={handleResearch}
                disabled={isDisabled || !topic.trim()}
                variant="secondary"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Write */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Write Article
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleWrite()}
                disabled={isDisabled}
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                placeholder="Enter article brief..."
              />
              <Button
                onClick={handleWrite}
                disabled={isDisabled || !topic.trim()}
                variant="primary"
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Optimize */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Optimize Existing Content
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleOptimize()}
                disabled={isDisabled}
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand/40 disabled:opacity-50"
                placeholder="Enter URL to optimize..."
              />
              <Button
                onClick={handleOptimize}
                disabled={isDisabled || !url.trim()}
                variant="secondary"
              >
                <TrendingUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
