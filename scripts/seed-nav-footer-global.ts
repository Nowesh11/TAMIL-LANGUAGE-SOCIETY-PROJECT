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

  // Pages to seed navbar/footer for (global usage across site)
  const pages = ['home', 'about', 'projects', 'ebooks', 'books', 'contacts', 'notifications', 'login', 'sign'];

  const navbarContent = {
    themeToggle: true,
    logo: {
      image: {
        src: '/globe.svg',
        alt: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' }
      },
      text: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' }
    },
    menu: [
      { label: { en: 'Home', ta: 'முகப்பு' }, href: '/', active: true, variant: 'link', dataKey: 'global.menu.home' },
      { label: { en: 'About Us', ta: 'எங்களை பற்றி' }, href: '/about', variant: 'link', dataKey: 'global.menu.about' },
      { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects', variant: 'link', dataKey: 'global.menu.projects' },
      { label: { en: 'Ebooks', ta: 'மின்னூல்கள்' }, href: '/ebooks', variant: 'link', dataKey: 'global.menu.ebooks' },
      { label: { en: 'Book Store', ta: 'புத்தக அங்காடி' }, href: '/books', variant: 'link', dataKey: 'global.menu.bookstore' },
      { label: { en: 'Contact Us', ta: 'எங்களை தொடர்பு கொள்ள' }, href: '/contacts', variant: 'link', dataKey: 'global.menu.contact' },
      { label: { en: 'Notifications', ta: 'அறிவிப்புகள்' }, href: '/notifications', variant: 'neon', testId: 'notification-bell', isNotification: true },
      { label: { en: 'Login', ta: 'உள்நுழை' }, href: '/login', variant: 'glass', dataKey: 'global.menu.login' },
      { label: { en: 'Sign Up', ta: 'பதிவு செய்' }, href: '/sign', variant: 'neon', dataKey: 'global.menu.signup' }
    ],
    languageToggle: { enabled: true, languages: ['en', 'ta'], defaultLang: 'en' },
    hamburger: true
  };

  const footerContent = {
    logo: {
      image: {
        src: '/globe.svg',
        alt: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' }
      },
      text: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' }
    },
    description: {
      en: 'Dedicated to preserving and promoting the rich heritage of Tamil language and culture worldwide.',
      ta: 'தமிழ் மொழி மற்றும் பண்பாட்டின் செழுமையை உலகம் முழுவதும் பாதுகாக்கவும், மேம்படுத்தவும் அர்ப்பணிக்கப்பட்ட அமைப்பு.'
    },
    socialLinks: {
      facebookUrl: '#',
      twitterUrl: '#',
      instagramUrl: '#',
      youtubeUrl: '#'
    },
    quickLinks: {
      aboutLink: { text: { en: 'About Us', ta: 'எங்களை பற்றி' }, url: '/about' },
      projectsLink: { text: { en: 'Projects', ta: 'திட்டங்கள்' }, url: '/projects' },
      ebooksLink: { text: { en: 'Ebooks', ta: 'மின்னூல்கள்' }, url: '/ebooks' },
      bookstoreLink: { text: { en: 'Book Store', ta: 'புத்தக அங்காடி' }, url: '/books' }
    },
    supportLinks: {
      contactLink: { text: { en: 'Contact Us', ta: 'எங்களை தொடர்பு கொள்ள' }, url: '/contacts' },
      notificationsLink: { text: { en: 'Notifications', ta: 'அறிவிப்புகள்' }, url: '/notifications' }
    },
    newsletter: {
      title: { en: 'Newsletter', ta: 'செய்திமடல்' },
      description: { en: 'Stay updated with our latest news and events', ta: 'எங்கள் சமீபத்திய செய்திகள் மற்றும் நிகழ்வுகளை அறிந்து கொள்ளுங்கள்' },
      emailPlaceholder: { en: 'Enter your email', ta: 'உங்கள் மின்னஞ்சலை பதிவு செய்யவும்' },
      buttonIcon: 'fas fa-paper-plane'
    },
    copyright: {
      en: '© 2025 Tamil Language Society. All rights reserved.',
      ta: '© 2025 தமிழ் மொழி சங்கம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'
    }
  };

  for (const page of pages) {
    const navbarDoc = {
      type: 'navbar',
      page,
      content: navbarContent,
      order: 0,
      isActive: true,
      cssClasses: [],
      visibility: { desktop: true, tablet: true, mobile: true },
      animation: { type: 'none', duration: 300, delay: 0 },
      createdBy: admin._id
    };

    const footerDoc = {
      type: 'footer',
      page,
      content: footerContent,
      order: 4,
      isActive: true,
      cssClasses: [],
      visibility: { desktop: true, tablet: true, mobile: true },
      animation: { type: 'none', duration: 300, delay: 0 },
      createdBy: admin._id
    };

    await upsertComponent({ type: 'navbar', page }, navbarDoc);
    await upsertComponent({ type: 'footer', page }, footerDoc);
    console.log(`✅ Upserted navbar/footer for page: ${page}`);
  }

  await mongoose.connection.close();
  console.log('✅ Seeding completed and connection closed');
}

main().catch(async (err) => {
  console.error('❌ Failed to seed navbar/footer:', err);
  await mongoose.connection.close();
  process.exit(1);
});