import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

function buildDailySeries(items: { createdAt: Date }[]) {
  const start = new Date();
  start.setDate(start.getDate() - 13);
  start.setHours(0, 0, 0, 0);

  const counts: Record<string, number> = {};

  items.forEach((item) => {
    const day = item.createdAt.toISOString().slice(0, 10);
    counts[day] = (counts[day] || 0) + 1;
  });

  return Array.from({ length: 14 }, (_, index) => {
    const current = new Date(start);
    current.setDate(current.getDate() + index);
    const label = current.toISOString().slice(0, 10);
    return { date: label, submissions: counts[label] || 0 };
  });
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [players, puzzles, submissions, triviaCount] = await Promise.all([
    prisma.player.count(),
    prisma.photoPuzzle.count(),
    prisma.submission.count(),
    prisma.triviaQuestion.count(),
  ]);

  const mostSolvedGroup = await prisma.submission.groupBy({
    by: ['puzzleId'],
    where: { correct: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1,
  });

  const mostSolvedPuzzle = mostSolvedGroup.length
    ? await prisma.puzzle.findUnique({ where: { id: mostSolvedGroup[0].puzzleId } })
    : null;

  const recentActivity = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { player: true, puzzle: true },
  });

  const topPlayers = await prisma.player.findMany({
    orderBy: { score: 'desc' },
    take: 6,
    include: { _count: { select: { submissions: true } } },
  });

  const recentSubmissions = await prisma.submission.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } },
    select: { createdAt: true },
  });

  return NextResponse.json({
    totals: { players, puzzles, submissions, trivia: triviaCount },
    mostSolved: mostSolvedPuzzle ? {
      id: mostSolvedPuzzle.id,
      code: mostSolvedPuzzle.code,
      title: mostSolvedPuzzle.title,
      solvedCount: mostSolvedGroup[0]._count.id,
    } : null,
    recentActivity: recentActivity.map((item) => ({
      id: item.id,
      playerName: item.player.name,
      puzzleCode: item.puzzle.code,
      correct: item.correct,
      createdAt: item.createdAt.toISOString(),
    })),
    topPlayers: topPlayers.map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      completedQuests: player._count.submissions,
      isBanned: player.isBanned,
    })),
    submissionsOverTime: buildDailySeries(recentSubmissions),
  });
}
