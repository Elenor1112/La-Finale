import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const questions = await prisma.triviaQuestion.findMany({
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
      include: { category: true },
    });
    return NextResponse.json(questions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trivia questions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { categoryId, question, optionA, optionB, optionC, optionD, correct, points, order } = await req.json();

    if (!categoryId || !question || !optionA || !optionB || !optionC || !optionD || !correct) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newQuestion = await prisma.triviaQuestion.create({
      data: {
        categoryId: Number(categoryId),
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correct: String(correct).toUpperCase().trim(),
        points: Number(points) || 10,
        order: Number(order) || 0,
      },
      include: { category: true },
    });

    return NextResponse.json(newQuestion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trivia question' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, categoryId, question, optionA, optionB, optionC, optionD, correct, points, order } = await req.json();

    if (!id || !categoryId || !question || !optionA || !optionB || !optionC || !optionD || !correct) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedQuestion = await prisma.triviaQuestion.update({
      where: { id: Number(id) },
      data: {
        categoryId: Number(categoryId),
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correct: String(correct).toUpperCase().trim(),
        points: Number(points) || 10,
        order: Number(order) || 0,
      },
      include: { category: true },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trivia question' }, { status: 500 });
  }
}


export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing trivia question id' }, { status: 400 });
    }

    await prisma.triviaQuestion.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete trivia question' }, { status: 500 });
  }
}
