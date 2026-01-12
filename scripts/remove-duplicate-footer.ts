import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function removeDuplicateFooter() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Find the duplicate footer component on about page
    const duplicateFooter = await Component.findOne({ 
      page: 'about', 
      type: 'footer',
      slug: 'about-footer'
    });
    
    if (duplicateFooter) {
      console.log(`🗑️ Found duplicate footer component: ${duplicateFooter.slug}`);
      await Component.deleteOne({ _id: duplicateFooter._id });
      console.log('✅ Duplicate footer component removed successfully');
    } else {
      console.log('ℹ️ No duplicate footer component found');
    }
    
    // Verify remaining components
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    console.log(`\n📋 Remaining about page components (${aboutComponents.length}):`);
    aboutComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug || 'no-slug'}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Operation completed');
  } catch (error) {
    console.error('❌ Error removing duplicate footer:', error);
    process.exit(1);
  }
}

removeDuplicateFooter();