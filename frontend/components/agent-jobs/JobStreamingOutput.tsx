/**
 * Job Streaming Output
 * Real-time output display for running jobs
 */

'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Terminal } from 'lucide-react';

interface JobStreamingOutputProps {
  output: string[];
  isStreaming?: boolean;
  className?: string;
}

export function JobStreamingOutput({
  output,
  isStreaming = false,
  className
}: JobStreamingOutputProps) {
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-slate-200">
            Agent Output
            {isStreaming && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-brand animate-pulse" />
                Streaming...
              </span>
            )}
          </h3>
        </div>

        <div
          ref={outputRef}
          className="bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto border border-white/10"
        >
          {output.length === 0 ? (
            <div className="text-slate-500">Waiting for output...</div>
          ) : (
            output.map((line, index) => (
              <div key={index} className="mb-1">
                <span className="text-slate-500 mr-2">{index + 1}.</span>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
