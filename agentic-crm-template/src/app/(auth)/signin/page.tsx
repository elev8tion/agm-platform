"use client";

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('agent@agrm.com');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    router.push('/app');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-10 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Sign in to AgRM</h1>
        <p className="mt-2 text-sm text-slate-400">
          Access your real estate agency workspace to manage properties, leads, and transactions.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300">
              Work email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white focus:border-brand focus:outline-none"
              placeholder="you@company.com"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/80"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
