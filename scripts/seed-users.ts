#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import models after env is loaded
import User from '../src/models/User';

// Database connection function
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

async function seedUsers() {
  try {
    console.log('👤 Creating users...');
    
    // Connect to database
    await connectDB();
    
    // Create admin user
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      email: 'admin@tamilsociety.org',
      passwordHash: hashedAdminPassword,
      role: 'admin',
      isActive: true,
      preferences: {
        language: 'en',
        notifications: true,
        theme: 'light'
      }
    });
    console.log('✅ Admin user created:', adminUser.email);

    // Create regular user
    const hashedUserPassword = await bcrypt.hash('user123', 12);
    const regularUser = await User.create({
      name: { en: 'Regular User', ta: 'வழக்கமான பயனர்' },
      email: 'user@tamilsociety.org',
      passwordHash: hashedUserPassword,
      role: 'user',
      isActive: true,
      preferences: {
        language: 'ta',
        notifications: true,
        theme: 'light'
      }
    });
    console.log('✅ Regular user created:', regularUser.email);

    console.log('🎉 Users seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
seedUsers();