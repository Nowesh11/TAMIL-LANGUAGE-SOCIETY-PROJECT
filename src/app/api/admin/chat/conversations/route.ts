import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { withAuth } from '../../../../../lib/auth';
import ChatMessage from '../../../../../models/ChatMessage';

export const runtime = 'nodejs';

export const GET = withAuth({ role: 'admin' })(async function (_req: NextRequest, ctx: { user: any }) {
  try {
    await dbConnect();
    const list = await (ChatMessage as any).getUserConversations(ctx.user._id);
    const data = (list || []).map((x: any) => ({
      otherUserId: String(x.otherUser?._id || ''),
      otherUserName: x.otherUser?.name?.en || x.otherUser?.name?.ta || '',
      unreadCount: x.unreadCount || 0,
      lastMessage: x.lastMessage?.message || '',
      lastMessageTime: x.lastMessage?.timestamp || null,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch conversations';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
});

