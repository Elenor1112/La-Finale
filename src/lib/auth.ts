// src/lib/auth.ts
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE_NAME = 'hq_admin_auth';
const ADMIN_COOKIE_VALUE = '1';

export function checkAdminPassword(password: string): boolean {
  return password === (process.env.ADMIN_PASSWORD || 'hertsquest2024');
}

export function createAdminAuthResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, ADMIN_COOKIE_VALUE, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  });
  return response;
}

export function clearAdminAuthResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  });
  return response;
}

export function isAdminRequest(req: NextRequest) {
  return req.cookies.get(ADMIN_COOKIE_NAME)?.value === ADMIN_COOKIE_VALUE;
}
