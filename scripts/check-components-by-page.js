const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function checkComponents() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const components = await db.collection('components').find({}).sort({ page: 1, order: 1 }).toArray();
  
  console.log('=== COMPONENTS BY PAGE ===');
  const byPage = {};
  components.forEach(comp => {
    if (!byPage[comp.page]) byPage[comp.page] = [];
    byPage[comp.page].push({ 
      type: comp.type, 
      order: comp.order || 0, 
      id: comp._id.toString().slice(-6),
      slug: comp.slug || 'no-slug'
    });
  });
  
  Object.keys(byPage).sort().forEach(page => {
    console.log(`\n${page.toUpperCase()}:`);
    byPage[page].forEach(comp => {
      console.log(`  - ${comp.type} (order: ${comp.order}) [${comp.id}] ${comp.slug}`);
    });
  });
  
  console.log(`\nTotal components: ${components.length}`);
  await client.close();
}

checkComponents().catch(console.error);