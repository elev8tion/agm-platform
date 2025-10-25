export default function IntegrationsPage() {
  const integrations = [
    {
      name: 'Email Service (Resend)',
      description: 'Send property alerts, follow-ups, and campaign emails to clients.',
      status: 'mock',
      category: 'Communication',
      docs: 'https://resend.com/docs',
      mockInfo: 'Email sending is logged to console. Connect Resend API key in production.'
    },
    {
      name: 'SMS Service (Twilio)',
      description: 'Send text messages for showings, offers, and urgent updates.',
      status: 'mock',
      category: 'Communication',
      docs: 'https://www.twilio.com/docs',
      mockInfo: 'SMS sending is logged to console. Connect Twilio credentials in production.'
    },
    {
      name: 'AI Assistant (OpenAI)',
      description: 'Generate property descriptions, emails, and smart responses.',
      status: 'ready',
      category: 'AI',
      docs: 'https://platform.openai.com/docs',
      mockInfo: 'AI features available. Add OPENAI_API_KEY to use live AI generation.'
    },
    {
      name: 'MLS/IDX Integration',
      description: 'Sync property listings from Multiple Listing Service.',
      status: 'planned',
      category: 'Real Estate',
      docs: '#',
      mockInfo: 'Coming soon. Will support major MLS providers.'
    },
    {
      name: 'DocuSign',
      description: 'Send contracts and documents for electronic signature.',
      status: 'planned',
      category: 'Documents',
      docs: 'https://developers.docusign.com',
      mockInfo: 'E-signature integration planned for Phase 5.'
    },
    {
      name: 'Stripe Payments',
      description: 'Process earnest money deposits and rental payments.',
      status: 'planned',
      category: 'Payments',
      docs: 'https://stripe.com/docs',
      mockInfo: 'Payment processing planned for Phase 5.'
    },
    {
      name: 'Google Calendar',
      description: 'Sync showings and appointments to Google Calendar.',
      status: 'planned',
      category: 'Calendar',
      docs: 'https://developers.google.com/calendar',
      mockInfo: 'Calendar sync planned for Phase 4.'
    },
    {
      name: 'Zapier Webhooks',
      description: 'Connect to 5,000+ apps and automate workflows.',
      status: 'ready',
      category: 'Automation',
      docs: 'https://zapier.com/developer',
      mockInfo: 'Webhook endpoints available. Configure in production.'
    }
  ];

  const statusColors = {
    mock: { badge: 'bg-yellow-500/20 text-yellow-300', label: 'Mock Mode' },
    ready: { badge: 'bg-green-500/20 text-green-300', label: 'Ready' },
    connected: { badge: 'bg-blue-500/20 text-blue-300', label: 'Connected' },
    planned: { badge: 'bg-slate-700 text-slate-300', label: 'Planned' }
  };

  const categories = ['Communication', 'AI', 'Real Estate', 'Documents', 'Payments', 'Calendar', 'Automation'];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Integrations</h1>
            <p className="mt-2 text-sm text-slate-400">
              Connect AgRM with email, SMS, MLS, and other real estate services
            </p>
          </div>
          <div className="rounded-md border border-white/20 bg-slate-900/50 px-4 py-2 text-sm text-slate-300">
            <span className="font-semibold text-white">Mock Mode:</span> Switch to production when ready
          </div>
        </div>

        {/* Integration Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {integrations.map((integration) => {
            const statusStyle = statusColors[integration.status as keyof typeof statusColors];
            return (
              <article
                key={integration.name}
                className="rounded-xl border border-white/10 bg-slate-900/50 p-6 transition-colors hover:border-brand/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-white">{integration.name}</h2>
                      <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${statusStyle.badge}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{integration.category}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-300">{integration.description}</p>

                <div className="mt-4 rounded-lg border border-dashed border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs text-slate-400">{integration.mockInfo}</p>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  {integration.docs !== '#' && (
                    <a
                      href={integration.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-foreground hover:text-brand"
                    >
                      View documentation →
                    </a>
                  )}
                  {integration.status === 'mock' && (
                    <button className="ml-auto rounded-md border border-white/20 px-3 py-1 text-xs text-slate-300 hover:border-brand hover:text-brand-foreground">
                      Configure
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Integration Guide */}
        <section className="mt-10 rounded-xl border border-white/10 bg-slate-900/50 p-6">
          <h3 className="text-lg font-semibold text-white">Switching to Production</h3>
          <p className="mt-2 text-sm text-slate-300">
            All integration interfaces are production-ready. Follow these steps to connect real services:
          </p>
          <ol className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-foreground">
                1
              </span>
              <span>
                Get API keys from service providers (Resend, Twilio, OpenAI)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-foreground">
                2
              </span>
              <span>
                Add environment variables to <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">.env.local</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-foreground">
                3
              </span>
              <span>
                Update service implementations (see <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">PRODUCTION_INTEGRATION_GUIDE.md</code>)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand-foreground">
                4
              </span>
              <span>
                Test thoroughly and deploy
              </span>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
