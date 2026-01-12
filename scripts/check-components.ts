import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function checkComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    const count = await Component.countDocuments();
    console.log(`\n📊 Total components: ${count}/59`);

    const components = await Component.find({}, 'page type order').sort({page: 1, type: 1, order: 1});
    
    const byPage: Record<string, string[]> = {};
    components.forEach(c => {
      if (!byPage[c.page]) byPage[c.page] = [];
      byPage[c.page].push(c.type);
    });

    console.log('\n📋 Components by page:');
    Object.keys(byPage).forEach(page => {
      console.log(`  ${page}: ${byPage[page].length} components (${byPage[page].join(', ')})`);
    });

    // Check for missing common components
    const expectedPages = ['home', 'about', 'projects', 'books', 'ebooks', 'contacts', 'notifications', 'login', 'signup'];
    const expectedTypes = ['hero', 'features', 'stats', 'timeline', 'text', 'seo', 'navbar', 'footer'];
    
    console.log('\n🔍 Missing pages:');
    expectedPages.forEach(page => {
      if (!byPage[page]) {
        console.log(`  ❌ ${page} - no components found`);
      }
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking components:', error);
    process.exit(1);
  }
}

checkComponents();