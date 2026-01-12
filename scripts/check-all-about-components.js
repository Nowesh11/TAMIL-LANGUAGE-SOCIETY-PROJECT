const { MongoClient } = require('mongodb');

async function checkAllAboutComponents() {
  const client = new MongoClient('mongodb://localhost:27017/tamil-language-society');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check all components for ABOUT page
    const aboutComponents = await db.collection('components')
      .find({ page: 'ABOUT' })
      .sort({ order: 1 })
      .toArray();
    
    console.log('\n=== ABOUT page components ===');
    console.log(`Total components: ${aboutComponents.length}`);
    
    if (aboutComponents.length === 0) {
      console.log('❌ No components found for ABOUT page!');
    } else {
      aboutComponents.forEach(component => {
        console.log(`${component.order}: ${component.slug} (${component.type})`);
      });
    }
    
    // Check if there are components with different page values that might be relevant
    console.log('\n=== Checking for other page values ===');
    const allPages = await db.collection('components').distinct('page');
    console.log('Available pages:', allPages);
    
    // Check if there are any components with 'about' in lowercase
    const aboutLowercase = await db.collection('components')
      .find({ page: 'about' })
      .sort({ order: 1 })
      .toArray();
    
    if (aboutLowercase.length > 0) {
      console.log('\n=== Components with page "about" (lowercase) ===');
      aboutLowercase.forEach(component => {
        console.log(`${component.order}: ${component.slug} (${component.type})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkAllAboutComponents();