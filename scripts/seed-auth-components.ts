import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Component from '../src/models/Component';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function ensureAdmin() {
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    admin = new User({
      email: 'admin@tamilsociety.org',
      passwordHash: hashedPassword,
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      role: 'admin',
      isActive: true
    });
    await admin.save();
    console.log('✅ Created admin user');
  }
  return admin;
}

async function upsertComponent(filter: any, doc: any) {
  const existing = await Component.findOne(filter);
  if (existing) {
    Object.assign(existing, doc);
    await existing.save();
    console.log(`✅ Updated ${doc.type} component for ${doc.page} page`);
  } else {
    await Component.create(doc);
    console.log(`✅ Created ${doc.type} component for ${doc.page} page`);
  }
}

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  // Login Page Components
  console.log('🔐 Seeding login page components...');

  // Login page SEO component
  const loginSeoDoc = {
    type: 'seo',
    page: 'login',
    content: {
      title: { 
        en: 'Login - Tamil Language Society', 
        ta: 'உள்நுழைவு - தமிழ் மொழி சங்கம்' 
      },
      description: { 
        en: 'Sign in to your Tamil Language Society account to access exclusive content and features.',
        ta: 'பிரத்யேக உள்ளடக்கம் மற்றும் அம்சங்களை அணுக உங்கள் தமிழ் மொழி சங்க கணக்கில் உள்நுழையுங்கள்.'
      },
      keywords: ['login', 'signin', 'tamil', 'language', 'society', 'உள்நுழைவு', 'தமிழ்']
    },
    order: 1,
    isActive: true,
    createdBy: admin._id,
    slug: 'login-seo'
  };
  await upsertComponent({ type: 'seo', page: 'login' }, loginSeoDoc);

  // Login page text content component
  const loginTextDoc = {
    type: 'text',
    page: 'login',
    content: {
      title: { 
        en: 'Welcome Back', 
        ta: 'மீண்டும் வரவேற்கிறோம்' 
      },
      content: {
        en: 'Sign in to your account to access your personalized dashboard, track your progress, and connect with the Tamil language community.',
        ta: 'உங்கள் தனிப்பயனாக்கப்பட்ட டாஷ்போர்டை அணுக, உங்கள் முன்னேற்றத்தைக் கண்காணிக்க மற்றும் தமிழ் மொழி சமூகத்துடன் இணைக்க உங்கள் கணக்கில் உள்நுழையுங்கள்.'
      },
      format: 'plain',
      alignment: 'center'
    },
    order: 2,
    isActive: true,
    createdBy: admin._id,
    slug: 'login-welcome-text'
  };
  await upsertComponent({ type: 'text', page: 'login' }, loginTextDoc);

  // Login form labels and messages component
  const loginFormDoc = {
    type: 'text',
    page: 'login',
    content: {
      title: { 
        en: 'Login Form Content', 
        ta: 'உள்நுழைவு படிவ உள்ளடக்கம்' 
      },
      content: {
        en: JSON.stringify({
          subheading: 'Sign in to your account',
          email: 'Email Address',
          password: 'Password',
          loginButton: 'Sign In',
          forgotPassword: 'Forgot your password?',
          noAccount: "Don't have an account?",
          signUp: 'Sign up here',
          forgotPasswordTitle: 'Reset Your Password',
          forgotPasswordSubtitle: 'Enter your email to receive a verification code',
          sendCode: 'Send Verification Code',
          verificationCode: 'Verification Code',
          newPassword: 'New Password',
          confirmPassword: 'Confirm Password',
          resetPassword: 'Reset Password',
          backToLogin: 'Back to Login',
          enterCode: 'Enter the 6-digit code sent to your email'
        }),
        ta: JSON.stringify({
          subheading: 'உங்கள் கணக்கில் உள்நுழையுங்கள்',
          email: 'மின்னஞ்சல் முகவரி',
          password: 'கடவுச்சொல்',
          loginButton: 'உள்நுழையுங்கள்',
          forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
          noAccount: 'கணக்கு இல்லையா?',
          signUp: 'இங்கே பதிவு செய்யுங்கள்',
          forgotPasswordTitle: 'உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்',
          forgotPasswordSubtitle: 'சரிபார்ப்பு குறியீட்டைப் பெற உங்கள் மின்னஞ்சலை உள்ளிடவும்',
          sendCode: 'சரிபார்ப்பு குறியீட்டை அனுப்பவும்',
          verificationCode: 'சரிபார்ப்பு குறியீடு',
          newPassword: 'புதிய கடவுச்சொல்',
          confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
          resetPassword: 'கடவுச்சொல்லை மீட்டமைக்கவும்',
          backToLogin: 'உள்நுழைவுக்குத் திரும்பவும்',
          enterCode: 'உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்ட 6-இலக்க குறியீட்டை உள்ளிடவும்'
        })
      },
      format: 'plain'
    },
    order: 3,
    isActive: true,
    createdBy: admin._id,
    slug: 'login-form-content'
  };
  await upsertComponent({ type: 'text', page: 'login', slug: 'login-form-content' }, loginFormDoc);

  // Signup Page Components
  console.log('📝 Seeding signup page components...');

  // Signup page SEO component
  const signupSeoDoc = {
    type: 'seo',
    page: 'sign',
    content: {
      title: { 
        en: 'Sign Up - Tamil Language Society', 
        ta: 'பதிவு - தமிழ் மொழி சங்கம்' 
      },
      description: { 
        en: 'Join the Tamil Language Society to connect with Tamil culture, access exclusive resources, and be part of our community.',
        ta: 'தமிழ் பண்பாட்டுடன் இணைக்க, பிரத்யேக வளங்களை அணுக மற்றும் எங்கள் சமூகத்தின் ஒரு பகுதியாக இருக்க தமிழ் மொழி சங்கத்தில் சேருங்கள்.'
      },
      keywords: ['signup', 'register', 'join', 'tamil', 'language', 'society', 'பதிவு', 'தமிழ்']
    },
    order: 1,
    isActive: true,
    createdBy: admin._id,
    slug: 'signup-seo'
  };
  await upsertComponent({ type: 'seo', page: 'sign' }, signupSeoDoc);

  // Signup page text content component
  const signupTextDoc = {
    type: 'text',
    page: 'sign',
    content: {
      title: { 
        en: 'Join Our Community', 
        ta: 'எங்கள் சமூகத்தில் சேருங்கள்' 
      },
      content: {
        en: 'Create your account to become part of the Tamil Language Society. Access exclusive content, participate in events, and connect with fellow Tamil language enthusiasts.',
        ta: 'தமிழ் மொழி சங்கத்தின் ஒரு பகுதியாக மாற உங்கள் கணக்கை உருவாக்குங்கள். பிரத்யேக உள்ளடக்கத்தை அணுகுங்கள், நிகழ்வுகளில் பங்கேற்கவும், தமிழ் மொழி ஆர்வலர்களுடன் இணைக்கவும்.'
      },
      format: 'plain',
      alignment: 'center'
    },
    order: 2,
    isActive: true,
    createdBy: admin._id,
    slug: 'signup-welcome-text'
  };
  await upsertComponent({ type: 'text', page: 'sign' }, signupTextDoc);

  // Signup form labels and messages component
  const signupFormDoc = {
    type: 'text',
    page: 'sign',
    content: {
      title: { 
        en: 'Signup Form Content', 
        ta: 'பதிவு படிவ உள்ளடக்கம்' 
      },
      content: {
        en: JSON.stringify({
          heading: 'Create Your Account',
          subheading: 'Join the Tamil Language Society',
          email: 'Email Address',
          password: 'Password',
          confirmPassword: 'Confirm Password',
          nameEn: 'Full Name (English)',
          nameTa: 'Full Name (Tamil)',
          nameTaOptional: 'Full Name (Tamil) - Optional',
          signupButton: 'Create Account',
          haveAccount: 'Already have an account?',
          signIn: 'Sign in here',
          passwordRequirement: 'Password must be at least 8 characters long',
          emailPlaceholder: 'your@email.com',
          nameEnPlaceholder: 'John Doe',
          nameTaPlaceholder: 'ஜான் டோ'
        }),
        ta: JSON.stringify({
          heading: 'உங்கள் கணக்கை உருவாக்குங்கள்',
          subheading: 'தமிழ் மொழி சங்கத்தில் சேருங்கள்',
          email: 'மின்னஞ்சல் முகவரி',
          password: 'கடவுச்சொல்',
          confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்தவும்',
          nameEn: 'முழு பெயர் (ஆங்கிலம்)',
          nameTa: 'முழு பெயர் (தமிழ்)',
          nameTaOptional: 'முழு பெயர் (தமிழ்) - விருப்பமானது',
          signupButton: 'கணக்கை உருவாக்குங்கள்',
          haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
          signIn: 'இங்கே உள்நுழையுங்கள்',
          passwordRequirement: 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் நீளமாக இருக்க வேண்டும்',
          emailPlaceholder: 'your@email.com',
          nameEnPlaceholder: 'John Doe',
          nameTaPlaceholder: 'ஜான் டோ'
        })
      },
      format: 'plain'
    },
    order: 3,
    isActive: true,
    createdBy: admin._id,
    slug: 'signup-form-content'
  };
  await upsertComponent({ type: 'text', page: 'sign', slug: 'signup-form-content' }, signupFormDoc);

  // Common authentication messages component
  const authMessagesDoc = {
    type: 'text',
    page: 'auth',
    content: {
      title: { 
        en: 'Authentication Messages', 
        ta: 'அங்கீகார செய்திகள்' 
      },
      content: {
        en: JSON.stringify({
          loadingSignIn: 'Signing in...',
          loadingSignUp: 'Creating account...',
          loadingReset: 'Resetting password...',
          successSignUp: 'Account created successfully! Redirecting to login...',
          successReset: 'Password reset successfully! You can now login with your new password.',
          errorGeneric: 'An error occurred. Please try again.',
          errorInvalidCredentials: 'Invalid email or password.',
          errorEmailExists: 'An account with this email already exists.',
          errorPasswordMismatch: 'Passwords do not match.',
          errorPasswordLength: 'Password must be at least 8 characters long.',
          errorInvalidEmail: 'Please enter a valid email address.',
          errorRequiredFields: 'Please fill in all required fields.'
        }),
        ta: JSON.stringify({
          loadingSignIn: 'உள்நுழைகிறது...',
          loadingSignUp: 'கணக்கை உருவாக்குகிறது...',
          loadingReset: 'கடவுச்சொல்லை மீட்டமைக்கிறது...',
          successSignUp: 'கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது! உள்நுழைவுக்கு திருப்பி விடப்படுகிறது...',
          successReset: 'கடவுச்சொல் வெற்றிகரமாக மீட்டமைக்கப்பட்டது! இப்போது உங்கள் புதிய கடவுச்சொல்லுடன் உள்நுழையலாம்.',
          errorGeneric: 'ஒரு பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
          errorInvalidCredentials: 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.',
          errorEmailExists: 'இந்த மின்னஞ்சலுடன் ஏற்கனவே ஒரு கணக்கு உள்ளது.',
          errorPasswordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை.',
          errorPasswordLength: 'கடவுச்சொல் குறைந்தது 8 எழுத்துகள் நீளமாக இருக்க வேண்டும்.',
          errorInvalidEmail: 'தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.',
          errorRequiredFields: 'தயவுசெய்து அனைத்து தேவையான புலங்களையும் நிரப்பவும்.'
        })
      },
      format: 'plain'
    },
    order: 1,
    isActive: true,
    createdBy: admin._id,
    slug: 'auth-messages'
  };
  await upsertComponent({ type: 'text', page: 'auth', slug: 'auth-messages' }, authMessagesDoc);

  console.log('✅ Authentication components seeded successfully!');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Failed to seed authentication components:', err);
  try { 
    await mongoose.disconnect(); 
  } catch {}
  process.exit(1);
});