// src/app/api/admin/puzzles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

function normalizeChoices(choices: unknown) {
  if (Array.isArray(choices)) return JSON.stringify(choices.filter(Boolean));
  if (typeof choices === 'string' && choices.trim()) {
    try {
      const parsed = JSON.parse(choices);
      if (Array.isArray(parsed)) return JSON.stringify(parsed.filter(Boolean));
    } catch {
      return JSON.stringify(choices.split(',').map((item) => item.trim()).filter(Boolean));
    }
  }
  return JSON.stringify([]);
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const puzzles = await prisma.puzzle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { submissions: { where: { correct: true } } } } },
  });

  return NextResponse.json(puzzles);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code, title, question, answer, points, hint, category, difficulty, type, choices, explanation, imageUrl } = await req.json();

  if (!code || !title || !question || !answer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const puzzle = await prisma.puzzle.create({
      data: {
        code: code.toUpperCase(),
        title,
        question,
        answer,
        points: parseInt(points as string) || 10,
        hint: hint || null,
        category: category || null,
        difficulty: difficulty || 'medium',
        type: type || 'puzzle',
        choices: type === 'trivia' ? normalizeChoices(choices) : null,
        explanation: type === 'trivia' ? explanation || null : null,
        imageUrl: imageUrl || null,
      },
    });
    return NextResponse.json(puzzle);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create puzzle' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, code, title, question, answer, points, hint, category, difficulty, type, choices, explanation, imageUrl } = await req.json();

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const puzzle = await prisma.puzzle.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        title,
        question,
        answer,
        points: parseInt(points as string) || 10,
        hint: hint || null,
        category: category || null,
        difficulty: difficulty || 'medium',
        type: type || 'puzzle',
        choices: type === 'trivia' ? normalizeChoices(choices) : null,
        explanation: type === 'trivia' ? explanation || null : null,
        imageUrl: imageUrl || null,
      },
    });
    return NextResponse.json(puzzle);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update puzzle' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await prisma.submission.deleteMany({ where: { puzzleId: id } });
  await prisma.puzzle.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
