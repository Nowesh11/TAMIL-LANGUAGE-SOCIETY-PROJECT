#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Team from '../src/models/Team';
import User from '../src/models/User';

async function ensureAdmin() {
  const email = 'admin@tamilsociety.org';
  let admin = await User.findOne({ email });
  if (!admin) {
    const passwordHash = await bcrypt.hash('password123', 10);
    admin = await User.create({
      email,
      passwordHash,
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      role: 'admin',
      purchases: []
    });
    console.log('✅ Admin user created');
  }
  return admin;
}

async function upsertMember(filter: Record<string, unknown>, payload: Record<string, unknown>) {
  await Team.updateOne(filter, { $set: payload }, { upsert: true });
}

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const admin = await ensureAdmin();

  const members = [
    {
      name: { en: 'K. Sundaram', ta: 'கே. சுந்தரம்' },
      role: 'President',
      slug: 'president-k-sundaram',
      bio: { en: 'Leading our society with vision and integrity.', ta: 'பார்வையுடனும் நேர்மையுடனும் எங்கள் சங்கத்தை வழிநடத்துகிறார்.' },
      email: 'president@tamilsociety.org',
      phone: '+1-555-1000',
      orderNum: 1,
      imagePath: '/uploads/team/president.jpg',
      socialLinks: { facebook: '', twitter: '', instagram: '' },
      createdBy: admin._id
    },
    {
      name: { en: 'R. Valli', ta: 'ஆர். வள்ளி' },
      role: 'Vice President',
      slug: 'vice-president-r-valli',
      bio: { en: 'Supporting initiatives and empowering our committees.', ta: 'எங்கள் குழுக்களை வலுப்படுத்தி முயற்சிகளுக்கு துணை நிற்பவர்.' },
      email: 'vp@tamilsociety.org',
      phone: '+1-555-1001',
      orderNum: 2,
      imagePath: '/uploads/team/vice-president.jpg',
      socialLinks: { facebook: '', twitter: '', instagram: '' },
      createdBy: admin._id
    },
    {
      name: { en: 'S. Mani', ta: 'எஸ். மணி' },
      role: 'Secretary',
      slug: 'secretary-s-mani',
      bio: { en: 'Coordinating events, records, and communications.', ta: 'நிகழ்வுகள், பதிவுகள், தொடர்புகளை ஒருங்கிணைப்பவர்.' },
      email: 'secretary@tamilsociety.org',
      phone: '+1-555-1002',
      orderNum: 3,
      imagePath: '/uploads/team/secretary.jpg',
      socialLinks: { facebook: '', twitter: '', instagram: '' },
      createdBy: admin._id
    },
    {
      name: { en: 'P. Devi', ta: 'பி. தேவி' },
      role: 'Treasurer',
      slug: 'treasurer-p-devi',
      bio: { en: 'Managing finances and sustaining operations.', ta: 'நிதிகளைப் பராமரித்து செயல்பாடுகளைத் தொடர்ந்து நடத்துபவர்.' },
      email: 'treasurer@tamilsociety.org',
      phone: '+1-555-1003',
      orderNum: 4,
      imagePath: '/uploads/team/treasurer.jpg',
      socialLinks: { facebook: '', twitter: '', instagram: '' },
      createdBy: admin._id
    }
  ];

  for (const m of members) {
    await upsertMember(
      { email: m.email },
      m
    );
  }

  console.log('✅ Team members upserted');
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed team:', err);
  await mongoose.connection.close();
  process.exit(1);
});