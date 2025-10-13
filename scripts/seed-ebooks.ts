import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import EBook from '../src/models/EBook';

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

function fileInfo(relPath: string) {
  const full = path.join(process.cwd(), relPath);
  let size = 0;
  try {
    size = fs.statSync(full).size;
  } catch {
    size = 0;
  }
  return { filePath: relPath, fileSize: size };
}

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  const samples = [
    {
      title: { en: 'Tamil Literature Anthology', ta: 'தமிழ் இலக்கியத் தொகுப்பு' },
      author: { en: 'TLS Editorial Board', ta: 'TLS ஆசிரியர் குழு' },
      description: {
        en: 'A curated anthology of classical and modern Tamil literature.',
        ta: 'பண்பாட்டு மற்றும் நவீன தமிழ் இலக்கியங்களின் தேர்ந்தெடுக்கப்பட்ட தொகுப்பு.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-1.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000001',
      category: 'literature',
      publishedYear: 2020,
      pages: 120,
      language: 'english',
      featured: true,
      active: true,
    },
    {
      title: { en: 'Educational Essays', ta: 'கல்வி கட்டுரைகள்' },
      author: { en: 'TLS Contributors', ta: 'TLS பங்களிப்பாளர்கள்' },
      description: {
        en: 'Essays on education and learning methodologies.',
        ta: 'கல்வி மற்றும் கற்றல் முறைகள் பற்றிய கட்டுரைகள்.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-2.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000002',
      category: 'education',
      publishedYear: 2021,
      pages: 95,
      language: 'english',
      featured: true,
      active: true,
    },
    {
      title: { en: 'Cultural Heritage', ta: 'தமிழர் பாரம்பரியம்' },
      author: { en: 'TLS Research', ta: 'TLS ஆய்வு' },
      description: {
        en: 'Exploring the rich cultural heritage of Tamil society.',
        ta: 'தமிழர் சமுதாயத்தின் செழுமையான பாரம்பரியத்தை ஆராய்வு.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-3.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000003',
      category: 'culture',
      publishedYear: 2019,
      pages: 80,
      language: 'english',
      featured: false,
      active: true,
    },
    {
      title: { en: 'Tamil History Primer', ta: 'தமிழர் வரலாறு அறிமுகம்' },
      author: { en: 'TLS Historians', ta: 'TLS வரலாற்றாளர் குழு' },
      description: {
        en: 'A concise overview of Tamil history.',
        ta: 'தமிழர் வரலாற்றின் சுருக்கமான பார்வை.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-4.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000004',
      category: 'history',
      publishedYear: 2018,
      pages: 110,
      language: 'english',
      featured: false,
      active: true,
    },
    {
      title: { en: 'Poetry Selections', ta: 'கவிதைத் தேர்வுகள்' },
      author: { en: 'Various Poets', ta: 'பல கவிஞர்கள்' },
      description: {
        en: 'Selected poems celebrating Tamil language.',
        ta: 'தமிழ்மொழியை கொண்டாடும் தேர்ந்தெடுக்கப்பட்ட கவிதைகள்.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-5.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000005',
      category: 'poetry',
      publishedYear: 2022,
      pages: 60,
      language: 'english',
      featured: false,
      active: true,
    },
    {
      title: { en: 'Children Stories', ta: 'குழந்தைச் சிறுகதைகள்' },
      author: { en: 'TLS Storytellers', ta: 'TLS கதை எழுத்தாளர்கள்' },
      description: {
        en: 'Short stories for children and young readers.',
        ta: 'குழந்தைகள் மற்றும் இளம் வாசகர்களுக்கான சிறுகதைகள்.',
      },
      ...fileInfo('uploads/ebooks/sample-ebook-6.txt'),
      fileFormat: 'txt',
      coverPath: '/globe.svg',
      isbn: '978-TLS-000006',
      category: 'children',
      publishedYear: 2023,
      pages: 70,
      language: 'english',
      featured: false,
      active: true,
    },
  ];

  for (const s of samples) {
    await EBook.findOneAndUpdate(
      { 'title.en': s.title.en },
      { ...s, createdBy: admin._id },
      { upsert: true, new: true }
    );
  }

  console.log('Seeded sample ebooks successfully');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});