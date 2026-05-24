import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const puzzles = await prisma.photoPuzzle.findMany({
    where: { active: true },
    orderBy: { id: 'desc' },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      question: true,
      points: true,
      active: true,
    },
  });
  return NextResponse.json(puzzles);
}
