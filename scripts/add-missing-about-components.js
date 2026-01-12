const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function addMissingAboutComponents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('components');
    
    // Check current about page components
    const currentComponents = await collection.find({ page: 'about' }).toArray();
    console.log(`\nCurrent about page components (${currentComponents.length}):`);
    currentComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug || 'N/A'}`);
    });
    
    const currentTypes = currentComponents.map(comp => comp.type);
    const currentSlugs = currentComponents.map(comp => comp.slug);
    
    // Define required components
    const requiredComponents = [
      {
        type: 'navbar',
        slug: 'about-navbar',
        order: 0,
        content: {
          title: { en: "About Us", ta: "எங்களைப் பற்றி" }
        }
      },
      {
        type: 'hero',
        slug: 'about-hero',
        order: 1,
        content: {
          title: { en: "About Tamil Language Society", ta: "தமிழ் மொழி சங்கம் பற்றி" },
          subtitle: { en: "Preserving and promoting Tamil heritage for future generations", ta: "எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்துதல்" }
        }
      },
      {
        type: 'text',
        slug: 'mission',
        order: 2,
        content: {
          title: { en: "Our Mission", ta: "எங்கள் நோக்கம்" },
          content: { en: "To preserve, promote and develop the Tamil language and culture through education, literature, and community engagement.", ta: "கல்வி, இலக்கியம் மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து, மேம்படுத்தி வளர்ப்பது." }
        }
      },
      {
        type: 'text',
        slug: 'vision',
        order: 3,
        content: {
          title: { en: "Our Vision", ta: "எங்கள் தொலைநோக்கு" },
          content: { en: "A world where Tamil language and culture thrive and continue to inspire future generations.", ta: "தமிழ் மொழி மற்றும் கலாச்சாரம் செழித்து, எதிர்கால சந்ததியினரை தொடர்ந்து ஊக்குவிக்கும் உலகம்." }
        }
      },
      {
        type: 'gallery',
        slug: 'our-history-gallery',
        order: 5,
        content: {
          title: { en: "Our History Gallery", ta: "எங்கள் வரலாற்று காட்சியகம்" },
          subtitle: { en: "Journey through our rich heritage", ta: "எங்கள் வளமான பாரம்பரியத்தின் பயணம்" }
        }
      },
      {
        type: 'text',
        slug: 'gallery-text',
        order: 6,
        content: {
          title: { en: "Heritage Preservation", ta: "பாரம்பரியப் பாதுகாப்பு" },
          content: { en: "Our gallery showcases the rich history and cultural heritage of the Tamil community.", ta: "எங்கள் காட்சியகம் தமிழ் சமூகத்தின் வளமான வரலாறு மற்றும் கலாச்சார பாரம்பரியத்தை வெளிப்படுத்துகிறது." }
        }
      },
      {
        type: 'timeline',
        slug: 'about-timeline',
        order: 7,
        content: {
          title: { en: "Our Journey", ta: "எங்கள் பயணம்" },
          subtitle: { en: "Milestones in our history", ta: "எங்கள் வரலாற்றின் மைல்கற்கள்" },
          events: [
            {
              year: "1970",
              title: { en: "Foundation", ta: "ஸ்தாபனம்" },
              description: { en: "Tamil Language Society was established", ta: "தமிழ் மொழி சங்கம் நிறுவப்பட்டது" }
            },
            {
              year: "1985",
              title: { en: "First Publication", ta: "முதல் வெளியீடு" },
              description: { en: "Published our first Tamil literature collection", ta: "எங்கள் முதல் தமிழ் இலக்கிய தொகுப்பை வெளியிட்டோம்" }
            },
            {
              year: "2000",
              title: { en: "Digital Era", ta: "டிஜிட்டல் யுகம்" },
              description: { en: "Launched digital initiatives for Tamil education", ta: "தமிழ் கல்விக்கான டிஜிட்டல் முயற்சிகளை தொடங்கினோம்" }
            }
          ]
        }
      },
      {
        type: 'text',
        slug: 'our-team',
        order: 8,
        content: {
          title: { en: "Our Team", ta: "எங்கள் குழு" },
          content: { en: "Dedicated individuals working together to preserve and promote Tamil heritage.", ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாத்து மேம்படுத்த ஒன்றாக பணியாற்றும் அர்ப்பணிப்புள்ள நபர்கள்." }
        }
      },
      {
        type: 'stats',
        slug: 'about-stats',
        order: 9,
        content: {
          title: { en: "Our Achievements", ta: "எங்கள் சாதனைகள்" },
          subtitle: { en: "Milestones in preserving Tamil culture", ta: "தமிழ் கலாச்சாரத்தைப் பாதுகாப்பதில் மைல்கற்கள்" },
          stats: [
            {
              number: "50+",
              label: { en: "Years of Service", ta: "சேவை ஆண்டுகள்" }
            },
            {
              number: "5000+",
              label: { en: "Community Members", ta: "சமூக உறுப்பினர்கள்" }
            },
            {
              number: "100+",
              label: { en: "Publications", ta: "வெளியீடுகள்" }
            },
            {
              number: "25+",
              label: { en: "Cultural Events", ta: "கலாச்சார நிகழ்வுகள்" }
            }
          ]
        }
      },
      {
        type: 'text',
        slug: 'join-our-mission',
        order: 10,
        content: {
          title: { en: "Join Our Mission", ta: "எங்கள் நோக்கத்தில் சேருங்கள்" },
          content: { en: "Be part of our journey to preserve and promote Tamil language and culture for future generations.", ta: "எதிர்கால சந்ததியினருக்காக தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து மேம்படுத்தும் எங்கள் பயணத்தில் பங்கேற்குங்கள்." }
        }
      }
    ];
    
    // Add missing components
    const componentsToAdd = [];
    
    for (const required of requiredComponents) {
      const exists = currentComponents.find(comp => 
        comp.type === required.type && comp.slug === required.slug
      );
      
      if (!exists) {
        componentsToAdd.push({
          ...required,
          page: 'about',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: new ObjectId('507f1f77bcf86cd799439011') // Default admin ID
        });
      }
    }
    
    if (componentsToAdd.length > 0) {
      console.log(`\n➕ Adding ${componentsToAdd.length} missing components:`);
      componentsToAdd.forEach((comp, index) => {
        console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug}`);
      });
      
      const result = await collection.insertMany(componentsToAdd);
      console.log(`✅ Added ${result.insertedCount} components to about page`);
    } else {
      console.log('\n✅ All required components already exist');
    }
    
    // Final check
    const finalComponents = await collection.find({ page: 'about' }).sort({ order: 1 }).toArray();
    console.log(`\n📋 Final about page components (${finalComponents.length}):`);
    finalComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug || 'N/A'}, Order: ${comp.order}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

addMissingAboutComponents();