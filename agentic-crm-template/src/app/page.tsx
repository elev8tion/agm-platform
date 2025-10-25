import Link from 'next/link';

const heroStats = [
  { label: 'Real Estate Agencies', value: '50+' },
  { label: 'Properties Managed', value: '10,000+' },
  { label: 'Closed Deals', value: '$2.5B+' }
];

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand/20 via-slate-950 to-slate-950 blur-3xl" />
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <span className="text-lg font-semibold text-white">
            AgRM <span className="text-brand">CRM</span>
          </span>
          <nav className="flex items-center space-x-6 text-sm text-slate-300">
            <Link href="/signin" className="hover:text-white">
              Sign in
            </Link>
            <Link href="/app" className="rounded-md bg-brand px-4 py-2 text-brand-foreground hover:bg-brand/80">
              Launch demo
            </Link>
          </nav>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.4em] text-brand-foreground/70">Real Estate · CRM · AI-Powered</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">
              The most powerful real estate CRM built for modern agents and brokers.
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              AgRM combines property management, lead tracking, and AI-powered communication tools to help you close more deals faster.
              Manage your entire real estate business from one powerful platform.
            </p>
            <div className="mt-8 flex space-x-4">
              <Link
                href="/app"
                className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/80"
              >
                Enter live preview
              </Link>
              <Link href="#capabilities" className="rounded-md border border-white/10 px-5 py-2 text-sm text-slate-200 hover:border-brand">
                Explore capabilities
              </Link>
            </div>
          </div>

          <section id="stats" className="mt-16 grid gap-8 md:grid-cols-3">
            {heroStats.map(stat => (
              <div key={stat.label} className="rounded-lg border border-white/10 bg-slate-900/50 p-6">
                <p className="text-2xl font-semibold text-white">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </section>
        </main>
      </div>

      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-slate-900/40 p-8">
            <h2 className="text-xl font-semibold text-white">Property Management</h2>
            <p className="mt-4 text-sm text-slate-300">
              List and manage unlimited properties with photos, virtual tours, and detailed descriptions. Track status from listing to closing.
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/40 p-8">
            <h2 className="text-xl font-semibold text-white">Lead Pipeline</h2>
            <p className="mt-4 text-sm text-slate-300">
              Visual pipeline to track leads from first contact to closing. Automated lead scoring and intelligent follow-up reminders.
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/40 p-8">
            <h2 className="text-xl font-semibold text-white">AI-Powered Communication</h2>
            <p className="mt-4 text-sm text-slate-300">
              Draft property descriptions, follow-up emails, and SMS messages with AI. Save hours on client communication.
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-slate-900/40 p-8">
            <h2 className="text-xl font-semibold text-white">Multi-Tenant Architecture</h2>
            <p className="mt-4 text-sm text-slate-300">
              Built for agencies of any size. Secure data isolation, role-based permissions, and unlimited team members.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
