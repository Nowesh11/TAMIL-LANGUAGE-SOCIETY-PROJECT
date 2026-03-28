import { NextRequest, NextResponse } from 'next/server';
import { cleanupOrphanUploads } from '@/lib/cleanup';
import { getUserFromAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * API route to manually trigger the orphan uploads cleanup.
 * This can also be called by a cron job.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin access
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await cleanupOrphanUploads();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
