'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type PhotoPuzzle = {
  id: number;
  title: string;
  imageUrl: string;
  question: string;
  answer: string;
  points: number;
  active: boolean;
};

type PhotoPuzzleForm = {
  title: string;
  imageUrl: string;
  question: string;
  answer: string;
  points: number;
  active: boolean;
};

const emptyForm: PhotoPuzzleForm = {
  title: '',
  imageUrl: '',
  question: '',
  answer: '',
  points: 15,
  active: true,
};

type Mode = 'list' | 'create' | 'edit';

export default function AdminPhotoPuzzlesPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [puzzles, setPuzzles] = useState<PhotoPuzzle[]>([]);
  const [form, setForm] = useState<PhotoPuzzleForm>(emptyForm);
  const [mode, setMode] = useState<Mode>('list');
  const [editId, setEditId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  const loadPuzzles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/photo-puzzles');
      if (res.ok) {
        setPuzzles(await res.json());
      } else if (res.status === 401) {
        router.push('/admin');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authed) loadPuzzles();
  }, [authed, loadPuzzles]);

  const filteredPuzzles = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return puzzles;
    return puzzles.filter((puzzle) =>
      [puzzle.title, puzzle.question, puzzle.answer].some((value) =>
        value.toLowerCase().includes(search)
      )
    );
  }, [puzzles, searchTerm]);

  function startCreate() {
    setForm(emptyForm);
    setEditId(null);
    setMode('create');
    setMessage('');
  }

  function startEdit(puzzle: PhotoPuzzle) {
    setForm({
      title: puzzle.title,
      imageUrl: puzzle.imageUrl,
      question: puzzle.question,
      answer: puzzle.answer,
      points: puzzle.points,
      active: puzzle.active,
    });
    setEditId(puzzle.id);
    setMode('edit');
    setMessage('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage('');
    const payload = {
      ...form,
      points: Number(form.points) || 15,
    };

    if (mode === 'edit') {
      Object.assign(payload, { id: editId });
    }

    const res = await fetch('/api/admin/photo-puzzles', {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage(mode === 'create' ? 'Puzzle created.' : 'Puzzle updated.');
      await loadPuzzles();
      setTimeout(() => {
        setMode('list');
        setEditId(null);
        setForm(emptyForm);
        setMessage('');
      }, 700);
    } else {
      const body = await res.json();
      setMessage(body?.error || 'Unable to save puzzle.');
    }
    setSaving(false);
  }

  async function deletePuzzle(id: number) {
    if (!confirm('Delete this photo puzzle permanently?')) return;
    const res = await fetch('/api/admin/photo-puzzles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadPuzzles();
    }
  }

  async function toggleActive(puzzle: PhotoPuzzle) {
    const res = await fetch('/api/admin/photo-puzzles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...puzzle, active: !puzzle.active }),
    });
    if (res.ok) {
      await loadPuzzles();
    }
  }

  if (!authed) return null;

  if (mode === 'create' || mode === 'edit') {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <button
          onClick={() => {
            setMode('list');
            setForm(emptyForm);
            setEditId(null);
          }}
          className="text-purple-400 hover:text-white mb-6 transition-colors"
        >
          Back to Puzzles
        </button>

        <div className="quest-card p-6 shadow-2xl">
          <h1 className="font-display text-3xl text-white mb-2">
            {mode === 'create' ? 'Create Photo Puzzle' : 'Edit Photo Puzzle'}
          </h1>
          <p className="text-purple-400 text-sm mb-6">Photo puzzles appear inside enabled Game Hubs.</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-purple-300">
                <span>Points</span>
                <input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) || 15 })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-purple-300">
              <span>Image URL</span>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="/puzzles/example.png or https://..."
                className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </label>

            {form.imageUrl && (
              <div className="overflow-hidden rounded-3xl border border-purple-700/40 bg-slate-950/80">
                <img src={form.imageUrl} alt="Puzzle preview" className="h-56 w-full object-cover" />
              </div>
            )}

            <label className="space-y-2 text-sm text-purple-300">
              <span>Question</span>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                rows={3}
                className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-purple-300">
              <span>Answer</span>
              <input
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl border border-purple-700/40 bg-purple-950/60 p-4 text-purple-200">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-5 w-5 accent-purple-500"
              />
              Enabled for players
            </label>

            {message && (
              <div className="rounded-2xl border border-purple-700/30 bg-purple-950/60 p-4 text-sm text-purple-200">
                {message}
              </div>
            )}

            <button
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create Puzzle' : 'Save Puzzle'}
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
          <h1 className="font-display text-4xl text-white">Photo Puzzles</h1>
          <p className="text-purple-300 mt-2">Create, edit, delete, and enable puzzle challenges.</p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:brightness-110"
        >
          + Create Puzzle
        </button>
      </div>

      <input
        type="search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search title, question, or answer..."
        className="mb-6 w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500"
      />

      {loading ? (
        <div className="quest-card p-8 text-center text-purple-300">Loading puzzles...</div>
      ) : filteredPuzzles.length === 0 ? (
        <div className="quest-card p-10 text-center text-purple-300">No photo puzzles found.</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredPuzzles.map((puzzle) => (
            <div key={puzzle.id} className="quest-card overflow-hidden border border-purple-700/20 shadow-2xl">
              <img src={puzzle.imageUrl} alt={puzzle.title} className="h-44 w-full object-cover" />
              <div className="p-5">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl text-white">{puzzle.title}</h2>
                    <p className="mt-1 text-sm text-purple-300">{puzzle.question}</p>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-sm font-semibold text-amber-300">
                    {puzzle.points} pts
                  </span>
                </div>
                <p className="mb-4 text-xs text-purple-500">
                  Answer: <span className="font-mono text-purple-300">{puzzle.answer}</span>
                </p>
                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <button
                    onClick={() => toggleActive(puzzle)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                      puzzle.active
                        ? 'bg-emerald-900/70 text-emerald-100'
                        : 'bg-slate-800 text-purple-200'
                    }`}
                  >
                    {puzzle.active ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => startEdit(puzzle)}
                    className="rounded-2xl bg-blue-900/80 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-800/90"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deletePuzzle(puzzle.id)}
                    className="rounded-2xl bg-red-900/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-800/90"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
