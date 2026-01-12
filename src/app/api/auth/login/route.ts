import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { comparePassword, createAuthSuccessResponse, persistRefreshToken } from '../../../../lib/auth';
import { ActivityLogger } from '../../../../lib/activityLogger';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const { res, refreshToken } = createAuthSuccessResponse(user);
    // Persist refresh token for server-side validation/rotation
    await persistRefreshToken(String(user._id), refreshToken);
    
    // Log user login activity
    await ActivityLogger.logUserLogin(user._id, user.email);
    
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}