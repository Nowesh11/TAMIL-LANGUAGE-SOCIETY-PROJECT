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
  if (m && m[1]) return m[1].trim();
  return fallback;
}

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  // Read provided content file: "content books" located as sibling of project root
  const projectRoot = process.cwd();
  const contentPath = path.join(projectRoot, '..', 'content books');
  let raw = '';
  try {
    raw = fs.readFileSync(contentPath, 'utf8');
  } catch (e) {
    console.warn('⚠️ Could not read content books file, using defaults');
  }

  // Try extracting hero title/subtitle from the file; fallback to sensible defaults
  const heroTitleEn = extractBetween(
    raw,
    /<span[^>]*data-key="books\.hero\.title"[^>]*>([\s\S]*?)<\/span>/i,
    'Tamil Book Store'
  );
  const heroSubtitleEn = extractBetween(
    raw,
    /<p[^>]*data-key="books\.hero\.subtitle"[^>]*>([\s\S]*?)<\/p>/i,
    'Discover and purchase authentic Tamil literature, educational materials, and cultural treasures'
  );

  // Seed hero component for books page
  await Component.findOneAndUpdate(
    { type: 'hero', page: 'books' },
    {
      type: 'hero',
      page: 'books',
      content: {
        title: { en: heroTitleEn, ta: 'தமிழ் நூல் கடை' },
        subtitle: { en: heroSubtitleEn, ta: 'தமிழ் மொழி மற்றும் பண்பாட்டை பிரதிபலிக்கும் நூல்கள்' },
        ctas: [
          { text: { en: 'Browse Books', ta: 'நூல்கள் காண' }, href: '/books', variant: 'primary' }
        ],
        alignment: 'center',
      },
      order: 1,
      isActive: true,
      createdBy: admin._id,
      slug: 'books-hero'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded books page hero component');

  // Seed a concise text section explaining cart and checkout
  await Component.findOneAndUpdate(
    { type: 'text', page: 'books', slug: 'books-cart-info' },
    {
      type: 'text',
      page: 'books',
      content: {
        title: { en: 'Quick Checkout', ta: 'விரைவு கட்டணம்' },
        content: {
          en: 'Add to cart. Tap checkout. Track orders easily. Prices in RM.',
          ta: 'வண்டியில் சேர். கட்டணத்திற்கு செல். ஆர்டர்களை எளிதாக கண்காணி. விலை RM.'
        },
        alignment: 'center'
      },
      order: 2,
      isActive: true,
      createdBy: admin._id,
      slug: 'books-cart-info'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded books page text section');

  // Seed a CTA component to encourage browsing and support
  await Component.findOneAndUpdate(
    { type: 'cta', page: 'books', slug: 'books-support-cta' },
    {
      type: 'cta',
      page: 'books',
      content: {
        title: { en: 'Support Tamil Literature', ta: 'தமிழ் இலக்கியத்தை ஆதரிக்கவும்' },
        description: {
          en: 'Your purchases help sustain community publishing and cultural programs.',
          ta: 'உங்கள் கொள்முதல்கள் சமூக வெளியீடு மற்றும் பண்பாட்டு திட்டங்களுக்கு ஆதரவாகும்.'
        },
        buttons: [
          { text: { en: 'Explore Books', ta: 'நூல்கள் காண' }, url: '/books', variant: 'primary' }
        ],
        alignment: 'center'
      },
      order: 3,
      isActive: true,
      createdBy: admin._id,
      slug: 'books-support-cta'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded books page CTA');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Failed to seed books components:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});