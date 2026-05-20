// src/app/admin/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/auth');
        if (res.ok) {
          router.replace('/admin/dashboard');
          return;
        }
      } catch {
        // ignore
      } finally {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        setError('Wrong password. Try again.');
      }
    } catch {
      setError('Unable to reach the server.');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center animate-pulse">
          <p className="text-purple-300">Checking admin access...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="font-display text-5xl text-white">Admin Access</h1>
          <p className="text-purple-400 mt-3">Secure control for the Herts Quest dashboard.</p>
        </div>

        <form onSubmit={handleLogin} className="quest-card p-8 space-y-5 shadow-2xl border border-purple-500/20">
          <label className="block text-sm font-semibold text-purple-200">Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-purple-700/60 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-purple-500"
            autoFocus
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full btn-shimmer rounded-2xl py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'Enter Admin Dashboard'}
          </button>

          <div className="text-xs text-purple-400 leading-5">
            Default password: <span className="text-amber-400 font-mono">hertsquest2024</span>
            <br />
            Change it via <span className="text-amber-400 font-mono">ADMIN_PASSWORD</span> in your .env file.
          </div>
        </form>
      </div>
    </main>
  );
}
