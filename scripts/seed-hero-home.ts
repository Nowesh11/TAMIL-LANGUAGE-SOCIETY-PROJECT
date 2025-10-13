#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Component from '../src/models/Component';
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

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const admin = await ensureAdmin();

  const heroDoc = {
    type: 'hero',
    page: 'home',
    content: {
      title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
      subtitle: { en: 'Preserving heritage, promoting culture, empowering community.', ta: 'பாரம்பரியத்தை பாதுகாப்பு, பண்பாட்டை மேம்படுத்து, சமூகத்தை வலுப்படுத்து.' },
      ctas: [
        { text: { en: 'Explore Projects', ta: 'திட்டங்களை பார்க்க' }, href: '/views/projects.html', variant: 'primary' },
        { text: { en: 'Shop Books', ta: 'பததகஙகள வஙக' }, href: '/views/books.html', variant: 'secondary' }
      ],
      backgroundImages: [
        { src: '/globe.svg', alt: { en: 'Global culture', ta: 'உலக கலாச்சாரம்' } },
        { src: '/next.svg', alt: { en: 'Next.js logo', ta: 'நெக்ஸ்ட்.ஜேஸ் லோகோ' } },
        { src: '/vercel.svg', alt: { en: 'Vercel logo', ta: 'வெர்செல் லோகோ' } }
      ]
    },
    order: 1,
    isActive: true,
    createdBy: admin._id
  };

  await Component.updateOne(
    { type: 'hero', page: 'home' },
    { $set: heroDoc },
    { upsert: true }
  );

  console.log('✅ Home hero component upserted');
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed home hero:', err);
  await mongoose.connection.close();
  process.exit(1);
});