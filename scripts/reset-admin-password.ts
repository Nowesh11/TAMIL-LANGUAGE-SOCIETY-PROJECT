import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
const result = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
console.log('Dotenv result:', result);

import dbConnect from '../src/lib/mongodb';
import User from '../src/models/User';
import { hashPassword } from '../src/lib/auth';

// Explicitly set MONGODB_URI if dotenv failed to populate process.env
if (!process.env.MONGODB_URI && result.parsed && result.parsed.MONGODB_URI) {
    process.env.MONGODB_URI = result.parsed.MONGODB_URI;
}

// Fallback hardcoded if all else fails (since I saw it in .env.local tool output)
if (!process.env.MONGODB_URI) {
    console.log('Using fallback MONGODB_URI');
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tamil-language-society';
}

async function resetAdminPassword() {
  try {
    await dbConnect();
    console.log('Connected to database');

    const email = 'admin@tamilsociety.org';
    const password = 'Admin@123';
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Update or create the admin user
    const result = await User.findOneAndUpdate(
      { email },
      { 
        passwordHash,
        name: { en: 'Admin', ta: 'நிர்வாகி' },
        role: 'admin',
        email
      },
      { upsert: true, new: true }
    );
    
    console.log(`Admin user ${email} password reset successfully.`);
    console.log('New ID:', result._id);
    console.log('Role:', result.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
