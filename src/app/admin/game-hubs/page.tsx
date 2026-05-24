'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type GameType } from '@/lib/game-hubs';

type GameHub = {
  id: string;
  name: string;
  code: string;
  enabledGames: GameType[];
  triviaEnabled: boolean;
  puzzleEnabled: boolean;
  createdAt: string;
};

type GameHubForm = {
  name: string;
  code: string;
  enabledGames: GameType[];
};

const emptyForm: GameHubForm = {
  name: '',
  code: '',
  enabledGames: ['trivia', 'puzzle'],
};

type Mode = 'list' | 'create' | 'edit' | 'qr';

export default function AdminGameHubsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [hubs, setHubs] = useState<GameHub[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [form, setForm] = useState<GameHubForm>(emptyForm);
  const [editId, setEditId] = useState('');
  const [qrHub, setQrHub] = useState<GameHub | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function authorize() {
      const res = await fetch('/api/admin/auth');
      if (res.ok) {
        setAuthed(true);
      } else {
        router.push('/admin');
      }
    }
    authorize();
  }, [router]);

  const loadHubs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/game-hubs');
      if (res.ok) {
        setHubs(await res.json());
      } else if (res.status === 401) {
        router.push('/admin');
      }
    } catch (err) {
      console.error('Failed to load hubs', err);
    }
  }, [router]);

  useEffect(() => {
    if (authed) {
      loadHubs();
    }
  }, [authed, loadHubs]);

  const filteredHubs = useMemo(() => {
    return hubs.filter((hub) => {
      const search = searchTerm.trim().toLowerCase();
      return (
        !search ||
        hub.name.toLowerCase().includes(search) ||
        hub.code.toLowerCase().includes(search)
      );
    });
  }, [hubs, searchTerm]);

  async function generateQR(hub: GameHub) {
    setQrHub(hub);
    setMode('qr');
    const url = `${window.location.origin}/quest/${hub.code}`;
    const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const { dataUrl } = await res.json();
      setQrDataUrl(dataUrl);
    }
  }

  function buildEditForm(hub: GameHub) {
    setForm({
      name: hub.name,
      code: hub.code,
      enabledGames: hub.enabledGames?.length
        ? hub.enabledGames
        : [
            ...(hub.triviaEnabled ? (['trivia'] as GameType[]) : []),
            ...(hub.puzzleEnabled ? (['puzzle'] as GameType[]) : []),
          ],
    });
    setEditId(hub.id);
    setMode('edit');
  }

  function toggleGame(game: GameType, enabled: boolean) {
    setForm((current) => ({
      ...current,
      enabledGames: enabled
        ? Array.from(new Set([...current.enabledGames, game]))
        : current.enabledGames.filter((item) => item !== game),
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        triviaEnabled: form.enabledGames.includes('trivia'),
        puzzleEnabled: form.enabledGames.includes('puzzle'),
      };
      if (mode === 'edit') {
        Object.assign(payload, { id: editId });
      }

      const res = await fetch('/api/admin/game-hubs', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg(mode === 'create' ? '✅ Game Hub created!' : '✅ Game Hub updated!');
        await loadHubs();
        setTimeout(() => {
          setMode('list');
          setMsg('');
          setForm(emptyForm);
          setEditId('');
        }, 900);
      } else {
        const errorBody = await res.json();
        setMsg(`❌ ${errorBody?.error || 'Unable to save game hub'}`);
      }
    } catch {
      setMsg('❌ Network error while saving.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this game hub permanently?')) return;
    const res = await fetch('/api/admin/game-hubs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadHubs();
    }
  }

  function copyURL(code: string) {
    const url = `${window.location.origin}/quest/${code}`;
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard! 📋');
  }

  if (!authed) return null;

  if (mode === 'qr' && qrHub) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
        <button
          onClick={() => {
            setMode('list');
            setQrHub(null);
            setQrDataUrl('');
          }}
          className="text-purple-400 hover:text-white mb-6 transition-colors"
        >
          ← Back to Game Hubs
        </button>
        <div className="quest-card p-6 text-center shadow-2xl">
          <div className="text-4xl mb-3">🏢</div>
          <h2 className="font-display text-2xl text-white mb-1">{qrHub.name}</h2>
          <p className="text-purple-400 text-sm mb-4">
            Code: <span className="font-mono text-amber-400">{qrHub.code}</span>
          </p>

          {qrDataUrl ? (
            <div className="mx-auto mb-4 overflow-hidden rounded-3xl bg-white p-4 shadow-xl w-fit">
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-56 w-56 items-center justify-center rounded-3xl bg-white/10 text-purple-300 animate-pulse">
              Generating QR…
            </div>
          )}

          <div className="mx-auto mb-4 max-w-md break-all rounded-3xl border border-purple-700/40 bg-purple-950/60 px-4 py-3 text-xs text-purple-300 font-mono">
            {typeof window !== 'undefined'
              ? `${window.location.origin}/quest/${qrHub.code}`
              : `/quest/${qrHub.code}`}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => copyURL(qrHub.code)}
              className="flex-1 rounded-2xl bg-purple-600/80 px-4 py-3 text-white transition hover:bg-purple-500/90 text-sm"
            >
              📋 Copy URL
            </button>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`hub-${qrHub.code}.png`}
                className="flex-1 rounded-2xl bg-amber-500/95 px-4 py-3 text-slate-950 transition hover:bg-amber-400 text-sm font-semibold flex items-center justify-center"
              >
                ⬇️ Download QR
              </a>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setMode('list');
            setForm(emptyForm);
            setEditId('');
            setMsg('');
          }}
          className="text-purple-400 hover:text-white mb-6 transition-colors"
        >
          ← Back to Game Hubs
        </button>

        <div className="quest-card p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="font-display text-3xl text-white">
              {mode === 'create' ? 'Create New Game Hub' : 'Edit Game Hub'}
            </h1>
            <p className="text-purple-400 text-sm">
              Setup a campus Game Hub with designated quest challenges.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Hub Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Freshers Hub"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-purple-300">
                <span>Unique Code</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. FRESHERS2026"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                  maxLength={30}
                />
              </label>
            </div>

            <div className="space-y-4 rounded-3xl border border-purple-700/40 bg-purple-950/60 p-5">
              <div className="text-sm font-semibold text-white">Enabled Game Options</div>
              <p className="text-xs text-purple-400 -mt-2">
                Decide which game experiences will show up for explorers on this hub.
              </p>

              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 border border-purple-700/50 rounded-xl hover:bg-purple-900/20 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={form.enabledGames.includes('trivia')}
                    onChange={(e) => toggleGame('trivia', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-purple-500"
                  />
                  <div>
                    <span className="text-white font-semibold block">🧠 Trivia Quiz Category</span>
                    <span className="text-xs text-purple-400">Let players pick and play ordered quiz categories</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-purple-700/50 rounded-xl hover:bg-purple-900/20 cursor-pointer transition-all">
                  <input
                    type="checkbox"
                    checked={form.enabledGames.includes('puzzle')}
                    onChange={(e) => toggleGame('puzzle', e.target.checked)}
                    className="w-5 h-5 cursor-pointer accent-purple-500"
                  />
                  <div>
                    <span className="text-white font-semibold block">🧩 Photo Puzzles</span>
                    <span className="text-xs text-purple-400">Let players choose and solve image clues</span>
                  </div>
                </label>
              </div>
            </div>

            {msg && (
              <div
                className={`rounded-2xl p-4 text-sm ${
                  msg.startsWith('✅') ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'
                }`}
              >
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '⏳ Saving...' : mode === 'create' ? '✨ Create Game Hub' : '💾 Save Changes'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-white">Campus Game Hubs</h1>
          <p className="text-purple-300 mt-2">Manage QR codes and select active games for your target locations.</p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setMode('create');
          }}
          className="rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:brightness-110"
        >
          + Create Game Hub
        </button>
      </div>

      <div className="mb-6">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search hub name or code..."
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredHubs.map((hub) => (
          <div
            key={hub.id}
            className="quest-card overflow-hidden border border-purple-700/20 shadow-2xl transition hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="font-mono text-xs text-amber-300 block mb-1">
                    🏢 {hub.code}
                  </span>
                  <h2 className="font-display text-2xl text-white truncate">{hub.name}</h2>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[.2em] font-semibold ${
                    hub.enabledGames?.includes('trivia')
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  🧠 Trivia: {hub.enabledGames?.includes('trivia') ? 'ON' : 'OFF'}
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[.2em] font-semibold ${
                    hub.enabledGames?.includes('puzzle')
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  🧩 Puzzle: {hub.enabledGames?.includes('puzzle') ? 'ON' : 'OFF'}
                </span>
              </div>

              <div className="border-t border-white/10 pt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => generateQR(hub)}
                  className="rounded-2xl bg-purple-900/80 px-4 py-2 text-sm font-semibold text-purple-100 transition hover:bg-purple-800/90"
                >
                  📱 QR Code
                </button>
                <button
                  onClick={() => buildEditForm(hub)}
                  className="rounded-2xl bg-blue-900/80 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-800/90"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(hub.id)}
                  className="rounded-2xl bg-red-900/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-800/90"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredHubs.length === 0 && (
        <div className="quest-card p-12 text-center">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-purple-300 font-display text-xl">No campus Game Hubs found.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-6 rounded-2xl border border-purple-700/40 bg-purple-900/60 px-6 py-3 text-white transition hover:bg-purple-900/80"
          >
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );
}
