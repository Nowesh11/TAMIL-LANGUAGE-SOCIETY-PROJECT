import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Poster from '../src/models/Poster';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function seedPosters() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Ensure admin user exists
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      adminUser = await User.create({
        name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
        email: 'admin@tamilsociety.org',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      console.log('👤 Created admin user');
    }

    // Clear existing posters
    await Poster.deleteMany({});
    console.log('🧹 Cleared existing posters');

    const posters = [
      {
        title: {
          en: "Tamil Cultural Festival 2024",
          ta: "தமிழ் கலாச்சார விழா 2024"
        },
        description: {
          en: "Join us for a grand celebration of Tamil culture, featuring traditional music, dance, and cuisine.",
          ta: "பாரம்பரிய இசை, நடனம் மற்றும் உணவுகளுடன் தமிழ் கலாச்சாரத்தின் பெரும் கொண்டாட்டத்தில் எங்களுடன் சேருங்கள்."
        },
        category: "cultural",
        imagePath: "/posters/cultural-festival-2024.svg",
        isActive: true,
        isFeatured: true,
        order: 1,
        eventDate: new Date('2024-12-15'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Tamil Language Workshop",
          ta: "தமிழ் மொழி பயிலரங்கம்"
        },
        description: {
          en: "Learn Tamil language basics in our interactive workshop sessions for beginners.",
          ta: "ஆரம்பநிலையாளர்களுக்கான எங்கள் ஊடாடும் பயிலரங்க அமர்வுகளில் தமிழ் மொழியின் அடிப்படைகளைக் கற்றுக்கொள்ளுங்கள்."
        },
        category: "educational",
        imagePath: "/posters/language-workshop.svg",
        isActive: true,
        isFeatured: true,
        order: 2,
        eventDate: new Date('2024-11-20'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Poetry Competition 2024",
          ta: "கவிதை போட்டி 2024"
        },
        description: {
          en: "Showcase your Tamil poetry skills in our annual competition with exciting prizes.",
          ta: "உற்சாகமான பரிசுகளுடன் எங்கள் வருடாந்திர போட்டியில் உங்கள் தமிழ் கவிதை திறமைகளை வெளிப்படுத்துங்கள்."
        },
        category: "event",
        imagePath: "/posters/poetry-competition.svg",
        isActive: true,
        isFeatured: false,
        order: 3,
        eventDate: new Date('2024-10-30'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Traditional Dance Performance",
          ta: "பாரம்பரிய நடன நிகழ்ச்சி"
        },
        description: {
          en: "Experience the beauty of Tamil classical dance forms in our special performance evening.",
          ta: "எங்கள் சிறப்பு நிகழ்ச்சி மாலையில் தமிழ் பாரம்பரிய நடன வடிவங்களின் அழகை அனுபவியுங்கள்."
        },
        category: "cultural",
        imagePath: "/posters/dance-performance.svg",
        isActive: true,
        isFeatured: true,
        order: 4,
        eventDate: new Date('2024-11-10'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Book Launch: Tamil Literature",
          ta: "புத்தக வெளியீடு: தமிழ் இலக்கியம்"
        },
        description: {
          en: "Join us for the launch of our latest Tamil literature collection by renowned authors.",
          ta: "புகழ்பெற்ற எழுத்தாளர்களின் எங்கள் சமீபத்திய தமிழ் இலக்கிய தொகுப்பின் வெளியீட்டில் எங்களுடன் சேருங்கள்."
        },
        category: "announcement",
        imagePath: "/posters/book-launch.svg",
        isActive: true,
        isFeatured: false,
        order: 5,
        eventDate: new Date('2024-12-05'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Youth Tamil Forum",
          ta: "இளைஞர் தமிழ் மன்றம்"
        },
        description: {
          en: "A platform for young Tamil speakers to connect, learn, and grow together.",
          ta: "இளம் தமிழ் பேசுபவர்கள் ஒன்றிணைந்து, கற்றுக்கொண்டு, ஒன்றாக வளர ஒரு தளம்."
        },
        category: "social",
        imagePath: "/posters/youth-forum.svg",
        isActive: true,
        isFeatured: true,
        order: 6,
        eventDate: new Date('2024-11-25'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Tamil Cooking Class",
          ta: "தமிழ் சமையல் வகுப்பு"
        },
        description: {
          en: "Learn to cook authentic Tamil dishes with our expert chefs and traditional recipes.",
          ta: "எங்கள் நிபுணர் சமையல்காரர்கள் மற்றும் பாரம்பரிய சமையல் குறிப்புகளுடன் உண்மையான தமிழ் உணவுகளை சமைக்க கற்றுக்கொள்ளுங்கள்."
        },
        category: "educational",
        imagePath: "/posters/cooking-class.svg",
        isActive: true,
        isFeatured: false,
        order: 7,
        eventDate: new Date('2024-12-01'),
        createdBy: adminUser._id
      },
      {
        title: {
          en: "Tamil Music Concert",
          ta: "தமிழ் இசை நிகழ்ச்சி"
        },
        description: {
          en: "An evening of melodious Tamil music featuring classical and contemporary artists.",
          ta: "பாரம்பரிய மற்றும் சமகால கலைஞர்களைக் கொண்ட இனிமையான தமிழ் இசையின் மாலை."
        },
        category: "cultural",
        imagePath: "/posters/music-concert.svg",
        isActive: true,
        isFeatured: true,
        order: 8,
        eventDate: new Date('2024-12-20'),
        createdBy: adminUser._id
      }
    ];

    // Insert posters
    const insertedPosters = await Poster.insertMany(posters);
    console.log(`✅ Seeded ${insertedPosters.length} posters`);

    // Display summary
    console.log('\n📊 Poster Summary:');
    console.log(`- Total posters: ${insertedPosters.length}`);
    console.log(`- Featured posters: ${insertedPosters.filter(p => p.isFeatured).length}`);
    console.log(`- Active posters: ${insertedPosters.filter(p => p.isActive).length}`);
    
    const categories = [...new Set(insertedPosters.map(p => p.category))];
    console.log(`- Categories: ${categories.join(', ')}`);

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding posters:', error);
    process.exit(1);
  }
}

seedPosters();