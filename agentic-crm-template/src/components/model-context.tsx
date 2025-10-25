"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

const MODEL_STORAGE_KEY = 'slackinglinds:ai-model';
const DEFAULT_MODEL = 'gpt-4.1-mini';

type ModelContextValue = {
  model: string;
  setModel: (model: string) => void;
  availableModels: Array<{ id: string; label: string; description: string }>;
};

const ModelContext = createContext<ModelContextValue | undefined>(undefined);

const MODELS: ModelContextValue['availableModels'] = [
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', description: 'Fast drafting, ideal for daily collaboration.' },
  { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Higher reasoning and nuanced summaries.' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Lightweight model with strong multilingual support.' }
];

export function ModelProvider({ children }: { children: ReactNode }) {
  const [model, setModelState] = useState(DEFAULT_MODEL);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored && MODELS.some(option => option.id === stored)) {
      setModelState(stored);
    }
  }, []);

  const setModel = (next: string) => {
    setModelState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODEL_STORAGE_KEY, next);
    }
  };

  const value = useMemo<ModelContextValue>(
    () => ({
      model,
      setModel,
      availableModels: MODELS
    }),
    [model]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
}
