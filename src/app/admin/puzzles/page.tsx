'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Puzzle = {
  id: string;
  code: string;
  title: string;
  question: string;
  answer: string;
  points: number;
  hint: string | null;
  category: string | null;
  difficulty: string;
  type: 'puzzle' | 'trivia';
  explanation: string | null;
  choices: string | null;
  imageUrl?: string | null;
  updatedAt: string;
  _count?: { submissions: number };
};

type PuzzleForm = {
  code: string;
  title: string;
  question: string;
  answer: string;
  points: number;
  hint: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'puzzle' | 'trivia';
  explanation: string;
  choices: string[];
  imageUrl: string;
};

type Mode = 'list' | 'create' | 'edit' | 'qr';

const emptyForm: PuzzleForm = {
  code: '',
  title: '',
  question: '',
  answer: '',
  points: 10,
  hint: '',
  category: '',
  difficulty: 'medium',
  type: 'puzzle',
  explanation: '',
  choices: ['', '', '', ''],
  imageUrl: '',
};

export default function AdminPuzzlesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [authed, setAuthed] = useState(false);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [form, setForm] = useState<PuzzleForm>(emptyForm);
  const [editId, setEditId] = useState('');
  const [qrPuzzle, setQrPuzzle] = useState<Puzzle | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'puzzle' | 'trivia'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

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
    const res = await fetch('/api/admin/puzzles');
    if (res.ok) {
      setPuzzles(await res.json());
    } else if (res.status === 401) {
      router.push('/admin');
    }
  }, [router]);

  async function uploadImageFile() {
    if (!imageFile) return form.imageUrl || null;

    const body = new FormData();
    body.append('image', imageFile);

    const res = await fetch('/api/admin/upload-puzzle-image', {
      method: 'POST',
      body,
    });

    if (!res.ok) {
      throw new Error('Image upload failed');
    }

    const data = await res.json();
    return data.imageUrl as string;
  }

  function handleFileSelect(file: File | null) {
    setImageFile(file);
    setForm((current) => ({ ...current, imageUrl: file ? '' : current.imageUrl }));
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreviewUrl('');
  }, [imageFile]);

  useEffect(() => {
    if (authed) loadPuzzles();
  }, [authed, loadPuzzles]);

  const filteredPuzzles = useMemo(() => {
    return puzzles.filter((puzzle) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        puzzle.code.toLowerCase().includes(search) ||
        puzzle.title.toLowerCase().includes(search) ||
        puzzle.question.toLowerCase().includes(search) ||
        puzzle.category?.toLowerCase().includes(search);
      const matchesType = filterType === 'all' || puzzle.type === filterType;
      const matchesDifficulty = filterDifficulty === 'all' || puzzle.difficulty === filterDifficulty;
      return matchesSearch && matchesType && matchesDifficulty;
    });
  }, [filterDifficulty, filterType, puzzles, searchTerm]);

  async function generateQR(puzzle: Puzzle) {
    setQrPuzzle(puzzle);
    setMode('qr');
    const url = `${window.location.origin}/quest/${puzzle.code}`;
    const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const { dataUrl } = await res.json();
      setQrDataUrl(dataUrl);
    }
  }

  function buildEditForm(puzzle: Puzzle) {
    const choices = puzzle.choices ? JSON.parse(puzzle.choices) as string[] : ['', '', '', ''];
    setForm({
      code: puzzle.code,
      title: puzzle.title,
      question: puzzle.question,
      answer: puzzle.answer,
      points: puzzle.points,
      hint: puzzle.hint || '',
      category: puzzle.category || '',
      difficulty: puzzle.difficulty as 'easy' | 'medium' | 'hard',
      type: puzzle.type,
      explanation: puzzle.explanation || '',
      choices,
      imageUrl: puzzle.imageUrl || '',
    });
    setImageFile(null);
    setEditId(puzzle.id);
    setMode('edit');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const imageUrl = await uploadImageFile();
      const payload = {
        ...form,
        points: form.points || 10,
        hint: form.hint || null,
        category: form.category || null,
        type: form.type,
        difficulty: form.difficulty,
        choices: form.type === 'trivia' ? JSON.stringify(form.choices.filter(Boolean)) : null,
        explanation: form.type === 'trivia' ? form.explanation || null : null,
        imageUrl: imageUrl || null,
      };
      if (mode === 'edit') {
        Object.assign(payload, { id: editId });
      }

      const res = await fetch('/api/admin/puzzles', {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMsg(mode === 'create' ? '✅ Puzzle created!' : '✅ Puzzle updated!');
        await loadPuzzles();
        setTimeout(() => {
          setMode('list');
          setMsg('');
        }, 900);
      } else {
        const errorBody = await res.json();
        setMsg(`❌ ${errorBody?.error || 'Unable to save puzzle'}`);
      }
    } catch {
      setMsg('❌ Network error while saving.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this quest permanently?')) return;
    const res = await fetch('/api/admin/puzzles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      await loadPuzzles();
    }
  }

  if (!authed) return null;

  if (mode === 'qr' && qrPuzzle) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-xl mx-auto">
        <button onClick={() => setMode('list')} className="text-purple-400 hover:text-white mb-6 transition-colors">← Back to Puzzles</button>
        <div className="quest-card p-6 text-center shadow-2xl">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="font-display text-2xl text-white mb-1">{qrPuzzle.title}</h2>
          <p className="text-purple-400 text-sm mb-4">Code: <span className="font-mono text-amber-400">{qrPuzzle.code}</span></p>

          {qrDataUrl ? (
            <div className="mx-auto mb-4 overflow-hidden rounded-3xl bg-white p-4 shadow-xl w-fit">
              <img src={qrDataUrl} alt="QR Code" className="w-56 h-56" />
            </div>
          ) : (
            <div className="mx-auto mb-4 flex h-56 w-56 items-center justify-center rounded-3xl bg-white/10 text-purple-300 animate-pulse">Generating QR…</div>
          )}

          <div className="mx-auto mb-4 max-w-md break-all rounded-3xl border border-purple-700/40 bg-purple-950/60 px-4 py-3 text-xs text-purple-300 font-mono">
            {typeof window !== 'undefined' ? `${window.location.origin}/quest/${qrPuzzle.code}` : `/quest/${qrPuzzle.code}`}
          </div>

          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`quest-${qrPuzzle.code}.png`}
              className="block w-full rounded-2xl bg-amber-500/20 px-5 py-3 text-white transition hover:bg-amber-500/30"
            >
              ⬇️ Download QR Code
            </a>
          )}
        </div>
      </main>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
        <button onClick={() => setMode('list')} className="text-purple-400 hover:text-white mb-6 transition-colors">← Back to Puzzles</button>

        <div className="quest-card p-6 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-white">{mode === 'create' ? 'Create New Quest' : 'Edit Quest'}</h1>
              <p className="text-purple-400 text-sm">Manage both puzzles and trivia quests.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Code</span>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="QUEST-001"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                  maxLength={20}
                />
              </label>
              <label className="space-y-2 text-sm text-purple-300">
                <span>Points</span>
                <input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) => setForm({ ...form, points: Number(e.target.value) || 10 })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'puzzle' | 'trivia' })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="puzzle">Puzzle</option>
                  <option value="trivia">Trivia</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-purple-300">
                <span>Difficulty</span>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-purple-300">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Quest title"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </label>
              <label className="space-y-2 text-sm text-purple-300">
                <span>Category</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="history"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm text-purple-300">
              <span>Question</span>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                rows={4}
                placeholder="Write the question or trivia prompt."
                className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                required
              />
            </label>

            <label className="space-y-2 text-sm text-purple-300">
              <span>Answer</span>
              <input
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="Correct answer"
                className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
              />
            </label>

            {form.type === 'trivia' && (
              <div className="space-y-4 rounded-3xl border border-purple-700/40 bg-purple-950/60 p-4">
                <div className="text-sm font-semibold text-white">Trivia choices</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.choices.map((choice, index) => (
                    <input
                      key={index}
                      value={choice}
                      onChange={(e) => {
                        const next = [...form.choices];
                        next[index] = e.target.value;
                        setForm({ ...form, choices: next });
                      }}
                      placeholder={`Choice ${index + 1}`}
                      className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                      required
                    />
                  ))}
                </div>
                <label className="space-y-2 text-sm text-purple-300">
                  <span>Explanation</span>
                  <textarea
                    value={form.explanation}
                    onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                    rows={3}
                    placeholder="Why the answer is correct"
                    className="w-full rounded-3xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none"
                  />
                </label>
              </div>
            )}

            <label className="space-y-2 text-sm text-purple-300">
              <span>Hint <span className="text-purple-500">(optional)</span></span>
              <input
                value={form.hint}
                onChange={(e) => setForm({ ...form, hint: e.target.value })}
                placeholder="A helpful hint"
                className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              />
            </label>

            <div className="space-y-4 rounded-3xl border border-purple-700/40 bg-purple-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Optional image clue</p>
                  <p className="text-xs text-purple-400">Add a picture riddle, map clue, or hidden hint.</p>
                </div>
                {filePreviewUrl || form.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setForm({ ...form, imageUrl: '' });
                    }}
                    className="rounded-full bg-white/5 px-4 py-2 text-xs text-purple-200 transition hover:bg-white/10"
                  >
                    Remove image
                  </button>
                ) : null}
              </div>

              <label
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-purple-700/50 bg-purple-950/40 px-4 py-8 text-center text-purple-300 transition hover:border-purple-500"
              >
                <input
                  ref={(input) => {
                    fileInputRef.current = input;
                  }}
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    handleFileSelect(file);
                  }}
                />
                <span className="text-sm font-medium">Drag & drop an image here</span>
                <span className="text-xs text-purple-400">or click to select a file</span>
                <span className="text-[12px] text-purple-500">PNG, JPG, GIF up to 5MB</span>
              </label>

              <label className="space-y-2 text-sm text-purple-300">
                <span>Image URL <span className="text-purple-500">(optional)</span></span>
                <input
                  value={form.imageUrl}
                  onChange={(e) => {
                    handleFileSelect(null);
                    setForm({ ...form, imageUrl: e.target.value });
                  }}
                  placeholder="/puzzles/example.jpg or https://..."
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                />
              </label>

              {(filePreviewUrl || form.imageUrl) && (
                <div className="overflow-hidden rounded-3xl border border-purple-700/40 bg-slate-950/80">
                  <img
                    src={filePreviewUrl || form.imageUrl}
                    alt="Puzzle preview"
                    className="h-72 w-full object-cover"
                  />
                </div>
              )}
            </div>

            {msg && (
              <div className={`rounded-2xl p-4 text-sm ${msg.startsWith('✅') ? 'bg-emerald-900/30 text-emerald-300' : 'bg-red-900/30 text-red-300'}`}>
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '⏳ Saving...' : mode === 'create' ? '✨ Create Quest' : '💾 Save Quest'}
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
          <h1 className="font-display text-4xl text-white">Puzzle & Trivia Library</h1>
          <p className="text-purple-300 mt-2">Search, filter, and manage your quests with quick QR access.</p>
        </div>
        <button
          onClick={() => {
            setForm({ ...emptyForm, category: 'general', difficulty: 'medium' });
            setMode('create');
          }}
          className="rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-2xl transition hover:brightness-110"
        >
          + Create New Quest
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search code, title, category"
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'puzzle' | 'trivia')}
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Types</option>
          <option value="puzzle">Puzzle</option>
          <option value="trivia">Trivia</option>
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
          className="w-full rounded-3xl border border-purple-700/40 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredPuzzles.map((puzzle) => (
          <div key={puzzle.id} className="quest-card overflow-hidden border border-purple-700/20 shadow-2xl transition hover:-translate-y-1">
            <div className="p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-blue-300">{puzzle.type}</span>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-amber-300">{puzzle.difficulty}</span>
                {puzzle.category && <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-purple-200">{puzzle.category}</span>}
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-amber-300 mb-1">{puzzle.code}</div>
                  <h2 className="font-display text-xl text-white truncate">{puzzle.title}</h2>
                  <p className="mt-3 text-sm text-purple-300 line-clamp-2">{puzzle.question}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-display text-amber-300">{puzzle.points}</div>
                  <div className="text-xs uppercase tracking-[.2em] text-purple-400">pts</div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 px-5 py-4 bg-slate-950/70 flex flex-wrap gap-3">
              <button onClick={() => generateQR(puzzle)} className="rounded-2xl bg-purple-900/80 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-800/90">📱 QR</button>
              <button onClick={() => buildEditForm(puzzle)} className="rounded-2xl bg-blue-900/80 px-4 py-2 text-sm text-blue-100 transition hover:bg-blue-800/90">✏️ Edit</button>
              <button onClick={() => handleDelete(puzzle.id)} className="rounded-2xl bg-red-900/70 px-4 py-2 text-sm text-red-100 transition hover:bg-red-800/90">🗑️ Delete</button>
              <span className="ml-auto rounded-full bg-white/5 px-3 py-1 text-xs text-purple-300">{puzzle._count?.submissions || 0} solved</span>
            </div>
          </div>
        ))}
      </div>

      {filteredPuzzles.length === 0 && (
        <div className="quest-card p-12 text-center">
          <div className="text-5xl mb-4">🧩</div>
          <p className="text-purple-300 font-display text-xl">No quests match your current filters.</p>
          <button onClick={() => {
            setSearchTerm('');
            setFilterType('all');
            setFilterDifficulty('all');
          }} className="mt-6 rounded-2xl border border-purple-700/40 bg-purple-900/60 px-6 py-3 text-white transition hover:bg-purple-900/80">
            Clear Filters
          </button>
        </div>
      )}
    </main>
  );
}
