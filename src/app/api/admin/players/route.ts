import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const players = await prisma.player.findMany({
    orderBy: { score: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });

  return NextResponse.json(players);
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, action } = await req.json();
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    if (action === 'ban' || action === 'unban') {
      const player = await prisma.player.update({
        where: { id },
        data: { isBanned: action === 'ban' },
      });
      return NextResponse.json(player);
    }

    if (action === 'reset') {
      await prisma.submission.deleteMany({ where: { playerId: id } });
      const player = await prisma.player.update({ where: { id }, data: { score: 0 } });
      return NextResponse.json(player);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 });
  }
}
