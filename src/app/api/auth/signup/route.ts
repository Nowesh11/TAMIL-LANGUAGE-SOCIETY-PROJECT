import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { hashPassword, createAuthSuccessResponse, persistRefreshToken } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password, name, role } = body;
    if (!email || !password || !name?.en || !name?.ta) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, name, role: role || 'user', purchases: [] });
    const { res, refreshToken } = createAuthSuccessResponse(user);
    // Persist refresh token server-side
    await persistRefreshToken(String(user._id), refreshToken);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 });
  }
}