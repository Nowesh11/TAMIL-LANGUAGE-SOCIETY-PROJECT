import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { withAuth } from '../../../../lib/auth';
import User from '../../../../models/User';

export const runtime = 'nodejs';

export const GET = withAuth({ role: 'admin' })(async function (req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '100', 10)));
    const q = (searchParams.get('search') || '').trim().toLowerCase();
    const filter: Record<string, unknown> = {}; // Removed { role: 'user' } to fetch ALL users
    if (q) {
      filter.$or = [
        { 'name.en': { $regex: q, $options: 'i' } },
        { 'name.ta': { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    // Fetch all users regardless of role
    const users = await User.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    const data = users.map((u) => ({
      id: String(u._id),
      name: u.name?.en || u.name?.ta || u.name || 'Unknown', // Handle different name structures
      email: u.email,
      role: u.role, // Include role for UI differentiation
      avatar: '',
      isOnline: false,
      lastSeen: (u.updatedAt || u.createdAt)?.toISOString?.() || ''
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch users';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
});

