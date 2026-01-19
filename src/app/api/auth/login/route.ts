import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { comparePassword, createAuthSuccessResponse, persistRefreshToken } from '../../../../lib/auth';
import { ActivityLogger } from '../../../../lib/activityLogger';

export async function POST(req: NextRequest) {
  try {
    console.log('[Login API] Request received');
    await dbConnect();
    console.log('[Login API] DB Connected');
    
    const body = await req.json();
    const { email, password } = body;
    console.log('[Login API] Attempting login for:', email);

    if (!email || !password) {
      console.log('[Login API] Missing credentials');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[Login API] User not found');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
      console.log('[Login API] Password mismatch');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    console.log('[Login API] Login successful for:', email);
    const { res, refreshToken } = createAuthSuccessResponse(user);
    // Persist refresh token for server-side validation/rotation
    await persistRefreshToken(String(user._id), refreshToken);
    
    // Log user login activity
    await ActivityLogger.logUserLogin(user._id, user.email);
    
    return res;
  } catch (e: any) {
    console.error('[Login API] Error:', e);
    return NextResponse.json({ error: e.message || 'Login failed' }, { status: 500 });
  }
}