import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import PasswordResetToken from '../../../../models/PasswordResetToken';
import { hashPassword } from '../../../../lib/auth';
import { NotificationService } from '../../../../lib/notificationService';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email, verificationCode, newPassword } = body;
    
    if (!email || !verificationCode || !newPassword) {
      return NextResponse.json({ 
        error: 'Email, verification code, and new password are required' 
      }, { status: 400 });
    }
    
    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ 
        error: 'Invalid verification code or email' 
      }, { status: 400 });
    }
    
    // Find the reset token with the verification code
    const resetToken = await PasswordResetToken.findOne({
      user: user._id,
      verificationCode,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetToken) {
      return NextResponse.json({ 
        error: 'Invalid or expired verification code' 
      }, { status: 400 });
    }
    
    // Hash the new password
    const passwordHash = await hashPassword(newPassword);
    
    // Update the user's password
    await User.findByIdAndUpdate(user._id, { passwordHash });
    
    // Mark the token as used
    await PasswordResetToken.findByIdAndUpdate(resetToken._id, { used: true });
    
    // Create a success notification
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Password Reset Successful',
          ta: 'கடவுச்சொல் மீட்டமைப்பு வெற்றிகரமானது'
        },
        message: {
          en: 'Your password has been successfully reset. If this wasn\'t you, please contact support immediately.',
          ta: 'உங்கள் கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது. இது நீங்கள் அல்ல என்றால், உடனடியாக ஆதரவைத் தொடர்பு கொள்ளுங்கள்.'
        },
        type: 'success',
        priority: 'high',
        targetAudience: 'specific',
        userRef: user._id,
        actionUrl: '/login',
        actionText: {
          en: 'Login Now',
          ta: 'இப்போது உள்நுழையுங்கள்'
        },
        sendEmail: true,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to create password reset notification:', notificationError);
      // Don't fail the password reset if notification creation fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });
  } catch (e: any) {
    console.error('Password reset verification error:', e);
    return NextResponse.json({ 
      error: e.message || 'Failed to reset password' 
    }, { status: 500 });
  }
}