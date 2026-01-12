import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import PasswordResetToken from '../../../../models/PasswordResetToken';
import { hashPassword } from '../../../../lib/auth';
import { NotificationService } from '../../../../lib/notificationService';
import { ActivityLogger } from '../../../../lib/activityLogger';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { token, password } = body;
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }
    const prt = await PasswordResetToken.findOne({ token, used: false });
    if (!prt || prt.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    const user = await User.findById(prt.user);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    user.passwordHash = await hashPassword(password);
    await user.save();
    prt.used = true;
    await prt.save();
    
    // Log password reset activity
    await ActivityLogger.log({
      userId: user._id,
      userType: 'user',
      entityType: 'user',
      entityId: user._id,
      action: 'updated',
      description: `Password reset for user ${user.email}`
    });
    
    // Create password reset notification
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Password Successfully Reset',
          ta: 'கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது'
        },
        message: {
          en: 'Your password has been successfully reset. If you did not request this change, please contact support immediately.',
          ta: 'உங்கள் கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது. இந்த மாற்றத்தை நீங்கள் கோரவில்லை என்றால், உடனடியாக ஆதரவைத் தொடர்பு கொள்ளவும்.'
        },
        type: 'success',
        priority: 'high',
        targetAudience: 'specific',
        userRef: user._id,
        sendEmail: true,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to create password reset notification:', notificationError);
      // Don't fail the password reset if notification creation fails
    }
    
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to reset password' }, { status: 500 });
  }
}