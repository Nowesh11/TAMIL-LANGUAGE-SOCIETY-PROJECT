import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import PasswordResetToken from '../../../../models/PasswordResetToken';
import { sendEmail } from '../../../../lib/emailService';

function generateVerificationCode() {
  // Generate a 6-digit verification code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(len = 32) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      // Return success to avoid leaking user existence
      return NextResponse.json({ success: true, message: 'If an account with this email exists, a verification code has been sent.' });
    }
    
    // Generate both a verification code and a secure token
    const verificationCode = generateVerificationCode();
    const token = generateToken(48);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for verification code
    
    // Store the verification code and token
    await PasswordResetToken.create({ 
      user: user._id, 
      token, 
      verificationCode,
      expiresAt 
    });
    
    // Send verification code via email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Code - Tamil Language Society',
        template: 'passwordForgot',
        data: {
          userName: user.name.en,
          token: verificationCode
        }
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'A verification code has been sent to your email address. Please check your inbox.' 
    });
  } catch (e: any) {
    console.error('Forgot password error:', e);
    return NextResponse.json({ error: e.message || 'Failed to process password reset request' }, { status: 500 });
  }
}
