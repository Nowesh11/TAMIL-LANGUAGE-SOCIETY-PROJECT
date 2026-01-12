import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import { getUserFromAccessToken } from '../../../../lib/auth';
import ActivityLog from '../../../../models/ActivityLog';

export const runtime = 'nodejs';

// GET - Fetch recent activity logs
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
    const type = searchParams.get('type'); // 'admin' | 'user' | null for all
    const action = searchParams.get('action'); // specific action filter

    // Build filter
    const filter: any = {};
    if (type) filter.userType = type;
    if (action) filter.action = action;

    // Fetch activity logs
    const activities = await ActivityLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Format response
    const formattedActivities = activities.map((activity: any) => ({
      id: activity._id.toString(),
      type: activity.entityType,
      action: activity.action,
      title: activity.description,
      user: activity.userId?.name?.en || activity.userId?.email || 'Unknown User',
      userType: activity.userType,
      timestamp: activity.createdAt,
      metadata: activity.metadata || {}
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities
    });

  } catch (error: any) {
    console.error('Activity API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch activity logs' 
    }, { status: 500 });
  }
}

// POST - Create new activity log
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { entityType, entityId, action, description, metadata } = body;

    if (!entityType || !action || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const activityLog = new ActivityLog({
      userId: user._id,
      userType: user.role,
      entityType,
      entityId,
      action,
      description,
      metadata: metadata || {}
    });

    await activityLog.save();

    return NextResponse.json({
      success: true,
      activity: {
        id: activityLog._id.toString(),
        type: activityLog.entityType,
        action: activityLog.action,
        title: activityLog.description,
        user: user.name?.en || user.email,
        userType: user.role,
        timestamp: activityLog.createdAt,
        metadata: activityLog.metadata
      }
    });

  } catch (error: any) {
    console.error('Activity Log Creation Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create activity log' 
    }, { status: 500 });
  }
}