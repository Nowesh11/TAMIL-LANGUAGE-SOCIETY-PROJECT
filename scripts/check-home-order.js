const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function checkHomeOrder() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const components = await db.collection('components').find({ page: 'home', isActive: true }).sort({ order: 1 }).toArray();
  console.log('Home page components order:');
  components.forEach(c => {
    console.log(`Order ${c.order}: ${c.type} (${c.slug || 'no-slug'})`);
  });
  await client.close();
}

checkHomeOrder().catch(console.error);