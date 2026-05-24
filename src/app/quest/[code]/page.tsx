import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isGameEnabled } from '@/lib/game-hubs';

export const dynamic = 'force-dynamic';

export default async function QuestLanding({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();

  const hub = await prisma.gameHub.findUnique({ where: { code } });
  if (!hub) notFound();
  const triviaEnabled = isGameEnabled(hub, 'trivia');
  const puzzleEnabled = isGameEnabled(hub, 'puzzle');

  const triviaCategories = triviaEnabled
    ? await prisma.triviaCategory.findMany({ orderBy: { name: 'asc' } })
    : [];

  const puzzleCount = puzzleEnabled
    ? await prisma.photoPuzzle.count({ where: { active: true } })
    : 0;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Floating orbs */}
      <div className="absolute top-16 left-8 w-24 h-24 rounded-full bg-purple-600/20 blur-2xl animate-float" />
      <div className="absolute bottom-24 right-8 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="max-w-md w-full animate-slide-up">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-purple-400 hover:text-white mb-8 transition-colors text-sm"
        >
          ← Back to Home
        </Link>

        {/* Hub header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl btn-shimmer flex items-center justify-center mx-auto shadow-2xl mb-4">
            <span className="text-4xl">🏢</span>
          </div>
          <h1 className="font-display text-4xl text-white mb-1">{hub.name}</h1>
          <p className="text-purple-400 text-sm font-mono">
            Code: <span className="text-amber-400">{hub.code}</span>
          </p>
        </div>

        {/* Game selection */}
        <h2 className="font-display text-xl text-purple-300 mb-4 text-center">Choose Your Challenge</h2>

        <div className="space-y-4">
          {triviaEnabled && (
            <div className="quest-card p-5 border border-purple-700/20 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center text-3xl">🧠</div>
                <div>
                  <div className="font-display text-xl text-white">Trivia Quiz</div>
                  <div className="text-purple-400 text-sm">
                    {triviaCategories.length} {triviaCategories.length === 1 ? 'category' : 'categories'} available
                  </div>
                </div>
              </div>

              {triviaCategories.length > 0 ? (
                <div className="grid gap-2">
                  {triviaCategories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/quest/${code}/trivia/${c.id}`}
                      className="flex items-center justify-between p-3 rounded-2xl border border-purple-700/30 bg-purple-950/40 text-white hover:bg-purple-900/50 hover:border-purple-500/50 transition-all group"
                    >
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className="text-purple-400 group-hover:text-amber-400 transition-colors text-lg">→</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-purple-500 text-sm">No trivia categories yet.</p>
              )}
            </div>
          )}

          {puzzleEnabled && (
            <Link
              href={`/quest/${code}/puzzle`}
              className="block quest-card p-5 border border-purple-700/20 shadow-2xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🧩</div>
                <div className="flex-1">
                  <div className="font-display text-xl text-white">Photo Puzzles</div>
                  <div className="text-purple-400 text-sm">
                    {puzzleCount} {puzzleCount === 1 ? 'puzzle' : 'puzzles'} to solve
                  </div>
                </div>
                <div className="text-purple-400 group-hover:text-amber-400 text-xl transition-colors">→</div>
              </div>
            </Link>
          )}

          {!triviaEnabled && !puzzleEnabled && (
            <div className="quest-card p-8 text-center">
              <div className="text-5xl mb-4">🔒</div>
              <p className="text-purple-300 font-display text-lg">No games are enabled for this hub yet.</p>
              <p className="text-purple-500 text-sm mt-2">Check back later!</p>
            </div>
          )}
        </div>

        {/* Leaderboard link */}
        <Link
          href="/leaderboard"
          className="block mt-6 quest-card p-4 text-center border border-purple-700/20 hover:border-amber-500/40 transition-all"
        >
          <span className="text-amber-400 font-display text-lg">🏆 View Leaderboard</span>
        </Link>
      </div>
    </main>
  );
}
