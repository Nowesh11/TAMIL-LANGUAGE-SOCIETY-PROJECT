import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, setRefreshCookie, findValidRefreshToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const cookie = req.cookies.get('refresh_token');
    const token = cookie?.value;
    if (!token) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }
    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    }
    const valid = await findValidRefreshToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Refresh token not found or expired' }, { status: 401 });
    }
    const user = await User.findById(decoded.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const accessToken = signAccessToken(user);
    const res = NextResponse.json({ accessToken });
    // Optionally rotate refresh token each refresh
    // const newRefresh = signRefreshToken(user);
    // setRefreshCookie(res, newRefresh);
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Refresh failed' }, { status: 500 });
  }
}