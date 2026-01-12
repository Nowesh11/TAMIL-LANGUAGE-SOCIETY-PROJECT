const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function cleanupDuplicates() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log('=== CLEANING UP COMPONENT DUPLICATES ===');
  
  // Get all components
  const components = await db.collection('components').find({}).toArray();
  
  // Group by page and type
  const grouped = {};
  components.forEach(comp => {
    const key = `${comp.page}-${comp.type}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(comp);
  });
  
  let removedCount = 0;
  let updatedCount = 0;
  
  // Process each group
  for (const [key, comps] of Object.entries(grouped)) {
    if (comps.length > 1) {
      console.log(`\nFound ${comps.length} duplicates for ${key}:`);
      
      // Sort by creation date (assuming ObjectId contains timestamp)
      comps.sort((a, b) => a._id.toString().localeCompare(b._id.toString()));
      
      // Keep the first one (oldest), remove the rest
      const toKeep = comps[0];
      const toRemove = comps.slice(1);
      
      console.log(`  Keeping: ${toKeep._id} (order: ${toKeep.order || 0})`);
      
      for (const comp of toRemove) {
        console.log(`  Removing: ${comp._id} (order: ${comp.order || 0})`);
        await db.collection('components').deleteOne({ _id: comp._id });
        removedCount++;
      }
    }
  }
  
  // Fix ordering issues - ensure proper order values
  const orderFixes = {
    'seo': 0,
    'navbar': 1,
    'hero': 2,
    'banner': 3,
    'features': 4,
    'stats': 5,
    'gallery': 6,
    'text': 7,
    'cta': 8,
    'timeline': 9,
    'poster': 10,
    'faq': 11,
    'contact-form': 12,
    'newsletter': 13,
    'footer': 100
  };
  
  console.log('\n=== FIXING COMPONENT ORDERING ===');
  
  const remainingComponents = await db.collection('components').find({}).toArray();
  
  for (const comp of remainingComponents) {
    const expectedOrder = orderFixes[comp.type];
    if (expectedOrder !== undefined && comp.order !== expectedOrder) {
      console.log(`Updating ${comp.page}-${comp.type}: order ${comp.order || 0} -> ${expectedOrder}`);
      await db.collection('components').updateOne(
        { _id: comp._id },
        { $set: { order: expectedOrder } }
      );
      updatedCount++;
    }
  }
  
  console.log(`\n=== CLEANUP COMPLETE ===`);
  console.log(`Removed ${removedCount} duplicate components`);
  console.log(`Updated ${updatedCount} component orders`);
  
  await client.close();
}

cleanupDuplicates().catch(console.error);