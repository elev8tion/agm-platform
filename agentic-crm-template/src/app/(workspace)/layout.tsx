import { ReactNode, Suspense } from 'react';
import { AgencyNav } from '@/components/agency-nav';

export default function AgencyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <Suspense fallback={<div className="h-16 border-b border-white/10 bg-slate-950/70" />}>
        <AgencyNav />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
