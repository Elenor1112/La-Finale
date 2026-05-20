// src/app/quest/[code]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QuestClient from './QuestClient';

export const dynamic = 'force-dynamic';

export default async function QuestPage({ params }: { params: { code: string } }) {
  const puzzle = await prisma.puzzle.findUnique({
    where: { code: params.code.toUpperCase() },
  });

  if (!puzzle) notFound();

  const typedPuzzle = {
    ...puzzle,
    type: puzzle.type === 'trivia' ? 'trivia' : 'puzzle',
    choices: puzzle.choices ? JSON.parse(puzzle.choices) : undefined,
    imageUrl: puzzle.imageUrl ?? undefined,
  } as const;

  return <QuestClient puzzle={typedPuzzle} />;
}
