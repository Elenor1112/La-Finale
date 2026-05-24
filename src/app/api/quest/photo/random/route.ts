import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const puzzles = await prisma.photoPuzzle.findMany({ where: { active: true } });
  if (!puzzles || puzzles.length === 0) return NextResponse.json({ error: 'No puzzles' }, { status: 404 });
  const p = puzzles[Math.floor(Math.random() * puzzles.length)];
  return NextResponse.json({ id: p.id, title: p.title, imageUrl: p.imageUrl, question: p.question, points: p.points });
}
