import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function verify() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const navbarComponents = await Component.find({ type: 'navbar' }).sort({ page: 1 });
    console.log('📋 Current navbar components:');
    navbarComponents.forEach(comp => {
      console.log(`  Page: ${comp.page}, Order: ${comp.order}`);
    });
    
    // Check menu links in content
    const sampleNavbar = navbarComponents[0];
    if (sampleNavbar && sampleNavbar.content && sampleNavbar.content.menu) {
      console.log('\n🔗 Menu links:');
      sampleNavbar.content.menu.forEach(item => {
        console.log(`  ${item.label}: ${item.href}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Verification completed');
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

verify();