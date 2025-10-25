"use client";

import { type Property } from '@/lib/services/dataStore';
import { formatCurrency, formatAddress } from '@/lib/utils';

type PropertyCardProps = {
  property: Property;
  onClick?: () => void;
};

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const statusColors = {
    available: 'bg-green-500/20 text-green-300',
    pending: 'bg-yellow-500/20 text-yellow-300',
    sold: 'bg-red-500/20 text-red-300'
  };

  return (
    <article
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-slate-900/50 p-6 transition-all hover:border-brand hover:bg-slate-900/70 cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {formatCurrency(property.price)}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${
                statusColors[property.status]
              }`}
            >
              {property.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            {formatAddress(property)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-slate-400">
        {property.bedrooms && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{property.bedrooms}</span>
            <span>bed</span>
          </div>
        )}
        {property.bathrooms && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{property.bathrooms}</span>
            <span>bath</span>
          </div>
        )}
        {property.sqft && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-white">{property.sqft.toLocaleString()}</span>
            <span>sqft</span>
          </div>
        )}
      </div>

      {property.description && (
        <p className="mt-4 line-clamp-2 text-sm text-slate-400">
          {property.description}
        </p>
      )}
    </article>
  );
}
