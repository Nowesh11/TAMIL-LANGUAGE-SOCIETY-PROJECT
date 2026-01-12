import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkAboutComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    console.log(`📋 Found ${aboutComponents.length} about page components:`);
    
    aboutComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug || 'no-slug'}, Active: ${comp.isActive}`);
    });
    
    // Check for footer components specifically
    const footerComponents = aboutComponents.filter(c => c.type === 'footer');
    console.log(`\n🦶 Found ${footerComponents.length} footer component(s) on about page:`);
    footerComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Slug: ${comp.slug || 'no-slug'}, Active: ${comp.isActive}`);
    });
    
    // Check for gallery components
    const galleryComponents = aboutComponents.filter(c => c.type === 'gallery');
    console.log(`\n🖼️ Found ${galleryComponents.length} gallery component(s) on about page:`);
    galleryComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Slug: ${comp.slug || 'no-slug'}, Active: ${comp.isActive}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error checking about components:', error);
    process.exit(1);
  }
}

checkAboutComponents();