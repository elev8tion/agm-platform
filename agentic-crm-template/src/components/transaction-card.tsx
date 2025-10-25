"use client";

import { type Transaction } from '@/lib/services/dataStore';
import { formatCurrency } from '@/lib/utils';

type TransactionCardProps = {
  transaction: Transaction;
  onClick?: () => void;
};

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    accepted: 'bg-green-500/20 text-green-300',
    rejected: 'bg-red-500/20 text-red-300',
    closed: 'bg-emerald-500/20 text-emerald-300'
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
              {formatCurrency(transaction.offerAmount)}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs uppercase tracking-widest ${
                statusColors[transaction.status]
              }`}
            >
              {transaction.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{transaction.buyerName}</p>
          <p className="mt-0.5 text-sm text-slate-400">{transaction.buyerEmail}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        {transaction.closingDate && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Closing:</span>
            <span className="text-slate-300">
              {new Date(transaction.closingDate).toLocaleDateString()}
            </span>
          </div>
        )}
        {transaction.commissionAmount && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Commission:</span>
            <span className="font-medium text-green-400">
              {formatCurrency(transaction.commissionAmount)}
            </span>
            {transaction.commissionRate && (
              <span className="text-slate-500">
                ({(transaction.commissionRate * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        )}
      </div>

      {transaction.notes && (
        <p className="mt-4 line-clamp-2 text-sm text-slate-400">{transaction.notes}</p>
      )}
    </article>
  );
}
