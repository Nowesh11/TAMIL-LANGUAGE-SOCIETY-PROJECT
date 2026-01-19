import jwt, { type Secret, type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from './mongodb';
import User, { IUser } from '../models/User';
import RefreshToken from '../models/RefreshToken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev_access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
// Default 2 days if env var missing
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || '2d';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';

function parseExpires(v: string): number {
  if (!v) return 86400; // Default 1 day if empty
  const s = String(v).trim().toLowerCase();
  const num = parseInt(s, 10);
  if (!Number.isFinite(num)) return 86400; // Default 1 day if NaN (was 15m)
  if (s.endsWith('ms')) return Math.floor(num / 1000);
  if (s.endsWith('s')) return num;
  if (s.endsWith('m')) return num * 60;
  if (s.endsWith('h')) return num * 3600;
  if (s.endsWith('d')) return num * 86400;
  return num; // assume seconds
}

export interface JwtPayload {
  sub: string; // user id
  role: 'admin' | 'user';
}

export function signAccessToken(user: IUser) {
  const payload: JwtPayload = { sub: String(user._id), role: user.role };
  const secret: Secret = ACCESS_TOKEN_SECRET as Secret;
  const options: SignOptions = { expiresIn: parseExpires(ACCESS_TOKEN_EXPIRES) };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(user: IUser) {
  const payload: JwtPayload = { sub: String(user._id), role: user.role };
  const secret: Secret = REFRESH_TOKEN_SECRET as Secret;
  const options: SignOptions = { expiresIn: parseExpires(REFRESH_TOKEN_EXPIRES) };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token?: string): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET as Secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token?: string): JwtPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET as Secret) as JwtPayload;
  } catch {
    return null;
  }
}

export function setRefreshCookie(res: NextResponse, token: string) {
  res.cookies.set('refresh_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Max-Age is set by JWT expiration, but cookie needs a maxAge as well
    // 7 days default ~ 7 * 24 * 60 * 60 seconds
    maxAge: 7 * 24 * 60 * 60
  });
}

export function clearRefreshCookie(res: NextResponse) {
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getUserFromAccessToken(request: NextRequest): Promise<IUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload || !payload.sub) {
      return null;
    }

    await dbConnect();
    const user = await User.findById(payload.sub);
    
    return user;
  } catch (error) {
    console.error('Error in getUserFromAccessToken:', error);
    return null;
  }
}

export async function persistRefreshToken(userId: string, token: string) {
  await dbConnect();
  // Optional rotation: invalidate previous tokens
  // await RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true });
  const decoded = verifyRefreshToken(token);
  const expiresAt = decoded ? new Date((jwt.decode(token) as { exp: number }).exp * 1000) : undefined;
  await RefreshToken.create({ user: userId, token, expiresAt });
}

export async function revokeRefreshToken(token: string) {
  await dbConnect();
  await RefreshToken.updateOne({ token }, { revoked: true });
}

export async function findValidRefreshToken(token: string) {
  await dbConnect();
  const doc = await RefreshToken.findOne({ token, revoked: false });
  if (!doc) return null;
  if (doc.expiresAt && doc.expiresAt < new Date()) return null;
  return doc;
}

export function withAuth(options?: { role?: 'admin' | 'user' }) {
  return (handler: (req: NextRequest, ctx: { user: IUser }) => Promise<NextResponse>) => {
  return async function (req: NextRequest): Promise<NextResponse> {
      await dbConnect();
      const user = await getUserFromAccessToken(req);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (options?.role && user.role !== options.role) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return handler(req, { user });
    };
  };
}

export function createAuthSuccessResponse(user: IUser) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const res = NextResponse.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    accessToken
  });
  setRefreshCookie(res, refreshToken);
  return { res, refreshToken };
}
