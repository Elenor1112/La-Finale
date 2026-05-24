// src/app/leaderboard/page.tsx
import { prisma } from '@/lib/prisma';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

async function getLeaderboard() {
  const settings = await prisma.appSettings.findUnique({ where: { id: 1 } });
  if (settings && settings.leaderboardVisible === false) return null;
  return prisma.player.findMany({
    orderBy: { score: 'desc' },
    take: 50,
    include: {
      _count: { select: { submissions: { where: { correct: true } } } },
    },
  });
}

export default async function LeaderboardPage() {
  const players = await getLeaderboard();
  if (!players) {
    return (
      <main className="min-h-screen px-4 py-8 max-w-lg mx-auto text-center">
        <h1 className="font-display text-3xl text-amber-400 mb-4">Leaderboard is currently unavailable.</h1>
        <p className="text-purple-300">Please check back later.</p>
      </main>
    );
  }
  return <LeaderboardClient initialPlayers={players} />;
}
