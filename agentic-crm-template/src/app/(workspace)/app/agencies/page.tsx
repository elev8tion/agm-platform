import { dataStore } from '@/lib/services/dataStore';

export default async function AgenciesPage() {
  const tenants = await dataStore.listTenants();

  // Get users for each tenant to show agent count
  const enriched = await Promise.all(
    tenants.map(async tenant => {
      const users = await dataStore.listUsers(tenant.id);
      const properties = await dataStore.listProperties(tenant.id);
      const leads = await dataStore.listLeads(tenant.id);
      const transactions = await dataStore.listTransactions(tenant.id);

      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        agentCount: users.length,
        propertyCount: properties.length,
        leadCount: leads.length,
        transactionCount: transactions.length
      };
    })
  );

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Real Estate Agencies</h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage multiple real estate agencies and their teams
            </p>
          </div>
          <button className="rounded-md bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand/80">
            + Add Agency
          </button>
        </div>

        {/* Agencies Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {enriched.map((agency) => (
            <article
              key={agency.id}
              className="rounded-xl border border-white/10 bg-slate-900/50 p-6 transition-colors hover:border-brand/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white">{agency.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                    {agency.slug}
                  </p>
                </div>
                <a
                  href={`/app?tenantId=${agency.id}`}
                  className="rounded-md bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand/80"
                >
                  Open
                </a>
              </div>

              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-white/5 bg-slate-900/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Agents</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{agency.agentCount}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-slate-900/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Properties</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{agency.propertyCount}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-slate-900/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Leads</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{agency.leadCount}</p>
                </div>
                <div className="rounded-lg border border-white/5 bg-slate-900/30 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Deals</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{agency.transactionCount}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Empty State */}
        {enriched.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/30 p-12 text-center">
            <p className="text-lg font-semibold text-white">No agencies yet</p>
            <p className="mt-2 text-sm text-slate-400">
              Create your first real estate agency to get started
            </p>
            <button className="mt-6 rounded-md bg-brand px-6 py-2 text-sm text-brand-foreground hover:bg-brand/80">
              + Add Your First Agency
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
