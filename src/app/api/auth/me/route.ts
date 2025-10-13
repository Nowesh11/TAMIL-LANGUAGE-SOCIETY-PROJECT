import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';

export async function GET(req: NextRequest) {
  await dbConnect();
  const user = await getUserFromAccessToken(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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