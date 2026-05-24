import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGameEnabled } from '@/lib/game-hubs';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoryId = url.searchParams.get('categoryId');
  const code = url.searchParams.get('code')?.trim().toUpperCase();
  const playerName = url.searchParams.get('playerName');

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

    const categoryIdNum = parseInt(categoryId, 10);

    // Get all questions for this category
    const questions = await prisma.triviaQuestion.findMany({
      where: { categoryId: categoryIdNum },
      select: { id: true },
    });

    if (questions.length === 0) {
      return NextResponse.json({ completed: false });
    }

    // If playerName is provided, check if this specific player completed at least one question in this category
    if (playerName) {
      const player = await prisma.player.findFirst({
        where: { name: playerName },
      });

      if (!player) {
        return NextResponse.json({ completed: false });
      }

      // Find if this player has any correct submissions for questions in this category
      const correctSubmission = await prisma.submission.findFirst({
        where: {
          playerId: player.id,
          correct: true,
          puzzle: {
            code: {
              in: questions.map((q) => `TRIVIA-Q-${q.id}`),
            },
          },
        },
      });

      return NextResponse.json({ completed: !!correctSubmission });
    }

    // If no playerName, check if ANY player has completed this category
    const correctSubmission = await prisma.submission.findFirst({
      where: {
        correct: true,
        puzzle: {
          code: {
            in: questions.map((q) => `TRIVIA-Q-${q.id}`),
          },
        },
      },
    });

    return NextResponse.json({ completed: !!correctSubmission });
  } catch (error) {
    console.error('Error checking completion:', error);
    return NextResponse.json({ completed: false });
  }
}
