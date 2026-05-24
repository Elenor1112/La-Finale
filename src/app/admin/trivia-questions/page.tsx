'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type TriviaQuestion = {
  id: number;
  categoryId: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: string; // 'A' | 'B' | 'C' | 'D'
  points: number;
  order: number;
  category: {
    id: number;
    name: string;
  };
};

type TriviaCategory = {
  id: number;
  name: string;
};

type TriviaForm = {
  categoryId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correct: 'A' | 'B' | 'C' | 'D';
  points: number;
  order: number;
};

const emptyForm: TriviaForm = {
  categoryId: '',
  question: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correct: 'A',
  points: 10,
  order: 0,
};

type Mode = 'list' | 'create' | 'edit';

export default function AdminTriviaQuestionsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [categories, setCategories] = useState<TriviaCategory[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [form, setForm] = useState<TriviaForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const loadData = useCallback(async () => {
    try {
      const [questionsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/trivia-questions'),
        fetch('/api/trivia-categories'),
      ]);

      if (questionsRes.ok && categoriesRes.ok) {
        setQuestions(await questionsRes.json());
        setCategories(await categoriesRes.json());
      } else if (questionsRes.status === 401) {
        router.push('/admin');
      }
    } catch (err) {
      console.error('Failed to load trivia data', err);
    }
  }, [router]);

  useEffect(() => {
    if (authed) {
      loadData();
    }
  }, [authed, loadData]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        q.question.toLowerCase().includes(search) ||
        q.optionA.toLowerCase().includes(search) ||
        q.optionB.toLowerCase().includes(search) ||
        q.optionC.toLowerCase().includes(search) ||
        q.optionD.toLowerCase().includes(search);
      const matchesCategory =
        filterCategory === 'all' || q.categoryId === Number(filterCategory);
      return matchesSearch && matchesCategory;
    });
  }, [questions, searchTerm, filterCategory]);

  function buildEditForm(q: TriviaQuestion) {
    setForm({
      categoryId: String(q.categoryId),
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correct: q.correct as 'A' | 'B' | 'C' | 'D',
      points: q.points,
      order: q.order || 0,
    });
    setEditId(q.id);
    setMode('edit');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    if (!form.categoryId) {
      setMsg('❌ Please select a category.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        points: Number(form.points) || 10,
        order: Number(form.order) || 0,
      };

      if (mode === 'edit' && editId !== null) {
        Object.assign(payload, { id: editId });
      }

      const res = await fetch('/api/admin/trivia-questions', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg(mode === 'create' ? '✅ Question created!' : '✅ Question updated!');
        await loadData();
        setTimeout(() => {
          setMode('list');
          setMsg('');
          setForm(emptyForm);
          setEditId(null);
        }, 900);
      } else {
        const errorBody = await res.json();
        setMsg(`❌ ${errorBody?.error || 'Unable to save question'}`);
      }
    } catch {
      setMsg('❌ Network error while saving.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this trivia question permanently?')) return;
    const res = await fetch('/api/admin/trivia-questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadData();
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
            setMsg('');
          }}
          className="text-purple-400 hover:text-white mb-6 transition-colors"
        >
          ← Back to Questions
        </button>

        <div className="quest-card p-6 shadow-2xl">
          <div className="mb-6">
            <h1 className="font-display text-3xl text-white">
              {mode === 'create' ? 'Create New Trivia Question' : 'Edit Trivia Question'}
            </h1>
            <p className="text-purple-400 text-sm">Fill in the fields below to update the quest library.</p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Category</span>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm text-purple-300">
                <span>Points</span>
                <input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) || 10 })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>

              <label className="space-y-2 text-sm text-purple-300">
                <span>Sort Order</span>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-purple-300">
              <span>Question Prompt</span>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                rows={3}
                placeholder="Write the trivia question prompt..."
                className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </label>

            <div className="space-y-4 rounded-3xl border border-purple-700/40 bg-purple-950/60 p-4">
              <div className="text-sm font-semibold text-white">Answer Choices</div>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-purple-300">
                  <span>Option A</span>
                  <input
                    value={form.optionA}
                    onChange={(e) => setForm({ ...form, optionA: e.target.value })}
                    placeholder="First option"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs text-purple-300">
                  <span>Option B</span>
                  <input
                    value={form.optionB}
                    onChange={(e) => setForm({ ...form, optionB: e.target.value })}
                    placeholder="Second option"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs text-purple-300">
                  <span>Option C</span>
                  <input
                    value={form.optionC}
                    onChange={(e) => setForm({ ...form, optionC: e.target.value })}
                    placeholder="Third option"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </label>

                <label className="space-y-1 text-xs text-purple-300">
                  <span>Option D</span>
                  <input
                    value={form.optionD}
                    onChange={(e) => setForm({ ...form, optionD: e.target.value })}
                    placeholder="Fourth option"
                    className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-2 text-sm text-purple-300">
                <span>Correct Option</span>
                <select
                  value={form.correct}
                  onChange={(e) => setForm({ ...form, correct: e.target.value as 'A' | 'B' | 'C' | 'D' })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </label>
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
              {loading ? '⏳ Saving...' : mode === 'create' ? '✨ Create Question' : '💾 Save Changes'}
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
          <h1 className="font-display text-4xl text-white">Trivia Question Bank</h1>
          <p className="text-purple-300 mt-2">Manage multiple-choice questions for all your categories.</p>
        </div>
        <button
          onClick={() => {
            const firstCategory = categories[0]?.id ? String(categories[0].id) : '';
            setForm({ ...emptyForm, categoryId: firstCategory });
            setMode('create');
          }}
          className="rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:brightness-110"
        >
          + Create Trivia Question
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search question prompt or options..."
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="quest-card overflow-hidden border border-purple-700/20 shadow-2xl transition hover:-translate-y-1"
          >
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-purple-200">
                  📚 {q.category?.name || 'Uncategorized'}
                </span>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-amber-300">
                  💎 {q.points} Points
                </span>
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-cyan-300">
                  🔢 Order: {q.order}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-6">
                <div className="flex-1">
                  <h2 className="text-xl text-white font-semibold leading-relaxed">{q.question}</h2>
                  
                  <div className="grid gap-3 sm:grid-cols-2 mt-4">
                    {[
                      { key: 'A', text: q.optionA },
                      { key: 'B', text: q.optionB },
                      { key: 'C', text: q.optionC },
                      { key: 'D', text: q.optionD },
                    ].map((opt) => {
                      const isCorrect = q.correct === opt.key;
                      return (
                        <div
                          key={opt.key}
                          className={`flex items-start gap-3 p-3 rounded-2xl border text-sm transition-all ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                              : 'bg-purple-950/20 border-purple-900/30 text-purple-300'
                          }`}
                        >
                          <span
                            className={`flex items-center justify-center w-6 h-6 shrink-0 rounded-full font-bold text-xs ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-purple-900/40 text-purple-300 border border-purple-800/40'
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="break-words mt-0.5">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex gap-3">
                <button
                  onClick={() => buildEditForm(q)}
                  className="rounded-2xl bg-blue-900/80 px-5 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-800/90"
                >
                  ✏️ Edit Question
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="rounded-2xl bg-red-900/70 px-5 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-800/90"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredQuestions.length === 0 && (
        <div className="quest-card p-12 text-center">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-purple-300 font-display text-xl">No trivia questions found.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
            }}
            className="mt-6 rounded-2xl border border-purple-700/40 bg-purple-900/60 px-6 py-3 text-white transition hover:bg-purple-900/80"
          >
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );
}
