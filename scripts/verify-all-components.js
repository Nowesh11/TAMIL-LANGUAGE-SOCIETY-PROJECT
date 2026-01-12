import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function verifyAllComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const pages = ['home', 'about', 'projects', 'ebooks', 'books', 'contacts', 'login', 'sign', 'notifications'];
    
    for (const page of pages) {
      const components = await Component.find({ page }).sort({ order: 1 });
      console.log(`\n📋 ${page.toUpperCase()} page components (${components.length}):`);
      components.forEach(comp => {
        console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Verification completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyAllComponents();