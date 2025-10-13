import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Book from '../src/models/Book';
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

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  const samples = [
    {
      title: { en: 'Tamil Heritage', ta: 'தமிழர் மரபு' },
      author: { en: 'A. Writer', ta: 'அ. எழுத்தாளர்' },
      description: { en: 'Exploring Tamil culture and heritage.', ta: 'தமிழர் பண்பாட்டும் மரபும் பற்றிய ஆய்வு.' },
      price: 25,
      stock: 50,
      coverPath: '/globe.svg',
      isbn: '9781234567897',
      category: 'culture',
      language: 'english' as const,
      featured: true,
    },
    {
      title: { en: 'Bilingual Stories', ta: 'இருமொழிக் கதைகள்' },
      author: { en: 'B. Author', ta: 'பி. ஆசிரியர்' },
      description: { en: 'Short stories in English and Tamil.', ta: 'ஆங்கிலமும் தமிழிலும் சுருக்கக் கதைகள்.' },
      price: 30,
      stock: 40,
      coverPath: '/globe.svg',
      category: 'fiction',
      language: 'english' as const,
      featured: false,
    },
    {
      title: { en: 'Learning Tamil', ta: 'தமிழ் கற்றல்' },
      author: { en: 'C. Teacher', ta: 'சி. ஆசிரியர்' },
      description: { en: 'Beginner guide to Tamil language.', ta: 'தமிழ் மொழியை கற்க ஆரம்பக் கையேடு.' },
      price: 20,
      stock: 60,
      coverPath: '/globe.svg',
      category: 'education',
      language: 'english' as const,
      featured: false,
    },
  ];

  for (const s of samples) {
    await Book.findOneAndUpdate(
      { 'title.en': s.title.en },
      { ...s, active: true, createdBy: admin._id },
      { upsert: true, new: true }
    );
  }

  console.log('✅ Seeded sample books');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});