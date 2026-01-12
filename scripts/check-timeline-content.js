const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/tamil-language-society';

async function checkTimelineContent() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    
    // Find all timeline components
    const timelineComponents = await db.collection('components').find({ type: 'timeline' }).toArray();
    
    console.log(`\n📊 Found ${timelineComponents.length} timeline component(s):`);
    
    for (const component of timelineComponents) {
      console.log(`\n🔍 Timeline Component (${component.page}/${component.type}):`);
      console.log('ID:', component._id);
      console.log('Page:', component.page);
      console.log('Order:', component.order);
      console.log('Active:', component.isActive);
      console.log('Content structure:');
      console.log(JSON.stringify(component.content, null, 2));
    }

    await client.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking timeline content:', error);
    process.exit(1);
  }
}

checkTimelineContent();