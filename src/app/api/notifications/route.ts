import User from '../../../models/User';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Notification from '../../../models/Notification';
import { getUserFromAccessToken } from '../../../lib/auth';
import { FileHandler } from '../../../lib/fileHandler';
import { NotificationService } from '../../../lib/notificationService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query: any = {};

    if (user && user.role === 'admin') {
        // ADMIN VIEW: See EVERYTHING
        // No restrictions on startAt (so they see scheduled ones)
        // No restrictions on userRef (so they see notifications for others)
        
        // However, if they explicitly ask for "my notifications" via a param, we could support that, 
        // but for the admin dashboard, we want the global view.
    } else {
        // REGULAR USER VIEW
        // 1. Must be published (startAt <= now)
        // 2. Must not be expired (endAt > now or undefined)
        query.startAt = { $lte: new Date() };
        query.$or = [
            { endAt: { $exists: false } },
            { endAt: { $gt: new Date() } }
        ];

        if (user) {
            // Authenticated user
            query.$and = [
                {
                    $or: [
                        { userRef: user._id },
                        { userRef: null, targetAudience: { $in: ['all', 'members'] } }
                    ]
                }
            ];
        } else {
            // Anonymous user
            query.userRef = null;
            query.targetAudience = { $in: ['all'] };
        }
    }

    // Add filters
    if (type) {
      query.type = type;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (unreadOnly && user) {
      // Only apply unread filter for authenticated users
      query.isRead = false;
    }

    // Default sort: Newest first (created/start date)
    // If user explicitly asks for priority sort, we can adjust, but for admin log, chronological is better.
    const sort: any = { createdAt: -1 }; 

    // Handle pagination carefully - check if user wants ALL notifications for stats
    // If limit is unusually high (>500), we might need optimization, but 100 is fine.
    
    const notifications = await Notification.find(query)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Notification.countDocuments(query);
    
    // Only calculate unread count for authenticated users
    let unreadCount = 0;
    if (user) {
      const unreadQuery = {
        ...query,
        isRead: false
      };
      unreadCount = await Notification.countDocuments(unreadQuery);
    }

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create notification (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      message,
      type,
      priority = 'medium',
      targetAudience = 'all',
      userRef,
      actionUrl,
      actionText,
      imageUrl,
      tags = [],
      sendEmail = false,
      startAt,
      endAt
    } = body;

    // Validate required fields
    if (!title || !message || !type) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, message, type' 
      }, { status: 400 });
    }

    // Validate bilingual text format
    // Ensure title is an object and has at least one language property with content
    if (typeof title !== 'object' || (!title.en && !title.ta)) {
      return NextResponse.json({ 
        error: 'Title must be bilingual object with en and ta properties' 
      }, { status: 400 });
    }

    if (typeof message !== 'object' || (!message.en && !message.ta)) {
      return NextResponse.json({ 
        error: 'Message must be bilingual object with en and ta properties' 
      }, { status: 400 });
    }

    // If specific target audience, ensure userRef is provided
    if (targetAudience === 'specific' && (!body.recipients || !Array.isArray(body.recipients) || body.recipients.length === 0)) {
        return NextResponse.json({
            error: 'Recipients list is required for specific audience'
        }, { status: 400 });
    }

    // Handle "all" target audience - send to all users
    if (targetAudience === 'all') {
      // Find all users who should receive this
      const allUsers = await User.find({}, '_id').lean();
      
      const notifications = [];
      // Use Promise.all for parallel creation to be faster, but batching might be better for huge numbers.
      // For now, parallel is fine for moderate user counts.
      const promises = allUsers.map(async (recipient) => {
        const notificationData = {
          title,
          message,
          type,
          priority,
          targetAudience: 'all' as const,
          userRef: recipient._id, // Assign to each user individually
          actionUrl,
          actionText,
          imageUrl,
          tags,
          sendEmail,
          createdBy: user._id,
          startAt: startAt ? new Date(startAt) : new Date(),
          endAt: endAt ? new Date(endAt) : undefined,
          isRead: false,
          readAt: null
        };
        
        return NotificationService.createNotification({
          ...(notificationData as any),
          createdBy: user._id
        });
      });

      const results = await Promise.all(promises);
      
      return NextResponse.json({ 
        success: true, 
        notifications: results,
        message: `Notification sent to all ${allUsers.length} users`
      }, { status: 201 });
    }

    // Handle multiple recipients if targeted
    if (targetAudience === 'specific' && body.recipients && body.recipients.length > 0) {
        const promises = body.recipients.map(async (recipientId: string) => {
             const notificationData = {
                title,
                message,
                type,
                priority,
                targetAudience: 'specific' as const,
                userRef: recipientId,       // Assign strictly to this user
                actionUrl,
                actionText,
                imageUrl,
                tags,
                sendEmail,
                createdBy: user._id,
                startAt: startAt ? new Date(startAt) : new Date(),
                endAt: endAt ? new Date(endAt) : undefined,
                isRead: false,
                readAt: null
            };
            
            // Create notification for each user
            return NotificationService.createNotification({
                ...(notificationData as any),
                createdBy: user._id
            });
        });
        
        const notifications = await Promise.all(promises);
        
        return NextResponse.json({ 
            success: true, 
            notifications 
        }, { status: 201 });
    }

    const notificationData = {
      title,
      message,
      type,
      priority,
      targetAudience: targetAudience as 'all' | 'members' | 'admins' | 'specific',
      userRef: userRef ? new mongoose.Types.ObjectId(userRef) : undefined,        // Can be null if broadcasting to all
      actionUrl,
      actionText,
      imageUrl,
      tags,
      sendEmail,
      createdBy: user._id,
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : undefined,
      isRead: false,
      readAt: null
    };

    // Create notification using service (handles email sending)
    const notification = await NotificationService.createNotification({
      ...(notificationData as any),
      createdBy: user._id
    });

    return NextResponse.json({ 
      success: true, 
      notification 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notifications - Bulk mark as read
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === 'markAllRead') {
      // Mark all notifications as read for the user
      await Notification.updateMany(
        {
          $or: [
            { userRef: user._id },
            { userRef: null, targetAudience: { $in: ['all', 'members'] } }
          ],
          isRead: false
        },
        { isRead: true, readAt: new Date() }
      );

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'markRead' && notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds },
          $or: [
            { userRef: user._id },
            { userRef: null, targetAudience: { $in: ['all', 'members'] } }
          ]
        },
        { isRead: true, readAt: new Date() }
      );

      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }

    return NextResponse.json({ error: 'Invalid action or parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notification (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await Notification.findByIdAndDelete(id);

    // Clean up notification's upload directory
    try {
      const notificationUploadDir = `uploads/notifications/${id}`;
      FileHandler.deleteDirectory(notificationUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup notification directory:', cleanupError);
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}