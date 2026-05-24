import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Random trivia has been replaced with ordered category quizzes.' },
    { status: 410 }
  );
}
