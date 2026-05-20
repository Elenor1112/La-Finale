// src/app/api/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { score: 'desc' },
    take: 50,
    include: {
      _count: { select: { submissions: { where: { correct: true } } } },
    },
  });
  return NextResponse.json(players);
}
