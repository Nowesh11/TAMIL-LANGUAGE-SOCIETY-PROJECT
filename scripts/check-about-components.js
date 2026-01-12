const { MongoClient } = require('mongodb');

async function checkAboutComponents() {
  const client = new MongoClient('mongodb://localhost:27017/tamil-language-society');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const components = await db.collection('components')
      .find({ page: 'ABOUT' })
      .sort({ order: 1 })
      .toArray();
    
    console.log('\nABOUT page components:');
    console.log('======================');
    
    components.forEach(component => {
      console.log(`${component.order}: ${component.slug} (${component.type})`);
    });
    
    // Check if team component exists
    const teamComponent = components.find(c => c.type === 'team');
    if (teamComponent) {
      console.log('\n✅ Team component found!');
      console.log(`   Order: ${teamComponent.order}`);
      console.log(`   Slug: ${teamComponent.slug}`);
      console.log(`   Type: ${teamComponent.type}`);
    } else {
      console.log('\n❌ Team component not found!');
    }
    
    // Check if it's before join mission component
    const joinMissionComponent = components.find(c => c.slug === 'join-our-mission');
    if (teamComponent && joinMissionComponent) {
      if (teamComponent.order < joinMissionComponent.order) {
        console.log(`✅ Team component (${teamComponent.order}) appears before join mission (${joinMissionComponent.order})`);
      } else {
        console.log(`❌ Team component (${teamComponent.order}) appears after join mission (${joinMissionComponent.order})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAboutComponents();