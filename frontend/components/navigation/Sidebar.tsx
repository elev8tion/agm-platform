/**
 * Sidebar
 * Dashboard sidebar with navigation links
 */

'use client';

import { NavLink } from './NavLink';
import {
  LayoutDashboard,
  FileText,
  Target,
  Bot,
  BarChart3,
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigationLinks = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/content', icon: FileText, label: 'Content' },
  { href: '/dashboard/campaigns', icon: Target, label: 'Campaigns' },
  { href: '/dashboard/agents', icon: Bot, label: 'AI Agents' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' }
];

const secondaryLinks = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  { href: '/dashboard/help', icon: HelpCircle, label: 'Help' }
];

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside className={className}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10 border border-brand/20">
              <Sparkles className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100">Marketing AI</h2>
              <p className="text-xs text-slate-400">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
            />
          ))}
        </nav>

        {/* Secondary Links */}
        <div className="p-4 border-t border-white/10 space-y-1">
          {secondaryLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
