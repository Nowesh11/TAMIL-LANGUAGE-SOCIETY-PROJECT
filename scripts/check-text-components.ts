import mongoose from 'mongoose';
import '../src/models/Component';

const Component = mongoose.model('Component');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkTextComponents() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all text components
    const textComponents = await Component.find({ type: 'text' });
    console.log(`\n📝 Found ${textComponents.length} text component(s):`);
    
    for (const component of textComponents) {
      console.log(`\n🔍 Text Component (${component.page}/${component.slug}):`);
      console.log('ID:', component._id);
      console.log('Page:', component.page);
      console.log('Slug:', component.slug);
      console.log('Active:', component.isActive);
      console.log('Content preview:');
      if (component.content.title) {
        console.log('Title:', component.content.title);
      }
      if (component.content.content) {
        const contentPreview = typeof component.content.content === 'string' 
          ? component.content.content.substring(0, 100) + '...'
          : JSON.stringify(component.content.content).substring(0, 100) + '...';
        console.log('Content preview:', contentPreview);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking text components:', error);
    process.exit(1);
  }
}

checkTextComponents();