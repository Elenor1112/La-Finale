'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PhotoPuzzle = {
  id: number;
  title: string;
  imageUrl: string;
  question: string;
  points: number;
};

type PuzzleState = 'browsing' | 'solving' | 'correct' | 'wrong' | 'already';

export default function PhotoPuzzlePage({ params }: { params: { code: string } }) {
  const [puzzles, setPuzzles] = useState<PhotoPuzzle[]>([]);
  const [activePuzzle, setActivePuzzle] = useState<PhotoPuzzle | null>(null);
  const [answer, setAnswer] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [nameNeeded, setNameNeeded] = useState(false);
  const [state, setState] = useState<PuzzleState>('browsing');
  const [pointsEarned, setPointsEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/quest/photo/puzzles?code=${encodeURIComponent(params.code)}`);
        if (res.ok) {
          const data = await res.json();
          setPuzzles(data);
        } else {
          setError('No photo puzzles available.');
        }
      } catch {
        setError('Error loading puzzles.');
      } finally {
        setLoading(false);
      }
    })();

    const saved = localStorage.getItem('hq_player_name');
    if (saved) {
      setPlayerName(saved);
    }
  }, [params.code]);

  function startPuzzle(puzzle: PhotoPuzzle) {
    setActivePuzzle(puzzle);
    setAnswer('');
    setState('solving');
    setPointsEarned(0);

    if (!playerName) {
      setNameNeeded(true);
    }
  }

  function handleNameDone(e: React.FormEvent) {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) return;
    localStorage.setItem('hq_player_name', name);
    setPlayerName(name);
    setNameNeeded(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activePuzzle || !answer.trim() || submitting) return;

    const name = playerName || localStorage.getItem('hq_player_name') || '';
    if (!name) {
      setNameNeeded(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/quest/photo/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: name,
          photoId: activePuzzle.id,
          answer: answer.trim(),
          hubCode: params.code,
        }),
      });

      const data = await res.json();
      if (data.alreadySolved) {
        setState('already');
      } else if (data.correct) {
        setState('correct');
        setPointsEarned(data.pointsEarned || 0);
      } else {
        setState('wrong');
      }
    } catch {
      setError('Network error submitting answer.');
    } finally {
      setSubmitting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center max-w-xs w-full">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-purple-300 font-display text-lg animate-pulse">Loading Puzzles...</p>
        </div>
      </main>
    );
  }

  // Error
  if (error && puzzles.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-purple-300 font-display text-xl mb-4">{error}</p>
          <Link href={`/quest/${params.code}`} className="inline-block rounded-2xl bg-purple-600/80 px-6 py-3 text-white font-semibold hover:bg-purple-500 transition-colors">
            ← Back to Hub
          </Link>
        </div>
      </main>
    );
  }

  // Name entry modal
  if (nameNeeded) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full animate-slide-up">
          <div className="quest-card p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🧩</div>
              <h1 className="font-display text-3xl text-white mb-1">Photo Puzzle</h1>
              <p className="text-purple-400 text-sm">Enter your name to submit answers</p>
            </div>
            <form onSubmit={handleNameDone} className="space-y-4">
              <input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                required
                autoFocus
                maxLength={30}
              />
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110">
                Continue
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Solving a puzzle
  if (activePuzzle && state !== 'browsing') {
    return (
      <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
        <button
          onClick={() => { setActivePuzzle(null); setState('browsing'); setAnswer(''); }}
          className="inline-flex items-center gap-2 text-purple-400 hover:text-white mb-6 transition-colors text-sm"
        >
          ← Back to Puzzles
        </button>

        <div className="quest-card shadow-2xl border border-purple-700/20 overflow-hidden">
          {/* Image */}
          <div className="relative">
            <img
              src={activePuzzle.imageUrl}
              alt={activePuzzle.title}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute top-3 right-3 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1 text-xs text-amber-300 font-semibold backdrop-blur-sm">
              💎 {activePuzzle.points} pts
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-display text-2xl text-white mb-2">{activePuzzle.title}</h2>
            <p className="text-purple-300 text-sm mb-6 leading-relaxed">{activePuzzle.question}</p>

            {state === 'solving' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={submitting || !answer.trim()}
                  className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Checking...' : '✨ Submit Answer'}
                </button>
              </form>
            )}

            {state === 'correct' && (
              <div className="text-center">
                <div className="rounded-2xl bg-emerald-900/30 border border-emerald-500/30 p-6 mb-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-emerald-300 font-display text-xl">Correct!</p>
                  <p className="text-emerald-400 text-sm mt-1">+{pointsEarned} points earned</p>
                </div>
                <div className="space-y-3">
                  <Link href="/leaderboard" className="block w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-slate-950 font-semibold hover:brightness-110 transition-all">
                    🏆 View Leaderboard
                  </Link>
                  <Link href={`/quest/${params.code}`} className="block w-full rounded-2xl border border-purple-700/40 bg-purple-900/60 py-3 text-center text-white transition hover:bg-purple-900/80">
                    ← Back to Hub
                  </Link>
                </div>
              </div>
            )}

            {state === 'wrong' && (
              <div className="text-center">
                <div className="rounded-2xl bg-red-900/30 border border-red-500/30 p-4 mb-4">
                  <p className="text-red-300 font-semibold">❌ Incorrect. Try again!</p>
                </div>
                <button
                  onClick={() => { setState('solving'); setAnswer(''); }}
                  className="w-full rounded-2xl bg-purple-600/80 py-3 text-white font-semibold hover:bg-purple-500 transition-colors"
                >
                  🔄 Try Again
                </button>
              </div>
            )}

            {state === 'already' && (
              <div className="text-center">
                <div className="rounded-2xl bg-amber-900/30 border border-amber-500/30 p-4 mb-4">
                  <p className="text-amber-300 font-semibold">⚡ You already solved this puzzle!</p>
                </div>
                <Link href={`/quest/${params.code}`} className="block w-full rounded-2xl border border-purple-700/40 bg-purple-900/60 py-3 text-center text-white transition hover:bg-purple-900/80">
                  ← Back to Hub
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Puzzle list (browsing)
  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <Link
        href={`/quest/${params.code}`}
        className="inline-flex items-center gap-2 text-purple-400 hover:text-white mb-6 transition-colors text-sm"
      >
        ← Back to Hub
      </Link>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🧩</div>
        <h1 className="font-display text-4xl text-white mb-1">Photo Puzzles</h1>
        <p className="text-purple-400 text-sm">Examine the images and solve the clues!</p>
      </div>

      <div className="space-y-4">
        {puzzles.map((puzzle) => (
          <button
            key={puzzle.id}
            onClick={() => startPuzzle(puzzle)}
            className="w-full quest-card overflow-hidden border border-purple-700/20 shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
          >
            <div className="relative">
              <img
                src={puzzle.imageUrl}
                alt={puzzle.title}
                className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3 rounded-full border border-amber-500/30 bg-black/60 px-3 py-1 text-xs text-amber-300 font-semibold backdrop-blur-sm">
                💎 {puzzle.points} pts
              </div>
            </div>
            <div className="p-4">
              <h2 className="font-display text-lg text-white mb-1">{puzzle.title}</h2>
              <p className="text-purple-400 text-sm line-clamp-2">{puzzle.question}</p>
            </div>
          </button>
        ))}
      </div>

      {puzzles.length === 0 && (
        <div className="quest-card p-8 text-center">
          <div className="text-5xl mb-4">📷</div>
          <p className="text-purple-300 font-display text-xl">No puzzles available yet.</p>
        </div>
      )}
    </main>
  );
}
