#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
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

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
}

async function readAboutContent(projectRoot: string) {
  const aboutPath = path.join(projectRoot, '..', 'content about.md');
  try {
    const raw = await fs.readFile(aboutPath, 'utf-8');
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleText = (titleMatch ? titleMatch[1].trim() : 'About Us - Tamil Language Society');
    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? stripTags(bodyMatch[1]) : '';
    return { titleText, bodyHtml };
  } catch (e) {
    console.warn('⚠️ Unable to read content about.md:', (e as Error).message);
    return { titleText: 'About Us - Tamil Language Society', bodyHtml: '' };
  }
}

async function getHistoryImages(projectRoot: string) {
  const dir = path.join(projectRoot, 'uploads', 'our history', 'images');
  try {
    const files = await fs.readdir(dir);
    const allowed = files.filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
    return allowed.map((f) => ({
      src: `/uploads/our history/images/${f}`,
      alt: { en: 'Our history photo', ta: 'எங்கள் வரலாறு படம்' },
    }));
  } catch (e) {
    console.warn('⚠️ No history images found in uploads/our history/images');
    return [] as { src: string; alt: { en: string; ta: string } }[];
  }
}

async function upsertComponent(filter: Record<string, unknown>, payload: Record<string, unknown>) {
  await Component.updateOne(filter, { $set: payload }, { upsert: true });
}

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const admin = await ensureAdmin();
  const projectRoot = process.cwd();
  const { titleText, bodyHtml } = await readAboutContent(projectRoot);
  const images = await getHistoryImages(projectRoot);

  // About Hero
  const heroDoc = {
    type: 'hero',
    page: 'about',
    content: {
      title: { en: titleText, ta: 'எங்களைப் பற்றி - தமிழ் மொழி சங்கம்' },
      subtitle: {
        en: 'Discover our legacy, mission, and vision in depth.',
        ta: 'எங்களின் பாரம்பரியம், பணி, பார்வையை ஆழமாக அறிந்து கொள்ளுங்கள்.'
      },
      ctas: [
        { text: { en: 'Explore Our History', ta: 'எங்கள் வரலாற்றைப் பாருங்கள்' }, href: '#our-history', variant: 'primary' },
        { text: { en: 'Meet the Team', ta: 'எங்கள் குழுவை அறியுங்கள்' }, href: '#our-team', variant: 'secondary' }
      ],
      backgroundImages: images.length ? images.slice(0, 5) : [
        { src: '/uploads/logo/image/logo.jpg', alt: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' } }
      ]
    },
    order: 1,
    isActive: true,
    createdBy: admin._id,
    slug: 'about-hero'
  };
  await upsertComponent({ type: 'hero', page: 'about' }, heroDoc);

  // Vision
  const visionDoc = {
    type: 'text',
    page: 'about',
    content: {
      title: { en: 'Our Vision', ta: 'எங்கள் பார்வை' },
      content: {
        en: 'A flourishing Tamil community preserving heritage, inspiring creativity, and elevating culture for future generations.',
        ta: 'பாரம்பரியத்தை காக்கும், படைப்பாற்றலை ஊக்குவிக்கும், பண்பாட்டை உயர்த்தும் செழிப்பான தமிழ் சமூகத்தை உருவாக்குதல்.'
      },
      alignment: 'center',
      format: 'plain'
    },
    order: 2,
    isActive: true,
    createdBy: admin._id,
    slug: 'vision'
  };
  await upsertComponent({ type: 'text', page: 'about', slug: 'vision' }, visionDoc);

  // Mission
  const missionDoc = {
    type: 'text',
    page: 'about',
    content: {
      title: { en: 'Our Mission', ta: 'எங்கள் பணி' },
      content: {
        en: 'Advance Tamil language and culture through education, arts, research, and community engagement.',
        ta: 'கல்வி, கலை, ஆய்வு மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி மற்றும் பண்பாட்டை முன்னேற்றுதல்.'
      },
      alignment: 'center',
      format: 'plain'
    },
    order: 3,
    isActive: true,
    createdBy: admin._id,
    slug: 'mission'
  };
  await upsertComponent({ type: 'text', page: 'about', slug: 'mission' }, missionDoc);

  // Our History text (from content about.md)
  const historyTextDoc = {
    type: 'text',
    page: 'about',
    content: {
      title: { en: 'Our History', ta: 'எங்கள் வரலாறு' },
      content: { en: bodyHtml || 'History content will appear here.', ta: bodyHtml || 'வரலாறு உள்ளடக்கம் இங்கே காட்டப்படும்.' },
      alignment: 'center',
      format: bodyHtml ? 'html' : 'plain',
      fontSize: 'lg',
      fontWeight: 'medium'
    },
    order: 4,
    isActive: true,
    createdBy: admin._id,
    slug: 'our-history-text'
  };
  await upsertComponent({ type: 'text', page: 'about', slug: 'our-history-text' }, historyTextDoc);

  // Our History gallery
  const historyGalleryDoc = {
    type: 'gallery',
    page: 'about',
    content: {
      title: { en: 'Our History Gallery', ta: 'எங்கள் வரலாறு புகைப்படங்கள்' },
      images: images.length ? images : [
        { src: '/uploads/our history/images/sample-1.jpg', alt: { en: 'History photo', ta: 'வரலாற்றுப் படம்' } },
        { src: '/uploads/our history/images/sample-2.jpg', alt: { en: 'History photo', ta: 'வரலாற்றுப் படம்' } }
      ],
      layout: 'grid',
      columns: 3,
      showThumbnails: false
    },
    order: 5,
    isActive: true,
    createdBy: admin._id,
    slug: 'our-history-gallery'
  };
  await upsertComponent({ type: 'gallery', page: 'about', slug: 'our-history-gallery' }, historyGalleryDoc);

  console.log('✅ About page components upserted');
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed about components:', err);
  await mongoose.connection.close();
  process.exit(1);
});