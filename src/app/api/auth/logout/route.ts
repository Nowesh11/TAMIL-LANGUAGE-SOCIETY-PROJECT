import { NextRequest, NextResponse } from 'next/server';
import { clearRefreshCookie, revokeRefreshToken, getUserFromAccessToken } from '../../../../lib/auth';
import { ActivityLogger } from '../../../../lib/activityLogger';
import dbConnect from '../../../../lib/mongodb';

export async function POST(req: NextRequest) {
  await dbConnect();
  
  // Get user info before logout for activity logging
  const user = await getUserFromAccessToken(req);
  
  const cookie = req.cookies.get('refresh_token');
  const token = cookie?.value;
  if (token) {
    await revokeRefreshToken(token);
  }
  
  // Log user logout activity if user was authenticated
  if (user) {
    await ActivityLogger.logUserLogout(user._id, user.email);
  }
  
  const res = NextResponse.json({ success: true });
  clearRefreshCookie(res);
  return res;
}