const { MongoClient } = require('mongodb');

async function fixTeamComponentPage() {
  const client = new MongoClient('mongodb://localhost:27017/tamil-language-society');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Find the team component with page 'ABOUT'
    const teamComponent = await db.collection('components').findOne({
      type: 'team',
      page: 'ABOUT'
    });
    
    if (teamComponent) {
      console.log('Found team component with page "ABOUT"');
      console.log(`Current order: ${teamComponent.order}`);
      
      // Update the page value to 'about' (lowercase)
      const result = await db.collection('components').updateOne(
        { _id: teamComponent._id },
        { $set: { page: 'about' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully updated team component page to "about"');
      } else {
        console.log('❌ Failed to update team component page');
      }
    } else {
      console.log('❌ Team component with page "ABOUT" not found');
    }
    
    // Verify the update
    const updatedComponent = await db.collection('components').findOne({
      type: 'team',
      page: 'about'
    });
    
    if (updatedComponent) {
      console.log('✅ Verification: Team component now has page "about"');
      console.log(`Order: ${updatedComponent.order}, Slug: ${updatedComponent.slug}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixTeamComponentPage();