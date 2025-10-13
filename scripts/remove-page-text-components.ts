import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';

async function connectDB() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
}

async function run() {
  await connectDB();
  const pages = ['books', 'ebooks', 'contacts'];
  const result = await Component.deleteMany({ type: 'text', page: { $in: pages } });
  console.log(`✅ Removed text components from pages ${pages.join(', ')}. Deleted: ${result.deletedCount}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('❌ Failed to remove text components:', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});