import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = await prisma.submission.findMany({
    orderBy: { createdAt: 'desc' },
    include: { player: true, puzzle: true },
  });

  return NextResponse.json(submissions);
}
