/**
 * Dashboard Header
 * Top header with user info and budget meter
 */

'use client';

import { Brand } from '@/types';
import { BudgetMeter } from './BudgetMeter';
import { User, Bell, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  brand: Brand;
  budgetSpent: number;
  className?: string;
}

export function DashboardHeader({ brand, budgetSpent, className }: DashboardHeaderProps) {
  return (
    <header className={className}>
      <div className="flex items-center justify-between">
        {/* Brand Info */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{brand.name}</h1>
          {brand.industry && (
            <p className="text-sm text-slate-400 mt-0.5">{brand.industry}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Budget Meter */}
          <BudgetMeter
            spent={budgetSpent}
            total={brand.monthly_budget_usd}
            compact
          />

          {/* Icons */}
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors relative">
              <Bell className="h-5 w-5 text-slate-400" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
              <Settings className="h-5 w-5 text-slate-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-800/60 transition-colors">
              <User className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
