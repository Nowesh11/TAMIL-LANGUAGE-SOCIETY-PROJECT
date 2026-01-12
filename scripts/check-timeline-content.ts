import mongoose from 'mongoose';
import '../src/models/Component';

const Component = mongoose.model('Component');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkTimelineContent() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all timeline components
    const timelineComponents = await Component.find({ type: 'timeline' });
    
    console.log(`\n📊 Found ${timelineComponents.length} timeline component(s):`);
    
    for (const component of timelineComponents) {
      console.log(`\n🔍 Timeline Component (${component.page}/${component.type}):`);
      console.log('ID:', component._id);
      console.log('Page:', component.page);
      console.log('Content structure:');
      console.log(JSON.stringify(component.content, null, 2));
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking timeline content:', error);
    process.exit(1);
  }
}

checkTimelineContent();