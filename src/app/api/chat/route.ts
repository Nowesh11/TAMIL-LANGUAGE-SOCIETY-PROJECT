import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { withAuth } from '../../../lib/auth';
import User from '../../../models/User';
import ChatMessage from '../../../models/ChatMessage';

export const runtime = 'nodejs';

async function findAdmin() {
  await dbConnect();
  const admin = await User.findOne({ role: 'admin' }).lean();
  return admin;
}

export const GET = withAuth()(async function (req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const admin = await findAdmin();
    if (!admin) return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    const { searchParams } = new URL(req.url);
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10));
    const items = await ChatMessage.getConversation(ctx.user._id, admin._id, limit, skip);
    const messages = items.map((m: any) => ({
      _id: String(m._id),
      senderId: String(m.senderId),
      recipientId: String(m.recipientId),
      message: m.message,
      messageType: m.messageType,
      isRead: !!m.isRead,
      isDelivered: !!m.isDelivered,
      isDeleted: !!m.isDeleted,
      replyTo: m.replyTo ? String(m.replyTo) : undefined,
      timestamp: m.timestamp,
    }));
    return NextResponse.json({ success: true, admin: { id: String(admin._id), name: admin.name }, messages });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('GET /api/chat error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth()(async function (req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const admin = await findAdmin();
    if (!admin) return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const text = String(body?.message || '').trim();
    const messageType = (body?.messageType || 'text') as 'text' | 'image' | 'file' | 'audio' | 'video';
    if (!text || messageType !== 'text') {
      if (messageType !== 'text') return NextResponse.json({ success: false, error: 'Only text messages supported currently' }, { status: 400 });
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    const doc = await ChatMessage.create({
      senderId: ctx.user._id,
      recipientId: admin._id,
      message: text,
      messageType: 'text',
      isRead: false,
      isDelivered: true,
      isDeleted: false,
      timestamp: new Date(),
    });
    return NextResponse.json({ success: true, message: {
      _id: String(doc._id), senderId: String(doc.senderId), recipientId: String(doc.recipientId), message: doc.message, messageType: doc.messageType, timestamp: doc.timestamp,
    } }, { status: 201 });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('POST /api/chat error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const PATCH = withAuth()(async function (_req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const admin = await findAdmin();
    if (!admin) return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    const unread = await ChatMessage.find({ recipientId: ctx.user._id, senderId: admin._id, isRead: false });
    for (const m of unread) { await m.markAsRead(); }
    return NextResponse.json({ success: true, count: unread.length });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('PATCH /api/chat error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});