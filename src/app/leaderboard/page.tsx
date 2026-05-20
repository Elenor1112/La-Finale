// src/app/leaderboard/page.tsx
import { prisma } from '@/lib/prisma';
import LeaderboardClient from './LeaderboardClient';

export const dynamic = 'force-dynamic';

async function getLeaderboard() {
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
  return <LeaderboardClient initialPlayers={players} />;
}
