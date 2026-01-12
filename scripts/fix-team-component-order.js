const { MongoClient } = require('mongodb');

async function fixTeamComponentOrder() {
  const client = new MongoClient('mongodb://localhost:27017/tamil-language-society');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all about page components
    const components = await db.collection('components')
      .find({ page: 'about' })
      .sort({ order: 1 })
      .toArray();
    
    console.log('Current about page components:');
    components.forEach(c => {
      console.log(`${c.order}: ${c.slug} (${c.type})`);
    });
    
    // Find the team component
    const teamComponent = components.find(c => c.type === 'team');
    const timelineComponent = components.find(c => c.type === 'timeline');
    
    if (teamComponent && timelineComponent) {
      console.log(`\nTeam component current order: ${teamComponent.order}`);
      console.log(`Timeline component current order: ${timelineComponent.order}`);
      
      // Set team component to order 8 (before timeline at 9)
      const newOrder = 8;
      
      const result = await db.collection('components').updateOne(
        { _id: teamComponent._id },
        { $set: { order: newOrder } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully updated team component order to ${newOrder}`);
      } else {
        console.log('❌ Failed to update team component order');
      }
    }
    
    // Show updated components
    const updatedComponents = await db.collection('components')
      .find({ page: 'about' })
      .sort({ order: 1 })
      .toArray();
    
    console.log('\nUpdated about page components:');
    updatedComponents.forEach(c => {
      console.log(`${c.order}: ${c.slug} (${c.type})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixTeamComponentOrder();