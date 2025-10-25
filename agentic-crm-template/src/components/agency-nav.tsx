"use client";

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

const links = [
  { href: '/app', label: 'Messages', exact: true },
  { href: '/app/agencies', label: 'Agencies' },
  { href: '/app/analytics', label: 'Analytics' },
  { href: '/app/settings', label: 'Settings' },
  { href: '/app/integrations', label: 'Integrations' }
];

export function AgencyNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const agencyParam = searchParams.get('agencyId');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, agencyParam]);

  return (
    <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/app" className="text-lg font-semibold text-white">
          AgRM <span className="text-brand">CRM</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(current => !current)}
            className="inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-brand hover:text-brand-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            Menu
          </button>

          <nav className="hidden items-center space-x-6 text-sm md:flex">
            {links.map(link => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              const href = agencyParam ? `${link.href}?agencyId=${agencyParam}` : link.href;
              return (
                <Link
                  key={link.href}
                  href={href}
                  className={clsx(
                    'transition-colors',
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/signin"
            className="hidden rounded-md border border-white/20 px-3 py-1 text-sm text-slate-200 hover:border-brand hover:text-brand-foreground md:inline-flex"
          >
            Sign out
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-white/10 bg-slate-950/95 md:hidden">
          <nav className="flex flex-col space-y-2 px-4 py-4 text-sm">
            {links.map(link => {
              const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
              const href = agencyParam ? `${link.href}?agencyId=${agencyParam}` : link.href;
              return (
                <Link
                  key={link.href}
                  href={href}
                  className={clsx(
                    'rounded-md px-3 py-2 transition-colors',
                    isActive ? 'bg-brand/20 text-white' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/10 px-4 py-3">
            <Link
              href="/signin"
              className="inline-flex w-full justify-center rounded-md border border-white/20 px-3 py-2 text-sm text-slate-200 hover:border-brand hover:text-brand-foreground"
            >
              Sign out
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
