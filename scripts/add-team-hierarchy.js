const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addTeamHierarchyComponent() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('components');
    
    // Check if team-hierarchy component already exists
    const existingComponent = await collection.findOne({ 
      page: 'about', 
      type: 'team-hierarchy' 
    });
    
    if (existingComponent) {
      console.log('✅ Team hierarchy component already exists');
      return;
    }
    
    // Create the team-hierarchy component
    const teamHierarchyComponent = {
      type: 'team-hierarchy',
      page: 'about',
      content: {
        title: {
          en: "Our Team",
          ta: "எங்கள் குழு"
        },
        subtitle: {
          en: "Meet the dedicated members of Tamil Language Society",
          ta: "தமிழ் மொழி சங்கத்தின் அர்ப்பணிப்புள்ள உறுப்பினர்களை சந்திக்கவும்"
        }
      },
      order: 6,
      isActive: true,
      bureau: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: new ObjectId('507f1f77bcf86cd799439011') // Default admin ID
    };
    
    const result = await collection.insertOne(teamHierarchyComponent);
    console.log(`✅ Added team-hierarchy component with ID: ${result.insertedId}`);
    
    // Verify the component was added
    const verification = await collection.findOne({ _id: result.insertedId });
    console.log('📋 Component details:');
    console.log(`- Type: ${verification.type}`);
    console.log(`- Page: ${verification.page}`);
    console.log(`- Order: ${verification.order}`);
    console.log(`- Active: ${verification.isActive}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

addTeamHierarchyComponent();