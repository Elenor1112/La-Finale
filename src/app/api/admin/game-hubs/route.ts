import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';
import { normalizeEnabledGames, parseEnabledGames, serializeEnabledGames } from '@/lib/game-hubs';

function formatHub(hub: any) {
  const enabledGames = parseEnabledGames(hub);
  return {
    ...hub,
    enabledGames,
    triviaEnabled: enabledGames.includes('trivia'),
    puzzleEnabled: enabledGames.includes('puzzle'),
  };
}

function gamesFromPayload(payload: any) {
  const explicitGames = normalizeEnabledGames(payload.enabledGames);
  if (explicitGames.length > 0 || Array.isArray(payload.enabledGames)) {
    return explicitGames;
  }

  const games = [];
  if (payload.triviaEnabled !== false) games.push('trivia');
  if (payload.puzzleEnabled !== false) games.push('puzzle');
  return normalizeEnabledGames(games);
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hubs = await prisma.gameHub.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(hubs.map(formatHub));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch game hubs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, code, triviaEnabled, puzzleEnabled, enabledGames } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Missing name or code' }, { status: 400 });
    }

    const hubCode = String(code).toUpperCase().trim();

    // Check unique code
    const existing = await prisma.gameHub.findUnique({ where: { code: hubCode } });
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    const games = gamesFromPayload({ triviaEnabled, puzzleEnabled, enabledGames });

    const hub = await prisma.gameHub.create({
      data: {
        name: name.trim(),
        code: hubCode,
        enabledGames: serializeEnabledGames(games),
        triviaEnabled: games.includes('trivia'),
        puzzleEnabled: games.includes('puzzle'),
      },
    });

    return NextResponse.json(formatHub(hub));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create game hub' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, code, triviaEnabled, puzzleEnabled, enabledGames } = await req.json();

    if (!id || !name || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hubCode = String(code).toUpperCase().trim();

    // Check unique code excluding this hub
    const existing = await prisma.gameHub.findFirst({
      where: {
        code: hubCode,
        NOT: { id },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }

    const games = gamesFromPayload({ triviaEnabled, puzzleEnabled, enabledGames });

    const hub = await prisma.gameHub.update({
      where: { id },
      data: {
        name: name.trim(),
        code: hubCode,
        enabledGames: serializeEnabledGames(games),
        triviaEnabled: games.includes('trivia'),
        puzzleEnabled: games.includes('puzzle'),
      },
    });

    return NextResponse.json(formatHub(hub));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update game hub' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing hub id' }, { status: 400 });
    }

    await prisma.gameHub.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete game hub' }, { status: 500 });
  }
}
