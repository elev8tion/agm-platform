import Link from 'next/link';

const stats = [
  { label: 'Content Assets Created', value: '10,000+' },
  { label: 'Active Campaigns', value: '500+' },
  { label: 'Cost Savings', value: '70%' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/20 via-slate-950 to-slate-950 blur-3xl" />
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <span className="text-lg font-semibold text-white">
            Agentic <span className="text-brand">Marketing</span>
          </span>
          <nav className="flex items-center space-x-6 text-sm text-slate-300">
            <Link href="/signin" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/dashboard" className="rounded-md bg-brand px-4 py-2 text-brand-foreground hover:bg-brand/80">
              Launch dashboard
            </Link>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-foreground/70">Marketing · AI Agents · Automation</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">
              AI-powered marketing command center with autonomous agents.
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Automate content creation, campaign management, and performance optimization with AI agents.
              Manage your entire marketing operation from one powerful platform.
            </p>
            <div className="mt-8 flex space-x-4">
              <Link
                href="/dashboard"
                className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/80"
              >
                Enter dashboard
              </Link>
              <Link href="#features" className="rounded-md border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-brand">
                Explore features
              </Link>
            </div>
          </div>

          <section id="stats" className="mt-16 grid gap-8 md:grid-cols-3">
            {stats.map(stat => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-slate-900/50 p-6">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </section>
        </main>
      </div>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <article className="group rounded-xl border border-white/10 bg-slate-900/40 p-8 transition-all hover:border-brand/40 hover:bg-slate-900/60">
            <div className="mb-4 inline-block rounded-lg bg-brand/10 p-3">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-brand transition-colors">AI Agents</h2>
            <p className="mt-4 text-sm text-slate-300">
              Autonomous marketing employees that write content, manage campaigns, and optimize performance automatically.
            </p>
          </article>
          <article className="group rounded-xl border border-white/10 bg-slate-900/40 p-8 transition-all hover:border-brand/40 hover:bg-slate-900/60">
            <div className="mb-4 inline-block rounded-lg bg-brand/10 p-3">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-brand transition-colors">Campaign Management</h2>
            <p className="mt-4 text-sm text-slate-300">
              Track campaigns from creation to completion. Monitor performance metrics and adjust strategies in real-time.
            </p>
          </article>
          <article className="group rounded-xl border border-white/10 bg-slate-900/40 p-8 transition-all hover:border-brand/40 hover:bg-slate-900/60">
            <div className="mb-4 inline-block rounded-lg bg-brand/10 p-3">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-brand transition-colors">Content Assets</h2>
            <p className="mt-4 text-sm text-slate-300">
              Generate blog posts, emails, and social content with AI. Store and manage all your marketing assets in one place.
            </p>
          </article>
          <article className="group rounded-xl border border-white/10 bg-slate-900/40 p-8 transition-all hover:border-brand/40 hover:bg-slate-900/60">
            <div className="mb-4 inline-block rounded-lg bg-brand/10 p-3">
              <svg className="h-6 w-6 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white group-hover:text-brand transition-colors">Budget Control</h2>
            <p className="mt-4 text-sm text-slate-300">
              Track API costs, set spending limits, and optimize resource allocation. Full transparency on AI usage costs.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
