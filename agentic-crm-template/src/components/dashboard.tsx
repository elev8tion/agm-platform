"use client";

import { useState } from 'react';
import { PropertyCard } from './property-card';
import { LeadCard } from './lead-card';
import { TransactionCard } from './transaction-card';

// Mock data from our dataStore
const mockAgency = {
  id: 'tenant-1',
  name: 'Sunset Realty Group'
};

const mockProperties = [
  {
    id: 'prop-1',
    address: '123 Sunset Blvd',
    city: 'Beverly Hills',
    state: 'CA',
    zipCode: '90210',
    price: 2500000,
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3500,
    status: 'AVAILABLE' as const,
    description: 'Stunning luxury home with ocean views',
    images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800']
  },
  {
    id: 'prop-2',
    address: '456 Pacific Coast Hwy',
    city: 'Malibu',
    state: 'CA',
    zipCode: '90265',
    price: 4750000,
    bedrooms: 5,
    bathrooms: 4,
    sqft: 5200,
    status: 'AVAILABLE' as const,
    description: 'Beachfront estate with panoramic ocean views',
    images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800']
  }
];

const mockLeads = [
  {
    id: 'lead-1',
    contactName: 'John Smith',
    email: 'john@example.com',
    phone: '555-1000',
    status: 'QUALIFIED' as const,
    source: 'Open House',
    temperature: 'HOT' as const,
    budget: 2500000,
    timeline: '3 months',
    notes: 'Very interested in Beverly Hills properties'
  }
];

const mockTransactions = [
  {
    id: 'txn-1',
    propertyAddress: '123 Sunset Blvd',
    buyerName: 'Jane Doe',
    status: 'PENDING' as const,
    offerAmount: 2450000,
    commissionAmount: 61250
  }
];

type TabType = 'overview' | 'properties' | 'leads' | 'transactions';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/50 px-4 py-6 sm:px-6 md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-400">Real Estate Agency</p>
            <h1 className="text-3xl font-semibold text-white">{mockAgency.name}</h1>
            <p className="mt-1 text-sm text-slate-400">Your complete real estate management platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-brand/10 px-4 py-2 text-sm text-brand-foreground">
              <span className="font-semibold">Mock Mode</span> - Demo Data Active
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="border-b border-white/10 bg-slate-900/30 px-4 py-6 sm:px-6 md:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Active Properties</p>
            <p className="mt-2 text-3xl font-semibold text-white">2</p>
            <p className="mt-1 text-xs text-green-400">+1 this week</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Qualified Leads</p>
            <p className="mt-2 text-3xl font-semibold text-white">1</p>
            <p className="mt-1 text-xs text-brand-foreground">🔥 Hot lead ready</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Pending Transactions</p>
            <p className="mt-2 text-3xl font-semibold text-white">1</p>
            <p className="mt-1 text-xs text-yellow-400">$2.45M in offers</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-900/50 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-400">Total Portfolio Value</p>
            <p className="mt-2 text-3xl font-semibold text-white">$7.25M</p>
            <p className="mt-1 text-xs text-slate-400">2 listings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 px-4 sm:px-6 md:px-8">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-brand text-brand-foreground'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === 'properties'
                ? 'border-brand text-brand-foreground'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Properties ({mockProperties.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === 'leads'
                ? 'border-brand text-brand-foreground'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Leads ({mockLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`border-b-2 py-4 text-sm font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'border-brand text-brand-foreground'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Transactions ({mockTransactions.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Recent Activity */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                    🏠
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">New property listed</p>
                    <p className="text-xs text-slate-400">456 Pacific Coast Hwy · $4.75M · 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand-foreground">
                    👤
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">New qualified lead</p>
                    <p className="text-xs text-slate-400">John Smith · Budget: $2.5M · 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400">
                    💰
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Offer submitted</p>
                    <p className="text-xs text-slate-400">123 Sunset Blvd · $2.45M · Yesterday</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-white">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <button className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4 text-left hover:border-brand hover:bg-slate-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand-foreground">
                    +
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Add Property</p>
                    <p className="text-xs text-slate-400">List a new property</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4 text-left hover:border-brand hover:bg-slate-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand-foreground">
                    +
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Add Lead</p>
                    <p className="text-xs text-slate-400">Create new contact</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/50 p-4 text-left hover:border-brand hover:bg-slate-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/20 text-brand-foreground">
                    ✉️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Send Email</p>
                    <p className="text-xs text-slate-400">Contact clients</p>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'properties' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Listings</h2>
              <button className="rounded-md bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand/80">
                + Add Property
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {mockProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => console.log('Property clicked:', property.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Leads</h2>
              <button className="rounded-md bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand/80">
                + Add Lead
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => console.log('Lead clicked:', lead.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Active Transactions</h2>
              <button className="rounded-md bg-brand px-4 py-2 text-sm text-brand-foreground hover:bg-brand/80">
                + New Transaction
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {mockTransactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onClick={() => console.log('Transaction clicked:', transaction.id)}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
