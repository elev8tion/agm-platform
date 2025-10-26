/**
 * Dashboard Layout
 * Layout wrapper for dashboard pages
 */

import { Sidebar } from '@/components/navigation/Sidebar';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <Sidebar className="w-64 border-r border-white/10 bg-slate-900/50" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
