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

async function upsertComponent(filter: Record<string, unknown>, payload: Record<string, unknown>) {
  await Component.updateOne(filter, { $set: payload }, { upsert: true });
}

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const admin = await ensureAdmin();

  // Base hero for projects page (applies when no bureau filter)
  const heroBaseDoc = {
    type: 'hero',
    page: 'projects',
    content: {
      title: { en: 'Our Projects', ta: 'எங்கள் திட்டங்கள்' },
      subtitle: {
        en: 'Innovative initiatives to preserve, promote, and advance Tamil language and culture',
        ta: 'தமிழ் மொழி மற்றும் பண்பாட்டை பாதுகாக்க, மேம்படுத்த, முன்னேற்ற புதிய முயற்சிகள்'
      },
      ctas: [
        { text: { en: 'Explore All', ta: 'அனைத்தையும் ஆராயுங்கள்' }, href: '/projects', variant: 'primary' },
        { text: { en: 'Get Involved', ta: 'சேர்ந்து செயல்படுங்கள்' }, href: '/contacts', variant: 'secondary' }
      ],
      backgroundImages: [
        { src: '/vercel.svg', alt: { en: 'Background', ta: 'பின்னணி' } },
        { src: '/globe.svg', alt: { en: 'Global', ta: 'உலக' } }
      ]
    },
    order: 1,
    isActive: true,
    createdBy: admin._id,
    slug: 'projects-hero'
  };
  await upsertComponent({ type: 'hero', page: 'projects', bureau: { $exists: false } }, heroBaseDoc);

  // Bureau-specific hero variants (filtered by bureau)
  const bureaus = [
    { key: 'sports_leadership', en: 'Sports & Leadership', ta: 'விளையாட்டு & தலைமை' },
    { key: 'education_intellectual', en: 'Education & Intellectual', ta: 'கல்வி & அறிவாற்றல்' },
    { key: 'arts_culture', en: 'Arts & Culture', ta: 'கலை & பண்பு' },
    { key: 'social_welfare_voluntary', en: 'Social Welfare & Voluntary', ta: 'சமூக நலன் & தன்னார்வம்' },
    { key: 'language_literature', en: 'Language & Literature', ta: 'மொழி & இலக்கியம்' }
  ] as const;

  for (const b of bureaus) {
    const heroDoc = {
      type: 'hero',
      page: 'projects',
      bureau: b.key,
      content: {
        title: { en: `Our Projects - ${b.en}`, ta: `எங்கள் திட்டங்கள் - ${b.ta}` },
        subtitle: {
          en: 'Explore initiatives tailored to this bureau',
          ta: 'இந்தத் துறைக்கு ஏற்ற முயற்சிகளை ஆராயுங்கள்'
        },
        ctas: [
          { text: { en: 'Browse Items', ta: 'உருப்படிகளைப் பாருங்கள்' }, href: '/projects', variant: 'primary' }
        ],
        backgroundImages: [
          { src: '/globe.svg', alt: { en: b.en, ta: b.ta } }
        ]
      },
      order: 1,
      isActive: true,
      createdBy: admin._id,
      slug: `projects-hero-${b.key}`
    };
    await upsertComponent({ type: 'hero', page: 'projects', bureau: b.key }, heroDoc);
  }

  // Stats component for projects page, optional bureau-aware (base)
  const statsDoc = {
    type: 'stats',
    page: 'projects',
    content: {
      title: { en: 'Project Impact', ta: 'திட்டங்களின் தாக்கம்' },
      stats: [
        { label: { en: 'Active Projects', ta: 'செயலில் உள்ள திட்டங்கள்' }, value: 15 },
        { label: { en: 'Lives Impacted', ta: 'வாழ்க்கைகள் பாதிக்கப்பட்டவை' }, value: 50000 },
        { label: { en: 'Countries Reached', ta: 'எட்டப்பட்ட நாடுகள்' }, value: 25 },
        { label: { en: 'Resources Created', ta: 'உருவாக்கப்பட்ட வளங்கள்' }, value: 1000000 }
      ]
    },
    order: 3,
    isActive: true,
    createdBy: admin._id,
    slug: 'projects-stats'
  };
  await upsertComponent({ type: 'stats', page: 'projects' }, statsDoc);

  // CTA component for projects page, optional bureau-aware (base)
  const ctaDoc = {
    type: 'cta',
    page: 'projects',
    content: {
      title: { en: 'Get Involved', ta: 'சேர்ந்து செயல்படுங்கள்' },
      description: {
        en: 'Join our mission to preserve and promote Tamil language and culture. Contribute to our projects, share your expertise, or support our initiatives.',
        ta: 'தமிழ் மொழி மற்றும் பண்பாட்டை பாதுகாக்கவும், மேம்படுத்தவும் எங்கள் முயற்சிகளில் சேருங்கள். உங்கள் திறமையை பகிரவும் அல்லது எங்கள் முயற்சிகளுக்கு ஆதரவு தரவும்.'
      },
      buttons: [
        { text: { en: 'Volunteer', ta: 'தன்னார்வலராக சேருங்கள்' }, href: '/contacts', variant: 'primary', icon: 'fas fa-handshake' }
      ]
    },
    order: 4,
    isActive: true,
    createdBy: admin._id,
    slug: 'projects-cta'
  };
  await upsertComponent({ type: 'cta', page: 'projects' }, ctaDoc);

  console.log('✅ Seeded projects page components (hero, stats, CTA)');
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed projects components:', err);
  await mongoose.connection.close();
  process.exit(1);
});