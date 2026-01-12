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

function readContentFile(): string {
  // Try to read the provided content file: c:\Users\...\content contacts
  // In this workspace, assume it exists at project sibling path "content contacts" relative to project root.
  const projectRoot = process.cwd();
  const contentPath = path.join(projectRoot, '..', 'content contacts');
  try {
    return fs.readFileSync(contentPath, 'utf8');
  } catch {
    return '';
  }
}

function extractBetween(source: string, regex: RegExp, fallback: string) {
  const m = source.match(regex);
  if (m && m[1]) {
    return m[1].trim();
  }
  return fallback;
}

async function upsertComponent(doc: any) {
  await Component.findOneAndUpdate(
    { type: doc.type, page: doc.page },
    doc,
    { upsert: true, new: true }
  );
}

async function run() {
  await connectDB();
  const admin = await ensureAdmin();

  const raw = readContentFile();

  // SEO content
  const seoTitle = extractBetween(raw, /<title[^>]*data-content="contact-page-title"[^>]*>([\s\S]*?)<\/title>/i, 'Contact Us - Tamil Language Society');
  const seoDescription = 'Contact Tamil Language Society for support, inquiries, and community engagement.';
  await upsertComponent({
    type: 'seo',
    page: 'contacts',
    content: {
      title: { en: seoTitle, ta: 'எங்களை தொடர்பு கொள்ள' },
      description: { en: seoDescription, ta: 'ஆதரவு மற்றும் கேள்விகளுக்காக எங்களை தொடர்பு கொள்ளுங்கள்.' }
    },
    order: 0,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // Hero component (optional but helps page look complete)
  const heroTitle = extractBetween(raw, /data-content="contact-hero-title"[^>]*>([\s\S]*?)<\/span>/i, 'Contact Us');
  const heroSubtitle = extractBetween(raw, /data-content="contact-hero-subtitle"[^>]*>([\s\S]*?)<\/p>/i, "We'd love to hear from you. Send us a message and we'll respond as soon as possible.");
  await upsertComponent({
    type: 'hero',
    page: 'contacts',
    bureau: 'global',
    content: {
      title: { en: heroTitle, ta: 'எங்களை தொடர்பு கொள்ள' },
      subtitle: { en: heroSubtitle, ta: 'உங்கள் செய்தியை அனுப்புங்கள்; விரைவில் பதிலளிப்போம்.' },
      backgroundImage: '/hero-bg-3.svg',
      cta: {
        label: { en: 'Start Chat', ta: 'அரட்டை தொடங்க' },
        href: '/contacts'
      }
    },
    order: 1,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // Social links component
  await upsertComponent({
    type: 'social-links',
    page: 'contacts',
    content: {
      title: { en: 'Follow Us', ta: 'எங்களை பின்தொடருங்கள்' },
      links: [
        { platform: 'facebook', url: 'https://facebook.com/tamilsociety', icon: 'fab fa-facebook', label: { en: 'Facebook', ta: 'ஃபேஸ்புக்' } },
        { platform: 'twitter', url: 'https://twitter.com/tamilsociety', icon: 'fab fa-twitter', label: { en: 'Twitter', ta: 'ட்விட்டர்' } },
        { platform: 'instagram', url: 'https://instagram.com/tamilsociety', icon: 'fab fa-instagram', label: { en: 'Instagram', ta: 'இன்ஸ்டாகிராம்' } },
        { platform: 'youtube', url: 'https://youtube.com/@tamilsociety', icon: 'fab fa-youtube', label: { en: 'YouTube', ta: 'யூடியூப்' } },
        { platform: 'linkedin', url: 'https://linkedin.com/company/tamilsociety', icon: 'fab fa-linkedin', label: { en: 'LinkedIn', ta: 'லिंक்ட்இன்' } }
      ],
      layout: 'horizontal',
      showLabels: false
    },
    order: 2,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // FAQ component
  await upsertComponent({
    type: 'faq',
    page: 'contacts',
    content: {
      title: { en: 'Frequently Asked Questions', ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்' },
      faqs: [
        {
          question: { en: 'How quickly do you respond?', ta: 'நீங்கள் எவ்வளவு விரைவாக பதிலளிப்பீர்கள்?' },
          answer: { en: 'We typically respond within 24 hours.', ta: 'பொதுவாக 24 மணி நேரத்தில் பதில் அளிப்போம்.' },
          category: 'General'
        },
        {
          question: { en: 'How can I start a live chat?', ta: 'நேரடி அரட்டையை எப்படி தொடங்குவது?' },
          answer: { en: 'Click the chat icon at the bottom-right to begin.', ta: 'வலது கீழே உள்ள அரட்டை சின்னத்தை அழுத்தி தொடங்கலாம்.' },
          category: 'Support'
        },
        {
          question: { en: 'Do you offer community programs?', ta: 'உங்களிடம் சமூக நிகழ்ச்சிகள் உள்ளனவா?' },
          answer: { en: 'Yes, join our programs listed on the Projects page.', ta: 'ஆம், திட்டங்கள் பக்கத்தில் பட்டியலிட்டுள்ள நிகழ்ச்சிகளில் சேரலாம்.' },
          category: 'Community'
        }
      ],
      searchable: true,
      categories: ['General', 'Support', 'Community']
    },
    order: 3,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // Contact Info Cards as Features (Address, Phone, Email, Hours)
  await upsertComponent({
    type: 'features',
    page: 'contacts',
    content: {
      title: { en: 'Contact Information', ta: 'தொடர்பு தகவல்' },
      subtitle: { en: 'Reach us through any of the following.', ta: 'பின்வரும் வழிகள் மூலம் எங்களை அணுகுங்கள்.' },
      layout: 'cards',
      columns: 4,
      features: [
        {
          title: { en: 'Address', ta: 'முகவரி' },
          description: { en: '123 Tamil Street, Culture City', ta: '123 தமிழ் வீதி, கலாச்சார நகரம்' },
          icon: 'fa-solid fa-location-dot'
        },
        {
          title: { en: 'Phone', ta: 'தொலைபேசி' },
          description: { en: '+60 12-345 6789', ta: '+60 12-345 6789' },
          icon: 'fa-solid fa-phone'
        },
        {
          title: { en: 'Email', ta: 'மின்னஞ்சல்' },
          description: { en: 'support@tamilsociety.org', ta: 'support@tamilsociety.org' },
          icon: 'fa-solid fa-envelope'
        },
        {
          title: { en: 'Office Hours', ta: 'அலுவலக நேரம்' },
          description: { en: 'Mon–Fri, 9:00 AM – 5:00 PM', ta: 'திங்கள்–வெள்ளி, காலை 9:00 – மாலை 5:00' },
          icon: 'fa-solid fa-clock'
        }
      ]
    },
    order: 4,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // Additional contact features (Quick Response, Multiple Channels, Community Support)
  await upsertComponent({
    type: 'features',
    page: 'contacts',
    content: {
      title: { en: 'Why Contact Us', ta: 'எங்களை தொடர்பு கொள்ளும் காரணங்கள்' },
      layout: 'cards',
      columns: 3,
      features: [
        {
          title: { en: 'Quick Response', ta: 'விரைவான பதில்' },
          description: { en: 'Our team aims to reply within 24 hours.', ta: 'எங்கள் குழு 24 மணி நேரத்தில் பதில் அளிக்க முயலும்.' },
          icon: 'fa-solid fa-bolt'
        },
        {
          title: { en: 'Multiple Channels', ta: 'பல சேனல்கள்' },
          description: { en: 'Reach us via chat, email, or phone.', ta: 'அரட்டை, மின்னஞ்சல் அல்லது தொலைபேசி மூலம் எங்களை அணுகுங்கள்.' },
          icon: 'fa-solid fa-headset'
        },
        {
          title: { en: 'Community Support', ta: 'சமூக ஆதரவு' },
          description: { en: 'We support Tamil language and culture together.', ta: 'தமிழ் மொழி மற்றும் பண்பாட்டை ஒன்றிணைந்து ஆதரிக்கிறோம்.' },
          icon: 'fa-solid fa-people-group'
        }
      ]
    },
    order: 5,
    isActive: true,
    cssClasses: [],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  // Map embed using TextSection (HTML)
  // Replaced Google Maps Embed API with a direct iframe link that doesn't require an API key for basic embedding
  // or uses the correct embed format to avoid RefererNotAllowedMapError
  await upsertComponent({
    type: 'text',
    page: 'contacts',
    slug: 'map',
    content: {
      title: { en: 'Find Us on the Map', ta: 'வரைபடத்தில் எங்களை காணுங்கள்' },
      content: {
        en: '<div class="map-container" style="position:relative;overflow:hidden;padding-top:56.25%;"><iframe title="Tamil Language Society Location" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.794625895744!2d101.686855!3d3.139003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc3625f9c39e55%3A0x6a0a03975525540!2sKuala%20Lumpur!5e0!3m2!1sen!2smy!4v1652865241592!5m2!1sen!2smy" width="100%" height="100%" style="border:0;position:absolute;top:0;left:0;border-radius:16px;box-shadow:var(--shadow-md);" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>',
        ta: '<div class="map-container" style="position:relative;overflow:hidden;padding-top:56.25%;"><iframe title="தமிழ் மொழி சங்கத்தின் இடம்" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3983.794625895744!2d101.686855!3d3.139003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31cc3625f9c39e55%3A0x6a0a03975525540!2sKuala%20Lumpur!5e0!3m2!1sen!2smy!4v1652865241592!5m2!1sen!2smy" width="100%" height="100%" style="border:0;position:absolute;top:0;left:0;border-radius:16px;box-shadow:var(--shadow-md);" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>'
      },
      format: 'html',
      alignment: 'center',
      fontSize: 'md',
      fontWeight: 'normal'
    },
    order: 6,
    isActive: true,
    cssClasses: ['card-morphism'],
    visibility: { desktop: true, tablet: true, mobile: true },
    animation: { type: 'none', duration: 300, delay: 0 },
    createdBy: admin._id
  });

  console.log('✅ Seeded contacts page components successfully');
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});