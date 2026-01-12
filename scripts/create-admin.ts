import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config({ path: '.env.local' });

import dbConnect from '../src/lib/mongodb';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  try {
    await dbConnect();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = new User({
      name: {
        en: 'Admin User',
        ta: 'நிர்வாகி'
      },
      email: 'admin@tamilsociety.com',
      passwordHash: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@tamilsociety.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdmin();