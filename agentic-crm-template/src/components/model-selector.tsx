"use client";

import { useModelContext } from '@/components/model-context';

export function ModelSelector({ variant = 'popover' }: { variant?: 'popover' | 'inline' }) {
  const { model, setModel, availableModels } = useModelContext();

  if (variant === 'inline') {
    return (
      <select
        value={model}
        onChange={event => setModel(event.target.value)}
        className="rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
      >
        {availableModels.map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200">
      <p className="text-xs uppercase tracking-[0.3em] text-brand-foreground/70">AI model</p>
      <div className="mt-2 space-y-3">
        {availableModels.map(option => {
          const isActive = option.id === model;
          return (
            <button
              key={option.id}
              onClick={() => setModel(option.id)}
              className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                isActive
                  ? 'border-brand bg-brand/20 text-white'
                  : 'border-white/10 text-slate-200 hover:border-brand/60 hover:text-white'
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-slate-400">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
