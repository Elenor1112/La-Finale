import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isGameEnabled } from '@/lib/game-hubs';

export async function POST(req: NextRequest) {
  const { playerName, photoId, answer, hubCode } = await req.json();
  if (!playerName || !photoId || !answer) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  if (hubCode) {
    const hub = await prisma.gameHub.findUnique({
      where: { code: String(hubCode).trim().toUpperCase() },
    });

    if (!hub) return NextResponse.json({ error: 'Game Hub not found' }, { status: 404 });
    if (!isGameEnabled(hub, 'puzzle')) {
      return NextResponse.json({ error: 'Puzzles are disabled for this hub' }, { status: 403 });
    }
  }

  const p = await prisma.photoPuzzle.findUnique({ where: { id: Number(photoId) } });
  if (!p || !p.active) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

  const code = `PHOTO-${p.id}`;
  let puzzle = await prisma.puzzle.findFirst({ where: { code } });
  if (!puzzle) {
    puzzle = await prisma.puzzle.create({
      data: {
        code,
        type: 'puzzle',
        title: p.title,
        question: p.question,
        answer: p.answer,
        imageUrl: p.imageUrl,
        points: p.points,
      },
    });
  } else {
    puzzle = await prisma.puzzle.update({
      where: { id: puzzle.id },
      data: {
        title: p.title,
        question: p.question,
        answer: p.answer,
        imageUrl: p.imageUrl,
        points: p.points,
      },
    });
  }

  let player = await prisma.player.findFirst({ where: { name: playerName } });
  if (!player) player = await prisma.player.create({ data: { name: playerName, score: 0 } });

  const correct = p.answer.toLowerCase().trim() === String(answer).toLowerCase().trim();
  const existing = await prisma.submission.findUnique({ where: { playerId_puzzleId: { playerId: player.id, puzzleId: puzzle.id } } });
  if (existing?.correct) return NextResponse.json({ alreadySolved: true });

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
