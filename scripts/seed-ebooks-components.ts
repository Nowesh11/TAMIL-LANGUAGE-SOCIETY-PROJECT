import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Component from '../src/models/Component';
import User from '../src/models/User';

async function connectDB() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
}

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

function extractBetween(source: string, regex: RegExp, fallback: string) {
  const m = source.match(regex);
  if (m && m[1]) {
    return m[1].trim();
  }
  return fallback;
}

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  // Attempt to read the provided content file: c:\Users\...\content ebooks
  // In this workspace, assume it exists at project sibling path "content ebooks" relative to project root.
  const projectRoot = process.cwd();
  const contentPath = path.join(projectRoot, '..', 'content ebooks');
  let raw = '';
  try {
    raw = fs.readFileSync(contentPath, 'utf8');
  } catch (e) {
    // Fallback: empty string; we'll seed sensible defaults
    raw = '';
  }

  const heroTitleEn = extractBetween(
    raw,
    /<span[^>]*data-content="ebooks\.hero\.title"[^>]*>([\s\S]*?)<\/span>/i,
    'Digital Library'
  );
  const heroSubtitleEn = extractBetween(
    raw,
    /<p[^>]*data-content="ebooks\.hero\.subtitle"[^>]*>([\s\S]*?)<\/p>/i,
    'Explore and download ebooks curated by TLS.'
  );

  // Seed hero component for ebooks page
  await Component.findOneAndUpdate(
    { type: 'hero', page: 'ebooks' },
    {
      type: 'hero',
      page: 'ebooks',
      bureau: 'global',
      content: {
        title: { en: heroTitleEn, ta: 'மின்னினை நூலகம்' },
        subtitle: { en: heroSubtitleEn, ta: 'TLS தேர்ந்தெடுத்த மின்னினை நூல்கள்.' },
        backgroundImages: [],
        ctas: [
          { text: { en: 'Browse Ebooks', ta: 'மின்னினை நூல்கள் காண' }, href: '/ebooks', variant: 'primary' }
        ],
      },
      active: true,
      createdBy: admin._id,
    },
    { upsert: true, new: true }
  );

  // Additional components can be seeded here if needed and supported by schema

  console.log('Seeded ebooks page components successfully');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});