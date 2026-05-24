'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Player = {
  id: string;
  name: string;
  score: number;
  isBanned: boolean;
  createdAt: string;
  _count: { submissions: number };
};

export default function AdminPlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string>('');

  useEffect(() => {
    async function loadPlayers() {
      const res = await fetch('/api/admin/players');
      if (res.ok) {
        setPlayers(await res.json());
      } else if (res.status === 401) {
        router.push('/admin');
      }
      setLoading(false);
    }
    loadPlayers();
  }, [router]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players;
    const query = search.toLowerCase();
    return players.filter((player) => player.name.toLowerCase().includes(query));
  }, [players, search]);

  async function handleAction(id: string, action: 'ban' | 'unban' | 'reset') {
    setActionLoading(id);
    const res = await fetch('/api/admin/players', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPlayers((current) => current.map((player) => (player.id === id ? updated : player)));
    }
    setActionLoading('');
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    const res = await fetch('/api/admin/players', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setPlayers((current) => current.filter((player) => player.id !== id));
    }
    setActionLoading('');
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-white">Player Management</h1>
          <p className="text-purple-300 mt-2">Review players, reset progress, and flag problematic accounts.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push('/admin/dashboard')} className="rounded-2xl bg-purple-600/80 px-5 py-3 text-white transition hover:bg-purple-500/90">Back to dashboard</button>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-purple-700/40 bg-slate-950/70 p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players by name"
          className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/60 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="quest-card h-32 animate-pulse" />
          ))
        ) : filteredPlayers.length === 0 ? (
          <div className="quest-card p-12 text-center">
            <p className="text-purple-300">No players match your search.</p>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <div key={player.id} className="quest-card p-5 shadow-2xl border border-purple-700/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-purple-400">{player.name}</p>
                  <h2 className="font-display text-2xl text-white">{player.score} pts</h2>
                  <p className="text-purple-300 text-sm">Completed {player._count.submissions} quests</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs ${player.isBanned ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {player.isBanned ? 'Banned' : 'Active'}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-purple-300">Joined {new Date(player.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleAction(player.id, player.isBanned ? 'unban' : 'ban')}
                  disabled={actionLoading === player.id}
                  className="rounded-2xl bg-blue-900/70 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-800/90 disabled:opacity-60"
                >
                  {player.isBanned ? 'Unban' : 'Ban'}
                </button>
                <button
                  onClick={() => handleAction(player.id, 'reset')}
                  disabled={actionLoading === player.id}
                  className="rounded-2xl bg-red-900/70 px-4 py-2 text-sm text-red-100 transition hover:bg-red-800/90 disabled:opacity-60"
                >
                  Reset Progress
                </button>
                <button
                  onClick={() => handleDelete(player.id)}
                  disabled={actionLoading === player.id}
                  className="rounded-2xl bg-rose-900/70 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-800/90 disabled:opacity-60"
                >
                  Delete Player
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
