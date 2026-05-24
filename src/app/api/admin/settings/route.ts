import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { leaderboardVisible } = body;
  if (typeof leaderboardVisible !== 'boolean') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const up = await prisma.appSettings.upsert({ where: { id: 1 }, update: { leaderboardVisible }, create: { leaderboardVisible } });
  return NextResponse.json({ ok: true, settings: up });
}
