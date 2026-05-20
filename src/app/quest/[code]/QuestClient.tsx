'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Puzzle = {
  id: string;
  code: string;
  type: 'puzzle' | 'trivia';
  title: string;
  question: string;
  answer: string;
  points: number;
  hint: string | null;
  choices?: string[] | string | null;
  explanation?: string | null;
  category?: string | null;
  difficulty?: string | null;
  imageUrl?: string | null;
};

type Phase = 'name' | 'quiz' | 'correct' | 'wrong' | 'already_solved';

export default function QuestClient({ puzzle }: { puzzle: Puzzle }) {
  const [phase, setPhase] = useState<Phase>('name');
  const [playerName, setPlayerName] = useState('');
  const [answer, setAnswer] = useState('');
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const isPuzzle = puzzle.type === 'puzzle';
  const choices = Array.isArray(puzzle.choices) ? puzzle.choices : puzzle.choices ? JSON.parse(puzzle.choices) : [];
  const isTriviaMultiChoice = puzzle.type === 'trivia' && choices.length > 0;

  useEffect(() => {
    const saved = localStorage.getItem('hq_player_name');
    if (saved) {
      setPlayerName(saved);
      setPhase('quiz');
    }
  }, []);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem('hq_player_name', playerName.trim());
    setPhase('quiz');
  }

  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    const submitAnswer = isPuzzle ? answer : selectedChoice;
    if (!submitAnswer.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          puzzleId: puzzle.id,
          answer: submitAnswer.trim(),
        }),
      });

      const data = await res.json();

      if (data.alreadySolved) {
        setPhase('already_solved');
      } else if (data.correct) {
        setPointsEarned(data.pointsEarned);
        setPhase('correct');
      } else {
        setAttempts((a) => a + 1);
        setPhase('wrong');
        setTimeout(() => setPhase('quiz'), 2000);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Name Entry ──────────────────────────────────────────────
  if (phase === 'name') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full animate-bounce-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-float">🗺️</div>
            <h1 className="font-display text-4xl text-white mb-2">Welcome, Explorer!</h1>
            <p className="text-purple-300">Enter your name to begin your quest</p>
          </div>

          <form onSubmit={handleNameSubmit} className="quest-card p-6 space-y-4">
            <div>
              <label className="block text-purple-300 text-sm font-semibold mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Alex the Brave"
                maxLength={30}
                className="w-full bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className="w-full btn-shimmer py-3 rounded-xl text-white font-display text-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              Start Quest! 🚀
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Quiz/Puzzle ──────────────────────────────────────────────
  if (phase === 'quiz') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full">
          {/* Back */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-purple-400 hover:text-white transition-colors">← Home</Link>
            <div className="ml-auto text-purple-400 text-sm">👤 {playerName}</div>
          </div>

          {/* Quiz card */}
          <div className="quest-card p-6 animate-slide-up glow-border">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-2 bg-purple-900/50 rounded-full px-3 py-1 text-xs text-purple-300 mb-2">
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                  {puzzle.type === 'puzzle' ? '🧩 Puzzle' : '🧠 Trivia'} #{puzzle.code}
                </div>
                <h2 className="font-display text-2xl text-white">{puzzle.title}</h2>
              </div>
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                {puzzle.type === 'puzzle' ? '🧩' : '🧠'}
              </div>
            </div>

            {puzzle.imageUrl ? (
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="group relative block w-full overflow-hidden rounded-3xl border border-purple-700/30 bg-slate-950/80 shadow-xl transition hover:-translate-y-0.5"
                >
                  {/* FIX: Use padding-top aspect ratio trick instead of aspect-video
                      so the container always has an explicit height before paint,
                      preventing the Next.js Image fill height-0 warning. */}
                  <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
                    <Image
                      src={puzzle.imageUrl}
                      alt={`Image clue for ${puzzle.title}`}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 800px"
                      unoptimized={puzzle.imageUrl?.startsWith('http')}
                    />
                  </div>
                  <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    Tap to zoom
                  </span>
                </button>
              </div>
            ) : null}

            {/* Points and difficulty badges */}
            <div className="flex gap-2 mb-5 flex-wrap">
              <div className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1 text-amber-400 text-sm font-semibold">
                ⭐ {puzzle.points} points
              </div>
              {puzzle.difficulty && (
                <div className="inline-flex items-center gap-1 bg-purple-900/30 border border-purple-700/30 rounded-full px-3 py-1 text-purple-400 text-sm">
                  {puzzle.difficulty === 'easy' && '🟢'}
                  {puzzle.difficulty === 'medium' && '🟡'}
                  {puzzle.difficulty === 'hard' && '🔴'}
                  <span className="capitalize">{puzzle.difficulty}</span>
                </div>
              )}
              {puzzle.category && (
                <div className="inline-flex items-center gap-1 bg-purple-900/30 border border-purple-700/30 rounded-full px-3 py-1 text-purple-300 text-sm capitalize">
                  {puzzle.category}
                </div>
              )}
            </div>

            {/* Question */}
            <div className="bg-purple-900/30 rounded-xl p-4 mb-5 border border-purple-700/30">
              <p className="text-white leading-relaxed text-lg">{puzzle.question}</p>
            </div>

            {/* Hint (for puzzles) */}
            {isPuzzle && puzzle.hint && (
              <button
                onClick={() => setShowHint(!showHint)}
                className="w-full text-left mb-4"
              >
                <div className="flex items-center gap-2 text-amber-400/70 hover:text-amber-400 text-sm transition-colors">
                  <span>{showHint ? '🙈' : '💡'}</span>
                  {showHint ? 'Hide hint' : 'Need a hint? (-5 points)'}
                </div>
                {showHint && (
                  <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-amber-200 text-sm animate-slide-up">
                    {puzzle.hint}
                  </div>
                )}
              </button>
            )}

            {/* Attempt counter */}
            {attempts > 0 && (
              <div className="text-red-400 text-sm mb-3 text-center">
                {attempts} incorrect attempt{attempts > 1 ? 's' : ''} ❌
              </div>
            )}

            {/* Answer form */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3">
              {isPuzzle ? (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer..."
                  className="w-full bg-purple-900/30 border border-purple-700/50 rounded-xl px-4 py-3 text-white placeholder-purple-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                  autoFocus
                />
              ) : (
                <div className="space-y-2">
                  {choices.map((choice: string, idx: number) => (
                    <label key={idx} className="flex items-center gap-3 p-3 border border-purple-700/50 rounded-xl hover:bg-purple-900/20 cursor-pointer transition-all">
                      <input
                        type="radio"
                        name="choice"
                        value={choice}
                        checked={selectedChoice === choice}
                        onChange={(e) => setSelectedChoice(e.target.value)}
                        className="w-4 h-4 cursor-pointer accent-purple-500"
                      />
                      <span className="text-white flex-1">{choice}</span>
                    </label>
                  ))}
                </div>
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading || (isPuzzle ? !answer.trim() : !selectedChoice)}
                className="w-full btn-shimmer py-3 rounded-xl text-white font-display text-xl disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              >
                {loading ? '⏳ Checking...' : 'Submit Answer! ⚡'}
              </button>
            </form>

            {/* Zoom modal */}
            {zoomOpen && puzzle.imageUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
                <button
                  type="button"
                  onClick={() => setZoomOpen(false)}
                  className="absolute right-6 top-6 rounded-full bg-slate-950/90 px-3 py-2 text-sm text-white shadow-lg"
                >
                  Close
                </button>
                <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4">
                  {/* FIX: Same padding-top trick for the zoomed modal image */}
                  <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
                    <Image
                      src={puzzle.imageUrl}
                      alt={`Zoomed image for ${puzzle.title}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 1200px"
                      unoptimized={puzzle.imageUrl?.startsWith('http')}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ── Correct ──────────────────────────────────────────────────
  if (phase === 'correct') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center animate-bounce-in">
          <div className="text-8xl mb-4 animate-star-spin">⭐</div>
          <h1 className="font-display text-5xl text-emerald-400 mb-2">Correct!</h1>
          <p className="text-purple-300 mb-6">Amazing work, {playerName}!</p>

          {puzzle.explanation && (
            <div className="quest-card p-4 bg-purple-900/30 border border-purple-700/30 rounded-xl mb-6">
              <p className="text-purple-200 text-sm leading-relaxed">{puzzle.explanation}</p>
            </div>
          )}

          <div className="quest-card p-6 glow-green mb-6">
            <div className="font-display text-6xl text-amber-400 mb-2">+{pointsEarned}</div>
            <div className="text-purple-300">points earned</div>
          </div>

          <div className="space-y-3">
            <Link href="/leaderboard" className="block w-full btn-shimmer py-3 rounded-xl text-white font-display text-xl text-center hover:scale-105 transition-transform">
              🏆 View Leaderboard
            </Link>
            <Link href="/" className="block w-full quest-card py-3 rounded-xl text-purple-300 font-display text-xl text-center hover:text-white transition-colors">
              🗺️ Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Wrong ────────────────────────────────────────────────────
  if (phase === 'wrong') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center animate-bounce-in">
          <div className="text-8xl mb-4">❌</div>
          <h1 className="font-display text-5xl text-red-400 mb-2">Not Quite!</h1>
          <p className="text-purple-300">Try again in a moment...</p>
        </div>
      </main>
    );
  }

  // ── Already Solved ───────────────────────────────────────────
  if (phase === 'already_solved') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center animate-bounce-in">
          <div className="text-8xl mb-4">✅</div>
          <h1 className="font-display text-4xl text-amber-400 mb-2">Already Solved!</h1>
          <p className="text-purple-300 mb-6">You've already completed this quest, {playerName}!</p>
          <div className="space-y-3">
            <Link href="/leaderboard" className="block w-full btn-shimmer py-3 rounded-xl text-white font-display text-xl text-center">
              🏆 Leaderboard
            </Link>
            <Link href="/" className="block w-full quest-card py-3 rounded-xl text-purple-300 font-display text-xl text-center">
              🗺️ Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
