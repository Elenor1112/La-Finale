import { clearAdminAuthResponse } from '@/lib/auth';

export async function POST() {
  return clearAdminAuthResponse();
}
