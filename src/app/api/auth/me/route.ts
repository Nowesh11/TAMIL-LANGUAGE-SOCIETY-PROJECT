import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getUserFromAccessToken(req);
  if (!user) {
    // Return 200 with null user to avoid console error logs
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
}