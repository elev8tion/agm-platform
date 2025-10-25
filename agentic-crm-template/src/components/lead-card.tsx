"use client";

import { type Lead } from '@/lib/services/dataStore';

type LeadCardProps = {
  lead: Lead;
  onClick?: () => void;
};

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const statusColors = {
    new: 'bg-blue-500/20 text-blue-300',
    contacted: 'bg-purple-500/20 text-purple-300',
    qualified: 'bg-green-500/20 text-green-300',
    converted: 'bg-emerald-500/20 text-emerald-300',
    lost: 'bg-red-500/20 text-red-300'
  };

  return (
    <article
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:border-brand hover:bg-slate-900/70 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{lead.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${
                statusColors[lead.status]
              }`}
            >
              {lead.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{lead.email}</p>
          {lead.phone && (
            <p className="mt-0.5 text-sm text-slate-400">{lead.phone}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {lead.source && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Source:</span>
            <span className="text-slate-300">{lead.source}</span>
          </div>
        )}
        {lead.notes && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-400">{lead.notes}</p>
        )}
      </div>
    </article>
  );
}
