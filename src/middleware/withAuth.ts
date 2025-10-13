import { NextRequest, NextResponse } from 'next/server';
import { getUserFromAccessToken } from '../lib/auth';
import dbConnect from '../lib/mongodb';
import { Types } from 'mongoose';

interface BilingualText {
  en: string;
  ta: string;
}

interface User {
  _id: Types.ObjectId;
  email: string;
  role: 'admin' | 'user';
  name: BilingualText;
}

export function withAuthApi(handler: (req: NextRequest, ctx: { user: User }) => Promise<NextResponse>, role?: 'admin' | 'user') {
  return async (req: NextRequest) => {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (role && user.role !== role) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return handler(req, { user });
  };
}

export function withAuthPage<T>(getServerSideProps: (ctx: Record<string, unknown>, user: User) => Promise<{ props: T } | { redirect: Record<string, unknown> }>, role?: 'admin' | 'user') {
  return async (ctx: Record<string, unknown>) => {
    await dbConnect();
    const req = ctx.req as NextRequest;
    // In Pages Router, you’d parse cookie/header; here provide example logic
    // This helper is illustrative; in App Router use server components and headers
    const authHeader = req.headers.get('authorization');
    const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    // TODO: use bearer token to fetch user instead of leaving user undefined
    // Reuse lib/auth verify function indirectly via API call or direct verification in a real setup
    const user = undefined;
    if (!user) {
      return { redirect: { destination: '/login', permanent: false } };
    }
    if (role && user && 'role' in user && (user as User).role !== role) {
      return { redirect: { destination: '/', permanent: false } };
    }
    return getServerSideProps(ctx, user);
  };
}