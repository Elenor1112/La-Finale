import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseEnabledGames } from '@/lib/game-hubs';

export const dynamic = 'force-dynamic';

function formatHub(hub: any) {
  const enabledGames = parseEnabledGames(hub);
  return {
    ...hub,
    enabledGames,
    triviaEnabled: enabledGames.includes('trivia'),
    puzzleEnabled: enabledGames.includes('puzzle'),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase().trim();
    const first = searchParams.get('first') === '1';

    if (first) {
      const hub = await prisma.gameHub.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!hub) {
        return NextResponse.json({ valid: false, error: 'No Game Hubs found' }, { status: 404 });
      }

      return NextResponse.json({ valid: true, hub: formatHub(hub) });
    }

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const hub = await prisma.gameHub.findUnique({
      where: { code },
    });

    if (!hub) {
      return NextResponse.json({ valid: false, error: 'Game Hub not found' }, { status: 404 });
    }

    return NextResponse.json({ valid: true, hub: formatHub(hub) });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
