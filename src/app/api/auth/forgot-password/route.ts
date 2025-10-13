import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import PasswordResetToken from '../../../../models/PasswordResetToken';

function generateToken(len = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: true }); // avoid leaking existence
    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await PasswordResetToken.create({ user: user._id, token, expiresAt });
    // TODO: send email with reset link e.g. `${process.env.APP_URL}/reset-password?token=${token}`
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to issue reset token' }, { status: 500 });
  }
}