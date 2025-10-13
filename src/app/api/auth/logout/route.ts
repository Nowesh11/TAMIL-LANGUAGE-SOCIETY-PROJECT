import { NextRequest, NextResponse } from 'next/server';
import { clearRefreshCookie, revokeRefreshToken } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('refresh_token');
  const token = cookie?.value;
  if (token) {
    await revokeRefreshToken(token);
  }
  const res = NextResponse.json({ success: true });
  clearRefreshCookie(res);
  return res;
}