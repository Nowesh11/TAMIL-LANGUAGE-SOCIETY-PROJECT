import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { withAuth } from '../../../../../lib/auth';
import User from '../../../../../models/User';
import ChatMessage from '../../../../../models/ChatMessage';

export const runtime = 'nodejs';

export const GET = withAuth({ role: 'admin' })(async function (req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    const limit = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '100', 10)));
    const other = await User.findById(userId).lean();
    if (!other) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const items = await (ChatMessage as any).getConversation(ctx.user._id, (other as any)._id, limit, 0);
    const messages = items.map((m: any) => ({
      _id: String(m._id),
      senderId: String(m.senderId?._id || m.senderId),
      recipientId: String(m.recipientId?._id || m.recipientId),
      message: m.message,
      messageType: m.messageType,
      isRead: !!m.isRead,
      isDelivered: !!m.isDelivered,
      timestamp: m.timestamp,
    })).reverse();
    return NextResponse.json({ success: true, messages });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch messages';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
});

export const POST = withAuth({ role: 'admin' })(async function (req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId || '');
    const text = String(body?.message || '').trim();
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    if (!text) return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    const other = await User.findById(userId);
    if (!other) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    // Ensure IDs are strings
    const senderId = String(ctx.user._id);
    const recipientId = String(other._id);

    const doc = await ChatMessage.create({
      senderId,
      recipientId,
      message: text,
      messageType: 'text',
      isRead: false,
      isDelivered: true,
      isDeleted: false,
      timestamp: new Date(),
      conversationId: [senderId, recipientId].sort().join('_')
    });
    return NextResponse.json({ success: true, message: {
      _id: String(doc._id),
      senderId: String(doc.senderId),
      recipientId: String(doc.recipientId),
      message: doc.message,
      messageType: doc.messageType,
      timestamp: doc.timestamp,
    } }, { status: 201 });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to send message';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
});

export const PATCH = withAuth({ role: 'admin' })(async function (req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId || '');
    if (!userId) return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    const other = await User.findById(userId).lean();
    if (!other) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    const unread = await ChatMessage.find({ recipientId: ctx.user._id, senderId: (other as any)._id, isRead: false });
    for (const m of unread) { await m.markAsRead(); }
    return NextResponse.json({ success: true, count: unread.length });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to mark read';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
});
