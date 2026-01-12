import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { getUserFromAccessToken } from '../../../../lib/auth';

// GET /api/user/notification-preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with notification preferences
    const userWithPrefs = await User.findById(user._id).select('notificationPreferences');
    
    const defaultPreferences = {
      email: {
        announcements: true,
        newContent: true,
        weekly: false
      },
      push: {
        breaking: true,
        newContent: false,
        updates: true
      },
      language: 'both' as const
    };

    const preferences = userWithPrefs?.notificationPreferences || defaultPreferences;

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/notification-preferences - Update user notification preferences
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, push, language } = body;

    // Validate the preferences structure
    if (!email || !push || !language) {
      return NextResponse.json({ 
        error: 'Invalid preferences format. Required: email, push, language' 
      }, { status: 400 });
    }

    // Validate email preferences
    if (typeof email !== 'object' || 
        typeof email.announcements !== 'boolean' ||
        typeof email.newContent !== 'boolean' ||
        typeof email.weekly !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid email preferences format' 
      }, { status: 400 });
    }

    // Validate push preferences
    if (typeof push !== 'object' || 
        typeof push.breaking !== 'boolean' ||
        typeof push.newContent !== 'boolean' ||
        typeof push.updates !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid push preferences format' 
      }, { status: 400 });
    }

    // Validate language preference
    if (!['en', 'ta', 'both'].includes(language)) {
      return NextResponse.json({ 
        error: 'Invalid language preference. Must be: en, ta, or both' 
      }, { status: 400 });
    }

    const preferences = {
      email,
      push,
      language
    };

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { notificationPreferences: preferences },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: updatedUser.notificationPreferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}