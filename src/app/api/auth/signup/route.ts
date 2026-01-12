import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { hashPassword, createAuthSuccessResponse, persistRefreshToken } from '../../../../lib/auth';
import { NotificationService } from '../../../../lib/notificationService';
import { ActivityLogger } from '../../../../lib/activityLogger';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, password, name, role } = body;
    if (!email || !password || !name?.en || !name?.ta) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await User.create({ email, passwordHash, name, role: role || 'user', purchases: [] });
    
    // Create welcome notification for new user
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Welcome to Tamil Language Society!',
          ta: 'தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்!'
        },
        message: {
          en: `Welcome ${name.en}! Your account has been successfully created. Explore our digital library and join our community.`,
          ta: `வணக்கம் ${name.ta}! உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது. எங்கள் டிஜிட்டல் நூலகத்தை ஆராய்ந்து எங்கள் சமூகத்தில் சேருங்கள்.`
        },
        type: 'success',
        priority: 'medium',
        targetAudience: 'specific',
        userRef: user._id,
        actionUrl: '/dashboard',
        actionText: {
          en: 'Explore Dashboard',
          ta: 'டாஷ்போர்டை ஆராயுங்கள்'
        },
        sendEmail: true,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to create welcome notification:', notificationError);
      // Don't fail the signup if notification creation fails
    }
    
    const { res, refreshToken } = createAuthSuccessResponse(user);
    // Persist refresh token server-side
    await persistRefreshToken(String(user._id), refreshToken);
    
    // Log user registration activity
    await ActivityLogger.logUserRegistration(user._id, user.email);
    
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 });
  }
}