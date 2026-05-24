import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGameEnabled } from '@/lib/game-hubs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();

  if (code) {
    const hub = await prisma.gameHub.findUnique({ where: { code } });
    if (!hub) {
      return NextResponse.json({ error: 'Game Hub not found' }, { status: 404 });
    }

    if (!isGameEnabled(hub, 'puzzle')) {
      return NextResponse.json({ error: 'Puzzles are disabled for this hub' }, { status: 403 });
    }
  }

  const puzzles = await prisma.photoPuzzle.findMany({
    where: { active: true },
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      title: true,
      imageUrl: true,
      question: true,
      points: true,
    },
  });

  return NextResponse.json(puzzles);
}
