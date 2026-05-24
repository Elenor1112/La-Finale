import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const puzzles = await prisma.photoPuzzle.findMany({ orderBy: { id: 'desc' } });
  return NextResponse.json(puzzles);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { title, imageUrl, question, answer, points, active } = await req.json();
  if (!title || !imageUrl || !question || !answer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const puzzle = await prisma.photoPuzzle.create({
    data: {
      title: String(title).trim(),
      imageUrl: String(imageUrl).trim(),
      question: String(question).trim(),
      answer: String(answer).trim(),
      points: Number(points) || 15,
      active: active !== false,
    },
  });
  return NextResponse.json(puzzle);
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, imageUrl, question, answer, points, active } = await req.json();
  if (!id || !title || !imageUrl || !question || !answer) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const puzzle = await prisma.photoPuzzle.update({
    where: { id: Number(id) },
    data: {
      title: String(title).trim(),
      imageUrl: String(imageUrl).trim(),
      question: String(question).trim(),
      answer: String(answer).trim(),
      points: Number(points) || 15,
      active: active !== false,
    },
  });
  return NextResponse.json(puzzle);
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing puzzle id' }, { status: 400 });

  await prisma.photoPuzzle.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
