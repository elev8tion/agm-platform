export default function AnalyticsPage() {
  // Mock real estate analytics data
  const salesMetrics = {
    thisMonth: {
      deals: 4,
      revenue: 1850000,
      commission: 55500,
      avgDaysToClose: 42
    },
    lastMonth: {
      deals: 3,
      revenue: 1200000,
      commission: 36000,
      avgDaysToClose: 48
    }
  };

  const leadMetrics = {
    total: 24,
    new: 8,
    contacted: 6,
    qualified: 5,
    converted: 3,
    lost: 2,
    conversionRate: 12.5
  };

  const propertyMetrics = [
    { address: '123 Sunset Blvd', views: 245, showings: 12, offers: 2, daysOnMarket: 14 },
    { address: '456 Pacific Coast Hwy', views: 189, showings: 8, offers: 1, daysOnMarket: 7 },
    { address: '789 Rodeo Drive', views: 312, showings: 15, offers: 3, daysOnMarket: 21 }
  ];

  const agentPerformance = [
    { name: 'Sarah Agent', deals: 2, revenue: 950000, commission: 28500, leads: 12 },
    { name: 'Mike Broker', deals: 2, revenue: 900000, commission: 27000, leads: 8 }
  ];

  const dealChange = ((salesMetrics.thisMonth.deals - salesMetrics.lastMonth.deals) / salesMetrics.lastMonth.deals * 100).toFixed(1);
  const revenueChange = ((salesMetrics.thisMonth.revenue - salesMetrics.lastMonth.revenue) / salesMetrics.lastMonth.revenue * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Analytics & Performance</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track sales performance, lead conversion, and agent productivity
          </p>
        </div>

        {/* Sales Overview */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-widest text-slate-400">Sales Overview - This Month</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Deals Closed</p>
              <p className="mt-3 text-3xl font-semibold text-white">{salesMetrics.thisMonth.deals}</p>
              <p className="mt-2 text-xs text-green-400">+{dealChange}% vs last month</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Total Revenue</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                ${(salesMetrics.thisMonth.revenue / 1000000).toFixed(2)}M
              </p>
              <p className="mt-2 text-xs text-green-400">+{revenueChange}% vs last month</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Commission Earned</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                ${(salesMetrics.thisMonth.commission / 1000).toFixed(1)}K
              </p>
              <p className="mt-2 text-xs text-slate-400">3% avg commission rate</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
              <p className="text-xs uppercase tracking-widest text-slate-400">Avg Days to Close</p>
              <p className="mt-3 text-3xl font-semibold text-white">{salesMetrics.thisMonth.avgDaysToClose}</p>
              <p className="mt-2 text-xs text-green-400">
                {salesMetrics.lastMonth.avgDaysToClose - salesMetrics.thisMonth.avgDaysToClose} days faster
              </p>
            </div>
          </div>
        </section>

        {/* Lead Pipeline */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-widest text-slate-400">Lead Pipeline</h2>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-white">{leadMetrics.total} Active Leads</p>
                <p className="mt-1 text-sm text-slate-400">{leadMetrics.conversionRate}% conversion rate</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">New</p>
                <p className="mt-2 text-2xl font-semibold text-white">{leadMetrics.new}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Contacted</p>
                <p className="mt-2 text-2xl font-semibold text-white">{leadMetrics.contacted}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Qualified</p>
                <p className="mt-2 text-2xl font-semibold text-white">{leadMetrics.qualified}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Converted</p>
                <p className="mt-2 text-2xl font-semibold text-green-400">{leadMetrics.converted}</p>
              </div>
              <div className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Lost</p>
                <p className="mt-2 text-2xl font-semibold text-red-400">{leadMetrics.lost}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Property Performance */}
        <section className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-widest text-slate-400">Property Performance</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Views</th>
                  <th className="px-6 py-4">Showings</th>
                  <th className="px-6 py-4">Offers</th>
                  <th className="px-6 py-4">Days on Market</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/30">
                {propertyMetrics.map((property, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="px-6 py-4 font-medium text-white">{property.address}</td>
                    <td className="px-6 py-4">{property.views}</td>
                    <td className="px-6 py-4">{property.showings}</td>
                    <td className="px-6 py-4">{property.offers}</td>
                    <td className="px-6 py-4">{property.daysOnMarket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Agent Performance */}
        <section>
          <h2 className="mb-4 text-xs uppercase tracking-widest text-slate-400">Agent Performance</h2>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-6 py-4">Agent</th>
                  <th className="px-6 py-4">Deals Closed</th>
                  <th className="px-6 py-4">Revenue</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Active Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-900/30">
                {agentPerformance.map((agent, idx) => (
                  <tr key={idx} className="text-slate-200">
                    <td className="px-6 py-4 font-medium text-white">{agent.name}</td>
                    <td className="px-6 py-4">{agent.deals}</td>
                    <td className="px-6 py-4">${(agent.revenue / 1000000).toFixed(2)}M</td>
                    <td className="px-6 py-4">${(agent.commission / 1000).toFixed(1)}K</td>
                    <td className="px-6 py-4">{agent.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
