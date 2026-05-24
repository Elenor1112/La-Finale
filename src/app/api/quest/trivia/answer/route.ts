import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGameEnabled } from '@/lib/game-hubs';

export async function POST(req: NextRequest) {
  const { playerName, questionId, answer, hubCode } = await req.json();
  if (!playerName || !questionId || !answer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  if (hubCode) {
    const hub = await prisma.gameHub.findUnique({
      where: { code: String(hubCode).trim().toUpperCase() },
    });

    if (!hub) return NextResponse.json({ error: 'Game Hub not found' }, { status: 404 });
    if (!isGameEnabled(hub, 'trivia')) {
      return NextResponse.json({ error: 'Trivia is disabled for this hub' }, { status: 403 });
    }
  }

  const q = await prisma.triviaQuestion.findUnique({ where: { id: Number(questionId) }, include: { category: true } });
  if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

  // Find or create a puzzle representation for leaderboard/submission tracking
  const code = `TRIVIA-Q-${q.id}`;
  let puzzle = await prisma.puzzle.findFirst({ where: { code } });
  if (!puzzle) {
    puzzle = await prisma.puzzle.create({
      data: {
        code,
        type: 'trivia',
        title: `Trivia: ${q.category.name}`,
        question: q.question,
        answer: q.correct,
        choices: JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD]),
        points: q.points,
        category: q.category.name,
      },
    });
  } else {
    puzzle = await prisma.puzzle.update({
      where: { id: puzzle.id },
      data: {
        title: `Trivia: ${q.category.name}`,
        question: q.question,
        answer: q.correct,
        choices: JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD]),
        points: q.points,
        category: q.category.name,
      },
    });
  }

  // Player
  let player = await prisma.player.findFirst({ where: { name: playerName } });
  if (!player) player = await prisma.player.create({ data: { name: playerName, score: 0 } });

  const submitted = String(answer).toUpperCase().trim();
  const correctKey = q.correct.toUpperCase().trim();
  const answerTextByKey: Record<string, string> = {
    A: q.optionA,
    B: q.optionB,
    C: q.optionC,
    D: q.optionD,
  };
  const correct =
    correctKey === submitted ||
    answerTextByKey[correctKey]?.toLowerCase().trim() === String(answer).toLowerCase().trim() ||
    q.correct.toLowerCase().trim() === String(answer).toLowerCase().trim();

  const existing = await prisma.submission.findUnique({ where: { playerId_puzzleId: { playerId: player.id, puzzleId: puzzle.id } } });
  if (existing?.correct) {
    return NextResponse.json({ alreadySolved: true, correct, pointsEarned: 0 });
  }

  if (existing) {
    await prisma.submission.update({
      where: { id: existing.id },
      data: { correct, attempts: { increment: 1 } },
    });
  } else {
    await prisma.submission.create({ data: { playerId: player.id, puzzleId: puzzle.id, correct } });
  }

  if (correct) {
    await prisma.player.update({ where: { id: player.id }, data: { score: { increment: puzzle.points } } });
  }

  return NextResponse.json({ correct, pointsEarned: correct ? puzzle.points : 0 });
}
