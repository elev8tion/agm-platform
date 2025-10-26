/**
 * NavLink
 * Active link component for navigation
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function NavLink({ href, icon: Icon, label, className }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors',
        isActive
          ? 'bg-brand/20 text-brand border border-brand/30'
          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-900/50',
        className
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
