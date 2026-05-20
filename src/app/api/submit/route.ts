// src/app/api/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { playerName, puzzleId, answer } = await req.json();

  if (!playerName || !puzzleId || !answer) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Get or create player
  let player = await prisma.player.findFirst({
    where: { name: playerName },
  });

  if (!player) {
    player = await prisma.player.create({
      data: { name: playerName, score: 0 },
    });
  }

  // Check if already solved
  const existing = await prisma.submission.findUnique({
    where: { playerId_puzzleId: { playerId: player.id, puzzleId } },
  });

  if (existing) {
    return NextResponse.json({ alreadySolved: true });
  }

  // Get puzzle
  const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });

  const correct = puzzle.answer.toLowerCase().trim() === answer.toLowerCase().trim();

  // Save submission
  await prisma.submission.create({
    data: { playerId: player.id, puzzleId: puzzle.id, correct },
  });

  // Award points if correct
  if (correct) {
    await prisma.player.update({
      where: { id: player.id },
      data: { score: { increment: puzzle.points } },
    });
  }

  return NextResponse.json({ correct, pointsEarned: correct ? puzzle.points : 0 });
}
