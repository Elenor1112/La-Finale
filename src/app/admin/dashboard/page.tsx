'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

type DashboardData = {
  totals: { players: number; puzzles: number; submissions: number; trivia: number };
  mostSolved: { id: string; code: string; title: string; solvedCount: number } | null;
  recentActivity: Array<{ id: string; playerName: string; puzzleCode: string; correct: boolean; createdAt: string }>;
  topPlayers: Array<{ id: string; name: string; score: number; completedQuests: number; isBanned: boolean }>;
  submissionsOverTime: Array<{ date: string; submissions: number }>;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          setDashboard(await res.json());
        } else if (res.status === 401) {
          router.push('/admin');
        } else {
          const body = await res.json();
          setError(body?.error || 'Unable to load dashboard');
        }
      } catch {
        setError('Unable to reach the dashboard API');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="quest-card h-32 animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !dashboard) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="quest-card p-8">
          <h1 className="text-2xl font-display text-white">Dashboard error</h1>
          <p className="mt-4 text-purple-300">{error || 'No dashboard data available.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-purple-400">Admin dashboard</p>
          <h1 className="font-display text-5xl text-white">Operations overview</h1>
          <p className="mt-3 max-w-2xl text-purple-300">A real-time view of players, submissions, top content, and recent puzzle activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/puzzles" className="rounded-2xl bg-purple-600/80 px-5 py-3 text-white transition hover:bg-purple-500/90">Manage Puzzles</Link>
          <Link href="/admin/players" className="rounded-2xl bg-amber-500/90 px-5 py-3 text-slate-950 transition hover:bg-amber-400">Player Hub</Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4 mb-6">
        {[
          { label: 'Players', value: dashboard.totals.players, accent: 'from-purple-700 via-fuchsia-700 to-indigo-500' },
          { label: 'Submissions', value: dashboard.totals.submissions, accent: 'from-amber-500 via-orange-500 to-rose-500' },
          { label: 'Puzzles', value: dashboard.totals.puzzles, accent: 'from-sky-500 via-cyan-500 to-teal-500' },
          { label: 'Trivia', value: dashboard.totals.trivia, accent: 'from-lime-500 via-emerald-500 to-teal-500' },
        ].map((card) => (
          <motion.div key={card.label} className={`quest-card p-6 bg-gradient-to-br ${card.accent} bg-opacity-10`} whileHover={{ y: -4 }}>
            <p className="text-sm uppercase tracking-[0.25em] text-purple-300">{card.label}</p>
            <p className="mt-4 text-4xl font-display text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3 mb-6">
        <section className="quest-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-white">Submissions over time</h2>
              <p className="text-sm text-purple-400">Last 14 days</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.submissionsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="submissionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#3f2f6b" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#c4b5fd', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#c4b5fd', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#120a1f', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="submissions" stroke="#A855F7" strokeWidth={3} fill="url(#submissionsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="quest-card p-6">
          <h2 className="font-display text-2xl text-white mb-3">Most solved quest</h2>
          {dashboard.mostSolved ? (
            <div className="rounded-3xl border border-purple-700/40 bg-slate-950/70 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-purple-400">{dashboard.mostSolved.code}</p>
              <h3 className="mt-2 text-2xl text-white">{dashboard.mostSolved.title}</h3>
              <p className="mt-3 text-purple-300">Solved <span className="font-semibold text-amber-300">{dashboard.mostSolved.solvedCount}</span> times</p>
            </div>
          ) : (
            <p className="text-purple-300">No completed quests yet.</p>
          )}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="quest-card p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-white">Recent activity</h2>
            <Link href="/admin/submissions" className="text-purple-300 text-sm hover:text-white">View all</Link>
          </div>
          <div className="space-y-3">
            {dashboard.recentActivity.map((activity) => (
              <div key={activity.id} className="rounded-3xl border border-purple-700/30 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-purple-300">{activity.puzzleCode}</p>
                    <p className="text-white">{activity.playerName}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs ${activity.correct ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {activity.correct ? 'Correct' : 'Wrong'}
                  </span>
                </div>
                <p className="text-xs text-purple-500">{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="quest-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-white">Top players</h2>
            <Link href="/admin/players" className="text-purple-300 text-sm hover:text-white">Manage</Link>
          </div>
          <div className="space-y-3">
            {dashboard.topPlayers.map((player, index) => (
              <div key={player.id} className="rounded-3xl border border-purple-700/30 bg-slate-950/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-purple-300">#{index + 1} {player.name}</p>
                    <p className="text-xs text-purple-500">Completed {player.completedQuests} quests</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display text-amber-300">{player.score}</p>
                    {player.isBanned && <p className="text-xs text-red-400">Banned</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
