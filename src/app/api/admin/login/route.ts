// src/app/api/admin/login/route.ts
import { NextRequest } from 'next/server';
import { checkAdminPassword, createAdminAuthResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (checkAdminPassword(password)) {
    return createAdminAuthResponse();
  }
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
