'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Question = {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
  order: number;
};

type AnswerResult = {
  questionId: number;
  correct: boolean;
  pointsEarned: number;
  alreadySolved?: boolean;
  selectedAnswer: string;
};

type Phase = 'loading' | 'name' | 'quiz' | 'submitting' | 'complete' | 'completed_before';

export default function TriviaCategoryPage({ params }: { params: { code: string; categoryId: string } }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [phase, setPhase] = useState<Phase>('loading');
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null);
  const [error, setError] = useState('');

  // Load questions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/quest/trivia/category-questions?categoryId=${params.categoryId}&code=${encodeURIComponent(params.code)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.length === 0) {
            setError('No questions available in this category.');
            return;
          }
          setQuestions(data);

          // Check for saved player name
          const saved = localStorage.getItem('hq_player_name');
          if (saved) {
            setPlayerName(saved);
            // Check if this player has already completed this category
            await checkCompletion(saved);
          } else {
            setPhase('name');
          }
        } else {
          setError('Failed to load questions.');
        }
      } catch {
        setError('Network error loading questions.');
      }
    })();
  }, [params.categoryId, params.code]);

  async function checkCompletion(name: string) {
    try {
      const res = await fetch(
        `/api/quest/trivia/category-completion?categoryId=${params.categoryId}&code=${encodeURIComponent(params.code)}&playerName=${encodeURIComponent(name)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.completed) {
          setPhase('completed_before');
        } else {
          setPhase('quiz');
        }
      } else {
        setPhase('quiz');
      }
    } catch {
      setPhase('quiz');
    }
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) return;
    localStorage.setItem('hq_player_name', name);
    setPlayerName(name);
    setPhase('quiz');
  }

  async function handleAnswerSubmit() {
    if (!selectedAnswer || phase === 'submitting') return;
    setPhase('submitting');

    const question = questions[currentIndex];

    // Map selected answer text back to letter key
    let answerKey = selectedAnswer;
    if (selectedAnswer === question.optionA) answerKey = 'A';
    else if (selectedAnswer === question.optionB) answerKey = 'B';
    else if (selectedAnswer === question.optionC) answerKey = 'C';
    else if (selectedAnswer === question.optionD) answerKey = 'D';

    try {
      const res = await fetch('/api/quest/trivia/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName,
          questionId: question.id,
          answer: answerKey,
          hubCode: params.code,
        }),
      });

      const data = await res.json();

      const result: AnswerResult = {
        questionId: question.id,
        correct: data.correct || false,
        pointsEarned: data.pointsEarned || 0,
        alreadySolved: data.alreadySolved || false,
        selectedAnswer,
      };

      setResults((prev) => [...prev, result]);
      setFeedback({ correct: data.correct || false, points: data.pointsEarned || 0 });

      // Wait 1.5s to show feedback, then advance
      setTimeout(() => {
        setFeedback(null);
        setSelectedAnswer('');

        if (currentIndex + 1 < questions.length) {
          setCurrentIndex(currentIndex + 1);
          setPhase('quiz');
        } else {
          setPhase('complete');
        }
      }, 1500);
    } catch {
      setPhase('quiz');
      setFeedback(null);
    }
  }

  const totalCorrect = results.filter((r) => r.correct).length;
  const totalPoints = results.reduce((sum, r) => sum + r.pointsEarned, 0);

  // Error state
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center max-w-sm w-full">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-purple-300 font-display text-xl mb-4">{error}</p>
          <Link href={`/quest/${params.code}`} className="inline-block rounded-2xl bg-purple-600/80 px-6 py-3 text-white font-semibold hover:bg-purple-500 transition-colors">
            ← Back to Hub
          </Link>
        </div>
      </main>
    );
  }

  // Loading state
  if (phase === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="quest-card p-8 text-center max-w-xs w-full">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-purple-300 font-display text-lg animate-pulse">Loading Quiz...</p>
        </div>
      </main>
    );
  }

  // Already completed state
  if (phase === 'completed_before') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-16 left-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl animate-float" />
        <div className="absolute bottom-24 right-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="max-w-sm w-full animate-slide-up">
          <div className="quest-card p-6 shadow-2xl text-center border border-purple-700/20">
            <div className="text-6xl mb-3">✅</div>
            <h1 className="font-display text-3xl text-white mb-2">Already Completed!</h1>
            <p className="text-purple-400 text-lg mb-6">You've already completed this category.</p>
            
            <div className="quest-card p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-200 text-sm">Each category can only be played once to ensure fair leaderboard rankings.</p>
            </div>

            <div className="space-y-3">
              <Link
                href="/leaderboard"
                className="block w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-slate-950 font-semibold shadow-lg hover:brightness-110 transition-all"
              >
                🏆 View Leaderboard
              </Link>
              <Link
                href={`/quest/${params.code}`}
                className="block w-full rounded-2xl border border-purple-700/40 bg-purple-900/60 py-3 text-center text-white transition hover:bg-purple-900/80"
              >
                ← Back to Hub
              </Link>
              <Link
                href="/"
                className="block w-full text-center text-purple-500 text-sm hover:text-white transition-colors py-2"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Name entry
  if (phase === 'name') {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full animate-slide-up">
          <div className="quest-card p-6 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🧠</div>
              <h1 className="font-display text-3xl text-white mb-1">Trivia Quiz</h1>
              <p className="text-purple-400 text-sm">{questions.length} questions ready</p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <label className="block space-y-2 text-sm text-purple-300">
                <span>What&apos;s your name, explorer?</span>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-purple-700/50 bg-purple-950/70 px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  required
                  autoFocus
                  maxLength={30}
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110"
              >
                🚀 Start Quiz
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // Quiz complete - Score Summary
  if (phase === 'complete') {
    const percentage = questions.length > 0 ? Math.round((totalCorrect / questions.length) * 100) : 0;
    let emoji = '🎉';
    let message = 'Outstanding!';
    if (percentage < 40) { emoji = '💪'; message = 'Keep practicing!'; }
    else if (percentage < 70) { emoji = '👏'; message = 'Good effort!'; }
    else if (percentage < 100) { emoji = '🔥'; message = 'Amazing work!'; }

    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-16 left-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl animate-float" />
        <div className="absolute bottom-24 right-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl animate-float" style={{ animationDelay: '1s' }} />

        <div className="max-w-sm w-full animate-slide-up">
          <div className="quest-card p-6 shadow-2xl text-center border border-purple-700/20">
            <div className="text-6xl mb-3">{emoji}</div>
            <h1 className="font-display text-3xl text-white mb-1">Quiz Complete!</h1>
            <p className="text-purple-400 text-lg mb-6">{message}</p>

            {/* Score ring */}
            <div className="relative w-36 h-36 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,92,246,0.2)" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke="url(#scoreGradient)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.64} 264`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl text-white">{totalCorrect}/{questions.length}</span>
                <span className="text-purple-400 text-xs">correct</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="quest-card p-3 text-center">
                <div className="text-amber-400 font-display text-2xl">{totalPoints}</div>
                <div className="text-purple-400 text-xs">Points Earned</div>
              </div>
              <div className="quest-card p-3 text-center">
                <div className="text-emerald-400 font-display text-2xl">{percentage}%</div>
                <div className="text-purple-400 text-xs">Accuracy</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/leaderboard"
                className="block w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center text-slate-950 font-semibold shadow-lg hover:brightness-110 transition-all"
              >
                🏆 View Leaderboard
              </Link>
              <Link
                href={`/quest/${params.code}`}
                className="block w-full rounded-2xl border border-purple-700/40 bg-purple-900/60 py-3 text-center text-white transition hover:bg-purple-900/80"
              >
                ← Back to Hub
              </Link>
              <Link
                href="/"
                className="block w-full text-center text-purple-500 text-sm hover:text-white transition-colors py-2"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Active quiz question
  const question = questions[currentIndex];
  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/quest/${params.code}`}
          className="w-10 h-10 quest-card flex items-center justify-center text-purple-300 hover:text-white transition-colors rounded-xl"
        >
          ←
        </Link>
        <span className="text-purple-400 text-sm font-mono">
          {currentIndex + 1} / {questions.length}
        </span>
        <span className="text-amber-400 text-sm font-semibold">
          💎 {totalPoints} pts
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-purple-900/50 mb-6 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question card */}
      <div className="quest-card p-6 shadow-2xl border border-purple-700/20 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-purple-300">
            Question {currentIndex + 1}
          </span>
          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] uppercase tracking-[.2em] text-amber-300">
            💎 {question.points} pts
          </span>
        </div>

        <h2 className="text-xl text-white font-semibold leading-relaxed mb-6">
          {question.question}
        </h2>

        <div className="space-y-3">
          {options.map((opt) => {
            const isSelected = selectedAnswer === opt.text;
            let borderClass = 'border-purple-700/30 bg-purple-950/30';
            let textClass = 'text-purple-200';

            if (feedback) {
              if (isSelected && feedback.correct) {
                borderClass = 'border-emerald-500/60 bg-emerald-500/15';
                textClass = 'text-emerald-200';
              } else if (isSelected && !feedback.correct) {
                borderClass = 'border-red-500/60 bg-red-500/15';
                textClass = 'text-red-200';
              }
            } else if (isSelected) {
              borderClass = 'border-purple-400/60 bg-purple-700/20';
              textClass = 'text-white';
            }

            return (
              <button
                key={opt.key}
                onClick={() => !feedback && setSelectedAnswer(opt.text)}
                disabled={!!feedback}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${borderClass} ${
                  !feedback ? 'hover:border-purple-400/50 hover:bg-purple-900/30 cursor-pointer' : 'cursor-default'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 shrink-0 rounded-full font-bold text-sm ${
                    isSelected
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-900/50 text-purple-300 border border-purple-700/40'
                  }`}
                >
                  {opt.key}
                </span>
                <span className={`mt-1 text-sm ${textClass}`}>{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`rounded-2xl p-4 text-center text-sm font-semibold mb-4 ${
          feedback.correct
            ? 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300'
            : 'bg-red-900/30 border border-red-500/30 text-red-300'
        }`}>
          {feedback.correct ? `✅ Correct! +${feedback.points} points` : '❌ Incorrect!'}
        </div>
      )}

      {/* Submit button */}
      {!feedback && (
        <button
          onClick={handleAnswerSubmit}
          disabled={!selectedAnswer || phase === 'submitting'}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 py-3 text-lg font-semibold text-white transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {phase === 'submitting' ? '⏳ Submitting...' : currentIndex + 1 === questions.length ? '🏁 Submit Final Answer' : '✨ Submit Answer'}
        </button>
      )}
    </main>
  );
}
