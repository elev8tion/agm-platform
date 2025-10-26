'use client';

import { useState } from 'react';
import { AgentExecutionPanel } from '@/components/agent-execution/AgentExecutionPanel';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, FileText, Mail, Brain, Rocket } from 'lucide-react';

export default function AgentsPage() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeAgent, setActiveAgent] = useState<string>('SEO Writer');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const startSEOResearch = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agents/seo/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          depth: 'medium',
        }),
      });

      const data = await response.json();
      if (data.job_id) {
        setActiveJobId(data.job_id);
        setActiveAgent('SEO Writer');
      }
    } catch (error) {
      console.error('Failed to start agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const startContentWriting = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/agents/seo/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: topic.trim() || 'Write an article about AI marketing automation',
          keyword: 'AI marketing',
          word_count: 1500,
          tone: 'professional',
        }),
      });

      const data = await response.json();
      if (data.job_id) {
        setActiveJobId(data.job_id);
        setActiveAgent('SEO Writer');
      }
    } catch (error) {
      console.error('Failed to start agent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 border border-white/10 p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-brand/10 rounded-xl border border-brand/20">
              <Sparkles className="h-8 w-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Marketing Agents</h1>
              <p className="text-white/60">Watch your AI employees work in real-time</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <StatCard
              icon={<Brain className="h-5 w-5" />}
              label="Active Agents"
              value="3"
              color="purple"
            />
            <StatCard
              icon={<Rocket className="h-5 w-5" />}
              label="Jobs Completed"
              value="12"
              color="blue"
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5" />}
              label="Cost Saved"
              value="$24"
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Launcher */}
        <Card className="col-span-1 lg:col-span-1 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand" />
              Launch Agent
            </h2>
            <p className="text-sm text-white/60">Start an AI agent task</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Topic or Brief
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., AI marketing trends 2025"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand/40"
                onKeyDown={(e) => e.key === 'Enter' && startSEOResearch()}
              />
            </div>

            <div className="space-y-2">
              <Button
                onClick={startSEOResearch}
                disabled={loading || !topic.trim()}
                variant="primary"
                className="w-full justify-start"
              >
                <Brain className="h-4 w-4 mr-2" />
                Research & Outline
              </Button>

              <Button
                onClick={startContentWriting}
                disabled={loading}
                variant="secondary"
                className="w-full justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                Write Full Article
              </Button>

              <Button
                disabled={true}
                variant="ghost"
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Create Email Campaign
                <Badge variant="secondary" className="ml-auto">Soon</Badge>
              </Button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-white/60 mb-2">Quick examples:</p>
            <div className="flex flex-wrap gap-2">
              {['AI automation', 'SEO trends 2025', 'Content marketing'].map((example) => (
                <button
                  key={example}
                  onClick={() => setTopic(example)}
                  className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Live Execution Panel */}
        <div className="col-span-1 lg:col-span-2">
          <AgentExecutionPanel
            jobId={activeJobId}
            agentType={activeAgent}
            className="h-full"
          />
        </div>
      </div>

      {/* Recent Jobs */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand" />
          Recent Jobs
        </h2>
        <div className="space-y-2">
          {[
            { id: '1', agent: 'SEO Writer', task: 'Research ML trends', status: 'completed', time: '2m ago' },
            { id: '2', agent: 'SEO Writer', task: 'Research AI automation', status: 'completed', time: '5m ago' },
            { id: '3', agent: 'Email Marketer', task: 'Create welcome series', status: 'pending', time: '10m ago' },
          ].map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg cursor-pointer transition-colors"
              onClick={() => setActiveJobId(job.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-2 w-2 rounded-full',
                  job.status === 'completed' ? 'bg-green-400' :
                  job.status === 'running' ? 'bg-blue-400 animate-pulse' :
                  'bg-yellow-400'
                )} />
                <div>
                  <p className="text-sm font-medium text-white">{job.task}</p>
                  <p className="text-xs text-white/60">{job.agent}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  variant={job.status === 'completed' ? 'success' : 'secondary'}
                  className="mb-1"
                >
                  {job.status}
                </Badge>
                <p className="text-xs text-white/40">{job.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'purple' | 'blue' | 'green';
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
  };

  return (
    <div className={cn('p-4 rounded-xl border', colorClasses[color])}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-white/60">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
