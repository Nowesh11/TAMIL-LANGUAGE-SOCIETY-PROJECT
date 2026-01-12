import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkHomeComponents() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const components = db.collection('components');
    
    // Find all active components for home page
    const homeComponents = await components.find({ 
      page: 'home', 
      isActive: true 
    }).sort({ order: 1 }).toArray();
    
    console.log(`\nFound ${homeComponents.length} active components for home page:`);
    homeComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Page: ${comp.page}, Slug: ${comp.slug || 'N/A'}, Order: ${comp.order}`);
    });
    
    // Check if there are any components with wrong page assignment
    const wrongPageComponents = await components.find({ 
      page: { $ne: 'home' }, 
      isActive: true,
      $or: [
        { slug: { $regex: /home/i } },
        { 'content.title': { $regex: /home/i } }
      ]
    }).toArray();
    
    if (wrongPageComponents.length > 0) {
      console.log(`\nFound ${wrongPageComponents.length} components that might belong to home but have wrong page assignment:`);
      wrongPageComponents.forEach((comp, index) => {
        console.log(`${index + 1}. Type: ${comp.type}, Page: ${comp.page}, Slug: ${comp.slug || 'N/A'}`);
      });
    }
    
    // Check for any components that might be fetching from about page
    const aboutComponents = await components.find({ 
      page: 'about', 
      isActive: true 
    }).sort({ order: 1 }).toArray();
    
    console.log(`\nFound ${aboutComponents.length} active components for about page:`);
    aboutComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Page: ${comp.page}, Slug: ${comp.slug || 'N/A'}, Order: ${comp.order}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

checkHomeComponents();