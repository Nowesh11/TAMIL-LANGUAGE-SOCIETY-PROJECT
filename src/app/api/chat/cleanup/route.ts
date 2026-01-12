import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import ChatMessage from '../../../../models/ChatMessage';

export const runtime = 'nodejs';

// This endpoint should be called by a cron job service (e.g., Vercel Cron, GitHub Actions)
// or manually by an admin. For security, we should check for a secret key.
export const POST = async function (req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret';
    
    // Simple Bearer token check
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Calculate date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const result = await ChatMessage.deleteMany({
      timestamp: { $lt: oneWeekAgo }
    });
    
    console.log(`Deleted ${result.deletedCount} chat messages older than 7 days.`);
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Cleaned up messages older than ${oneWeekAgo.toISOString()}`
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('POST /api/chat/cleanup error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
