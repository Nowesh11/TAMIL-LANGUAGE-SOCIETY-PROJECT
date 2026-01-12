import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Notification from '../../../../../models/Notification';
import { getUserFromAccessToken } from '../../../../../lib/auth';

// PUT /api/notifications/[id]/read - Mark specific notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id,
        $or: [
          { userRef: user._id },
          { userRef: null, targetAudience: { $in: ['all', 'members'] } }
        ]
      },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST method for backward compatibility
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params });
}