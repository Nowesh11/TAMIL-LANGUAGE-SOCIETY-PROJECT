import mongoose from 'mongoose';
import '../src/models/Component';

const Component = mongoose.model('Component');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkGalleryMission() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find gallery components
    const galleryComponents = await Component.find({ type: 'gallery' });
    console.log(`\n📸 Found ${galleryComponents.length} gallery component(s):`);
    
    for (const component of galleryComponents) {
      console.log(`\n🔍 Gallery Component (${component.page}/${component.type}):`);
      console.log('ID:', component._id);
      console.log('Page:', component.page);
      console.log('Slug:', component.slug);
      console.log('Active:', component.isActive);
      console.log('Content structure:');
      console.log(JSON.stringify(component.content, null, 2));
    }

    // Find mission/text components with mission slug
    const missionComponents = await Component.find({ 
      type: 'text', 
      slug: 'mission' 
    });
    console.log(`\n📋 Found ${missionComponents.length} mission component(s):`);
    
    for (const component of missionComponents) {
      console.log(`\n🔍 Mission Component (${component.page}/${component.type}):`);
      console.log('ID:', component._id);
      console.log('Page:', component.page);
      console.log('Slug:', component.slug);
      console.log('Active:', component.isActive);
      console.log('Content structure:');
      console.log(JSON.stringify(component.content, null, 2));
    }

    // Check about page components
    const aboutComponents = await Component.find({ page: 'about' });
    console.log(`\n📄 Found ${aboutComponents.length} about page component(s):`);
    
    for (const component of aboutComponents) {
      console.log(`- ${component.type}/${component.slug || 'no-slug'} (Active: ${component.isActive})`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking gallery/mission:', error);
    process.exit(1);
  }
}

checkGalleryMission();