const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function checkExistingData() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log('=== CHECKING EXISTING DATABASE DATA ===\n');
  
  // Check components collection
  const componentsCount = await db.collection('components').countDocuments();
  console.log('📊 Components Collection:', componentsCount, 'documents');
  
  if (componentsCount > 0) {
    const componentsByPage = await db.collection('components').aggregate([
      { $group: { _id: '$page', count: { $sum: 1 }, types: { $addToSet: '$type' } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    componentsByPage.forEach(page => {
      console.log('  📄', page._id + ':', page.count, 'components -', page.types.join(', '));
    });
  }
  
  // Check teams collection
  const teamsCount = await db.collection('teams').countDocuments();
  console.log('\n👥 Teams Collection:', teamsCount, 'documents');
  
  if (teamsCount > 0) {
    const teamsByRole = await db.collection('teams').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    teamsByRole.forEach(role => {
      console.log('  👤', role._id + ':', role.count, 'members');
    });
  }
  
  // Check posters collection
  const postersCount = await db.collection('posters').countDocuments();
  console.log('\n🖼️  Posters Collection:', postersCount, 'documents');
  
  if (postersCount > 0) {
    const postersByStatus = await db.collection('posters').aggregate([
      { $group: { _id: '$isActive', count: { $sum: 1 } } }
    ]).toArray();
    
    postersByStatus.forEach(status => {
      console.log('  📌', (status._id ? 'Active' : 'Inactive') + ':', status.count, 'posters');
    });
  }
  
  // Check books collection
  const booksCount = await db.collection('books').countDocuments();
  console.log('\n📚 Books Collection:', booksCount, 'documents');
  
  // Check ebooks collection
  const ebooksCount = await db.collection('ebooks').countDocuments();
  console.log('📖 Ebooks Collection:', ebooksCount, 'documents');
  
  // Check project items collection
  const projectItemsCount = await db.collection('projectitems').countDocuments();
  console.log('🚀 Project Items Collection:', projectItemsCount, 'documents');
  
  // Check notifications collection
  const notificationsCount = await db.collection('notifications').countDocuments();
  console.log('📢 Notifications Collection:', notificationsCount, 'documents');
  
  await client.close();
}

checkExistingData().catch(console.error);