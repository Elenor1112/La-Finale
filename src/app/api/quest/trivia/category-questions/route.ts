import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGameEnabled } from '@/lib/game-hubs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get('categoryId');
  const code = url.searchParams.get('code')?.trim().toUpperCase();

  if (!categoryId) {
    return NextResponse.json({ error: 'Missing categoryId' }, { status: 400 });
  }

  try {
    if (code) {
      const hub = await prisma.gameHub.findUnique({ where: { code } });
      if (!hub) return NextResponse.json({ error: 'Game Hub not found' }, { status: 404 });
      if (!isGameEnabled(hub, 'trivia')) {
        return NextResponse.json({ error: 'Trivia is disabled for this hub' }, { status: 403 });
      }
    }

    const id = parseInt(categoryId, 10);
    const questions = await prisma.triviaQuestion.findMany({
      where: { categoryId: id },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    });

    // We only return option text and points (without answer, so they can't cheat on client side)
    const formatted = questions.map((q) => ({
      id: q.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      points: q.points,
      order: q.order,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}
