const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/tamil-language-society';

async function addTeamComponent() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const componentsCollection = db.collection('components');
    
    // First, check if team component already exists for ABOUT page
    const existingTeam = await componentsCollection.findOne({
      page: 'ABOUT',
      slug: 'our-team'
    });
    
    if (existingTeam) {
      console.log('Team component already exists for ABOUT page');
      return;
    }
    
    // Get the current join mission component to position team before it
    const joinMissionComponent = await componentsCollection.findOne({
      page: 'ABOUT',
      slug: 'join-our-mission'
    });
    
    let teamOrder = 9; // Default order
    if (joinMissionComponent) {
      teamOrder = joinMissionComponent.order - 1;
      console.log(`Positioning team component at order ${teamOrder}, before join mission at order ${joinMissionComponent.order}`);
      
      // Update all components with order >= teamOrder to increment their order
      await componentsCollection.updateMany(
        { 
          page: 'ABOUT',
          order: { $gte: teamOrder }
        },
        { 
          $inc: { order: 1 }
        }
      );
      console.log('Updated existing component orders');
    }
    
    // Create the team component
    const teamComponent = {
      type: 'team',
      slug: 'our-team',
      page: 'ABOUT',
      order: teamOrder,
      isActive: true,
      content: {
        title: { 
          en: "Meet Our Team", 
          ta: "எங்கள் குழுவை சந்திக்கவும்" 
        },
        subtitle: { 
          en: "Dedicated individuals working together to preserve and promote Tamil heritage", 
          ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்த ஒன்றாக பணியாற்றும் அர்ப்பணிப்புள்ள நபர்கள்" 
        },
        limit: 6
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the team component
    const result = await componentsCollection.insertOne(teamComponent);
    console.log('Team component added successfully:', result.insertedId);
    
    // Verify the component order
    const allComponents = await componentsCollection.find({ page: 'ABOUT' })
      .sort({ order: 1 })
      .toArray();
    
    console.log('\nCurrent ABOUT page component order:');
    allComponents.forEach(comp => {
      console.log(`${comp.order}: ${comp.slug} (${comp.type})`);
    });
    
  } catch (error) {
    console.error('Error adding team component:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

addTeamComponent().catch(console.error);