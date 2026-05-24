'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TriviaCategory = {
  id: number;
  name: string;
  _count?: {
    questions: number;
  };
};

export default function AdminTriviaCategoriesPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [categories, setCategories] = useState<TriviaCategory[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
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

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/trivia-categories');
      if (res.ok) {
        setCategories(await res.json());
      } else if (res.status === 401) {
        router.push('/admin');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authed) loadCategories();
  }, [authed, loadCategories]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    setMessage('');
    const res = await fetch('/api/admin/trivia-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });

    if (res.ok) {
      setName('');
      setMessage('Category created.');
      await loadCategories();
    } else {
      const body = await res.json();
      setMessage(body?.error || 'Unable to create category.');
    }
    setSaving(false);
  }

  async function updateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editingName.trim() || saving) return;

    setSaving(true);
    setMessage('');
    const res = await fetch('/api/admin/trivia-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, name: editingName.trim() }),
    });

    if (res.ok) {
      setEditingId(null);
      setEditingName('');
      setMessage('Category updated.');
      await loadCategories();
    } else {
      const body = await res.json();
      setMessage(body?.error || 'Unable to update category.');
    }
    setSaving(false);
  }

  async function deleteCategory(id: number) {
    if (!confirm('Delete this category and all of its questions?')) return;
    const res = await fetch('/api/admin/trivia-categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadCategories();
    }
  }

  if (!authed) return null;

  return (
    <main className="min-h-screen px-4 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-4xl text-white">Trivia Categories</h1>
          <p className="text-purple-300 mt-2">Create and organize the quiz categories shown to players.</p>
        </div>
      </div>

      <form onSubmit={createCategory} className="quest-card p-5 mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="min-w-0 flex-1 rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          required
        />
        <button
          disabled={saving || !name.trim()}
          className="rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Category
        </button>
      </form>

      {message && (
        <div className="mb-6 rounded-2xl border border-purple-700/30 bg-purple-950/60 p-4 text-sm text-purple-200">
          {message}
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="quest-card p-8 text-center text-purple-300">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="quest-card p-8 text-center text-purple-300">No trivia categories yet.</div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="quest-card p-5 border border-purple-700/20">
              {editingId === category.id ? (
                <form onSubmit={updateCategory} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="min-w-0 flex-1 rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    autoFocus
                    required
                  />
                  <button className="rounded-2xl bg-emerald-700/80 px-4 py-3 text-sm font-semibold text-white">
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditingName('');
                    }}
                    className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-semibold text-purple-200"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-display text-2xl text-white">{category.name}</h2>
                    <p className="text-sm text-purple-400">
                      {category._count?.questions || 0} questions
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                      className="rounded-2xl bg-blue-900/80 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-800/90"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="rounded-2xl bg-red-900/70 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-800/90"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
