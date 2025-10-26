/**
 * useJobStream Hook
 * WebSocket hook for real-time job updates
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { AgentJob } from '@/types';

interface UseJobStreamOptions {
  jobId: string;
  onUpdate?: (job: AgentJob) => void;
  onComplete?: (job: AgentJob) => void;
  onError?: (error: string) => void;
}

export function useJobStream({ jobId, onUpdate, onComplete, onError }: UseJobStreamOptions) {
  const [job, setJob] = useState<AgentJob | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(() => {
    // TODO: Implement WebSocket connection to backend
    // For now, this is a placeholder
    console.log('WebSocket connection not implemented yet');

    // Mock connection
    setIsConnected(true);

    // Cleanup function
    return () => {
      setIsConnected(false);
    };
  }, [jobId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const appendOutput = useCallback((line: string) => {
    setOutput((prev) => [...prev, line]);
  }, []);

  const updateJob = useCallback((updatedJob: AgentJob) => {
    setJob(updatedJob);
    onUpdate?.(updatedJob);

    if (updatedJob.status === 'completed') {
      onComplete?.(updatedJob);
    }
  }, [onUpdate, onComplete]);

  return {
    job,
    output,
    isConnected,
    error,
    appendOutput,
    updateJob
  };
}
