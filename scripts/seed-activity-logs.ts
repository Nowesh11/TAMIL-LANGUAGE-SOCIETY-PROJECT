#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import ActivityLog from '../src/models/ActivityLog';
import User from '../src/models/User';
import Book from '../src/models/Book';
import EBook from '../src/models/EBook';
import Team from '../src/models/Team';
import Purchase from '../src/models/Purchase';

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  // Get existing users, books, ebooks, team members for realistic activity logs
  const users = await User.find().limit(10);
  const books = await Book.find().limit(5);
  const ebooks = await EBook.find().limit(5);
  const teamMembers = await Team.find().limit(3);
  const purchases = await Purchase.find().limit(5);

  if (users.length === 0) {
    console.log('❌ No users found. Please seed users first.');
    return;
  }

  // Clear existing activity logs
  await ActivityLog.deleteMany({});
  console.log('🗑️ Cleared existing activity logs');

  const activityLogs = [];
  const now = new Date();

  // Generate activity logs for the last 30 days
  for (let i = 0; i < 100; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    const activityTypes = [
      // User activities
      {
        entityType: 'user',
        action: 'login',
        description: `User ${randomUser.name.en} logged in`,
        userType: 'user' as const
      },
      {
        entityType: 'user',
        action: 'registered',
        description: `New user ${randomUser.name.en} registered`,
        userType: 'user' as const
      },
      // Book activities
      ...(books.length > 0 ? [{
        entityType: 'book' as const,
        action: 'created' as const,
        description: `Book "${books[Math.floor(Math.random() * books.length)].title.en}" was created`,
        userType: 'admin' as const,
        entityId: books[Math.floor(Math.random() * books.length)]._id
      }] : []),
      ...(books.length > 0 ? [{
        entityType: 'book' as const,
        action: 'updated' as const,
        description: `Book "${books[Math.floor(Math.random() * books.length)].title.en}" was updated`,
        userType: 'admin' as const,
        entityId: books[Math.floor(Math.random() * books.length)]._id
      }] : []),
      // EBook activities
      ...(ebooks.length > 0 ? [{
        entityType: 'ebook' as const,
        action: 'created' as const,
        description: `E-Book "${ebooks[Math.floor(Math.random() * ebooks.length)].title.en}" was created`,
        userType: 'admin' as const,
        entityId: ebooks[Math.floor(Math.random() * ebooks.length)]._id
      }] : []),
      ...(ebooks.length > 0 ? [{
        entityType: 'ebook' as const,
        action: 'downloaded' as const,
        description: `User downloaded "${ebooks[Math.floor(Math.random() * ebooks.length)].title.en}"`,
        userType: 'user' as const,
        entityId: ebooks[Math.floor(Math.random() * ebooks.length)]._id
      }] : []),
      // Team activities
      ...(teamMembers.length > 0 ? [{
        entityType: 'team' as const,
        action: 'created' as const,
        description: `Team member "${teamMembers[Math.floor(Math.random() * teamMembers.length)].name.en}" was added`,
        userType: 'admin' as const,
        entityId: teamMembers[Math.floor(Math.random() * teamMembers.length)]._id
      }] : []),
      // Purchase activities
      ...(purchases.length > 0 ? [{
        entityType: 'purchase' as const,
        action: 'created' as const,
        description: `New purchase completed for ₹${Math.floor(Math.random() * 500) + 100}`,
        userType: 'user' as const,
        entityId: purchases[Math.floor(Math.random() * purchases.length)]._id
      }] : []),
      // Chat activities
      {
        entityType: 'chat' as const,
        action: 'created' as const,
        description: `User sent a message in chat`,
        userType: 'user' as const
      },
      // Recruitment activities
      {
        entityType: 'recruitment' as const,
        action: 'created' as const,
        description: `New recruitment form was created`,
        userType: 'admin' as const
      },
      {
        entityType: 'recruitment' as const,
        action: 'updated' as const,
        description: `Recruitment application was submitted`,
        userType: 'user' as const
      }
    ];

    const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    activityLogs.push({
      userId: randomUser._id,
      userType: randomActivity.userType,
      entityType: randomActivity.entityType,
      entityId: randomActivity.entityId,
      action: randomActivity.action,
      description: randomActivity.description,
      metadata: {
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: createdAt.toISOString()
      },
      createdAt,
      updatedAt: createdAt
    });
  }

  // Insert activity logs in batches
  const batchSize = 20;
  for (let i = 0; i < activityLogs.length; i += batchSize) {
    const batch = activityLogs.slice(i, i + batchSize);
    await ActivityLog.insertMany(batch);
    console.log(`✅ Inserted activity logs batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activityLogs.length / batchSize)}`);
  }

  console.log(`✅ Successfully seeded ${activityLogs.length} activity logs`);

  // Display some statistics
  const totalLogs = await ActivityLog.countDocuments();
  const adminLogs = await ActivityLog.countDocuments({ userType: 'admin' });
  const userLogs = await ActivityLog.countDocuments({ userType: 'user' });
  const recentLogs = await ActivityLog.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  console.log('\n📊 Activity Logs Statistics:');
  console.log(`Total logs: ${totalLogs}`);
  console.log(`Admin logs: ${adminLogs}`);
  console.log(`User logs: ${userLogs}`);
  console.log(`Recent logs (7 days): ${recentLogs}`);

  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB');
}

main().catch(console.error);