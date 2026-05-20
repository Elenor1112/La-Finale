import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('image');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No image uploaded' }, { status: 400 });
  }

  const extension = path.extname(file.name) || '.png';
  const filename = `${randomUUID()}${extension}`;
  const publicDir = path.join(process.cwd(), 'public', 'puzzles');
  fs.mkdirSync(publicDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filepath = path.join(publicDir, filename);
  fs.writeFileSync(filepath, buffer);

  return NextResponse.json({ imageUrl: `/puzzles/${filename}` });
}
