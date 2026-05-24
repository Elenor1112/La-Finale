import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.triviaCategory.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  try {
    const category = await prisma.triviaCategory.create({
      data: { name: String(name).trim() },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, name } = await req.json();
  if (!id || !name) return NextResponse.json({ error: 'Missing id or name' }, { status: 400 });

  try {
    const category = await prisma.triviaCategory.update({
      where: { id: Number(id) },
      data: { name: String(name).trim() },
      include: { _count: { select: { questions: true } } },
    });
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: 'Unable to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });

  try {
    await prisma.triviaCategory.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete category' }, { status: 500 });
  }
}
