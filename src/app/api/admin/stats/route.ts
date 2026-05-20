// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [players, puzzles, submissions] = await Promise.all([
    prisma.player.count(),
    prisma.puzzle.count(),
    prisma.submission.count(),
  ]);
  return NextResponse.json({ players, puzzles, submissions });
}
