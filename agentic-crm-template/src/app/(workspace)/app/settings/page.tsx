'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: false,
    weeklyDigest: true
  });

  const mockServiceStatus = [
    { name: 'Email Service', status: 'mock', provider: 'Resend' },
    { name: 'SMS Service', status: 'mock', provider: 'Twilio' },
    { name: 'AI Assistant', status: 'ready', provider: 'OpenAI' },
    { name: 'Database', status: 'mock', provider: 'In-Memory' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Configure your CRM preferences and integrations
          </p>
        </div>

        {/* Profile Settings */}
        <section className="mb-8 rounded-xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
          <p className="mt-1 text-sm text-slate-400">Manage your account information</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Full Name</label>
              <input
                type="text"
                defaultValue="Sarah Agent"
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/70 px-4 py-2 text-white focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                defaultValue="sarah@sunsetrealty.com"
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/70 px-4 py-2 text-white focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Phone Number</label>
              <input
                type="tel"
                defaultValue="555-0100"
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/70 px-4 py-2 text-white focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          <button className="mt-6 rounded-md bg-brand px-6 py-2 text-sm text-brand-foreground hover:bg-brand/80">
            Save Changes
          </button>
        </section>

        {/* Notification Settings */}
        <section className="mb-8 rounded-xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <p className="mt-1 text-sm text-slate-400">Choose how you want to be notified</p>

          <div className="mt-6 space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.emailNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, emailNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-white">Email Notifications</p>
                <p className="text-xs text-slate-400">Receive email alerts for new leads and messages</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.smsNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, smsNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-white">SMS Notifications</p>
                <p className="text-xs text-slate-400">Get text alerts for urgent updates</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-white">Push Notifications</p>
                <p className="text-xs text-slate-400">Browser notifications for real-time updates</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notificationSettings.weeklyDigest}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklyDigest: e.target.checked })}
                className="h-4 w-4 rounded border-white/20 bg-slate-900 text-brand focus:ring-brand"
              />
              <div>
                <p className="text-sm font-medium text-white">Weekly Digest</p>
                <p className="text-xs text-slate-400">Summary of your week's activity every Monday</p>
              </div>
            </label>
          </div>
        </section>

        {/* Commission Settings */}
        <section className="mb-8 rounded-xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Commission Settings</h2>
          <p className="mt-1 text-sm text-slate-400">Configure your commission structure</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300">Default Commission Rate (%)</label>
              <input
                type="number"
                defaultValue="3.0"
                step="0.1"
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/70 px-4 py-2 text-white focus:border-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Listing Fee ($)</label>
              <input
                type="number"
                defaultValue="500"
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-900/70 px-4 py-2 text-white focus:border-brand focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Service Status */}
        <section className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Service Status</h2>
          <p className="mt-1 text-sm text-slate-400">Current integration status</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {mockServiceStatus.map((service) => (
              <div key={service.name} className="rounded-lg border border-white/5 bg-slate-900/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{service.name}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${
                      service.status === 'mock'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {service.status === 'mock' ? 'Mock' : 'Ready'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">{service.provider}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-white/10 bg-slate-950/50 p-4">
            <p className="text-xs text-slate-400">
              See <span className="font-mono text-brand-foreground">PRODUCTION_INTEGRATION_GUIDE.md</span> for steps to connect production services
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
