#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Import all models
import User from '../src/models/User';
import Book from '../src/models/Book';
import EBook from '../src/models/EBook';
import Team from '../src/models/Team';
import ProjectItem from '../src/models/ProjectItem';
import Poster from '../src/models/Poster';
import Component from '../src/models/Component';
import Purchase from '../src/models/Purchase';
import RecruitmentForm from '../src/models/RecruitmentForm';
import PaymentSettings from '../src/models/PaymentSettings';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection function
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

// Reset all collections function
async function resetAllCollections() {
  console.log('🗑️ Resetting all collections...');
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }
  
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    const collectionName = collection.name;
    console.log(`   Dropping collection: ${collectionName}`);
    await db.dropCollection(collectionName);
  }
  console.log('✅ All collections reset successfully!');
}

async function resetAndSeedDatabase() {
  try {
    console.log('🔄 Starting comprehensive database reset and seed...\n');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    
    // Step 1: Reset all collections
    console.log('🗑️ Resetting all collections...');
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`   Dropping collection: ${collectionName}`);
      await db.dropCollection(collectionName);
    }
    console.log('✅ All collections reset successfully!\n');

    // Step 2: Create admin user first
    console.log('👤 Creating admin user...');
    const adminUser = await User.create({
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      email: 'admin@tamilsociety.org',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      preferences: {
        language: 'en',
        notifications: true,
        theme: 'light'
      }
    });
    console.log('✅ Admin user created\n');

    // Step 3: Seed Components for all pages
    console.log('🧩 Seeding page components...');
    await seedAllPageComponents(adminUser._id);
    console.log('✅ All page components seeded\n');

    // Step 4: Seed Posters
    console.log('🖼️ Seeding posters...');
    await seedPosters(adminUser._id);
    console.log('✅ Posters seeded\n');

    // Step 5: Seed Team members
    console.log('👥 Seeding team members...');
    await seedTeamMembers(adminUser._id);
    console.log('✅ Team members seeded\n');

    // Step 6: Seed Project Items
    console.log('📋 Seeding project items...');
    await seedProjectItems(adminUser._id);
    console.log('✅ Project items seeded\n');

    // Step 7: Seed Books
    console.log('📚 Seeding books...');
    await seedBooks(adminUser._id);
    console.log('✅ Books seeded\n');

    // Step 8: Seed EBooks
    console.log('📱 Seeding ebooks...');
    await seedEBooks(adminUser._id);
    console.log('✅ EBooks seeded\n');

    // Step 9: Seed Recruitment Forms
    console.log('📝 Seeding recruitment forms...');
    await seedRecruitmentForms(adminUser._id);
    console.log('✅ Recruitment forms seeded\n');

    // Step 10: Seed Payment Settings
    console.log('💳 Seeding payment settings...');
    await seedPaymentSettings(adminUser._id);
    console.log('✅ Payment settings seeded\n');

    console.log('🎉 Comprehensive database reset and seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Reset and seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

async function seedAllPageComponents(adminId: any) {
  const components = [
    // HOME PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'home',
      slug: 'home-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'hero',
      page: 'home',
      slug: 'home-hero',
      order: 2,
      isActive: true,
      content: {
        title: { 
          en: 'Preserving Tamil Heritage for Future Generations', 
          ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' 
        },
        subtitle: { 
          en: 'Join us in celebrating and promoting Tamil language, literature, and culture through education, community engagement, and digital innovation.', 
          ta: 'கல்வி, சமூக ஈடுபாடு மற்றும் டிஜிட்டல் புதுமையின் மூலம் தமிழ் மொழி, இலக்கியம் மற்றும் கலாச்சாரத்தைக் கொண்டாடுவதிலும் ஊக்குவிப்பதிலும் எங்களுடன் சேருங்கள்.' 
        },
        buttons: [
          { text: { en: 'Explore Our Work', ta: 'எங்கள் பணியை ஆராயுங்கள்' }, href: '/about', variant: 'primary' },
          { text: { en: 'Join Community', ta: 'சமூகத்தில் சேருங்கள்' }, href: '/contacts', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/images/hero-bg-1.jpg', alt: { en: 'Tamil heritage background', ta: 'தமிழ் பாரம்பரிய பின்னணி' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'features',
      page: 'home',
      slug: 'home-features',
      order: 4,
      isActive: true,
      content: {
        title: { en: 'Our Core Services', ta: 'எங்கள் முக்கிய சேவைகள்' },
        subtitle: { en: 'Comprehensive programs to preserve and promote Tamil culture', ta: 'தமிழ் கலாச்சாரத்தைப் பாதுகாக்க மற்றும் ஊக்குவிக்க விரிவான திட்டங்கள்' },
        features: [
          {
            title: { en: 'Educational Programs', ta: 'கல்வித் திட்டங்கள்' },
            description: { en: 'Comprehensive Tamil language courses and cultural education', ta: 'விரிவான தமிழ் மொழி பாடநெறிகள் மற்றும் கலாச்சார கல்வி' },
            icon: 'BookOpen'
          },
          {
            title: { en: 'Digital Library', ta: 'டிஜிட்டல் நூலகம்' },
            description: { en: 'Extensive collection of Tamil books and e-books', ta: 'தமிழ் புத்தகங்கள் மற்றும் மின்னூல்களின் விரிவான தொகுப்பு' },
            icon: 'Library'
          },
          {
            title: { en: 'Community Events', ta: 'சமூக நிகழ்வுகள்' },
            description: { en: 'Cultural festivals and community gatherings', ta: 'கலாச்சார திருவிழாக்கள் மற்றும் சமூக கூட்டங்கள்' },
            icon: 'Users'
          }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'timeline',
      page: 'home',
      slug: 'home-timeline',
      order: 5,
      isActive: true,
      content: {
        title: { en: 'Our Journey Through Time', ta: 'காலத்தின் வழியாக எங்கள் பயணம்' },
        subtitle: { en: 'Milestones in preserving and promoting Tamil culture', ta: 'தமிழ் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவிப்பதில் மைல்கற்கள்' },
        events: [
          {
            year: '1970',
            title: { en: 'Foundation', ta: 'அடித்தளம்' },
            description: { en: 'Tamil Language Society was established with a vision to preserve Tamil heritage', ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாக்கும் நோக்கத்துடன் தமிழ் மொழி சங்கம் நிறுவப்பட்டது' }
          },
          {
            year: '1985',
            title: { en: 'First Publication', ta: 'முதல் வெளியீடு' },
            description: { en: 'Published our first collection of Tamil literature', ta: 'தமிழ் இலக்கியத்தின் எங்கள் முதல் தொகுப்பை வெளியிட்டோம்' }
          },
          {
            year: '2000',
            title: { en: 'Digital Initiative', ta: 'டிஜிட்டல் முன்முயற்சி' },
            description: { en: 'Launched our digital library and online resources', ta: 'எங்கள் டிஜிட்டல் நூலகம் மற்றும் ஆன்லைன் வளங்களை அறிமுகப்படுத்தினோம்' }
          },
          {
            year: '2020',
            title: { en: 'Global Expansion', ta: 'உலகளாவிய விரிவாக்கம்' },
            description: { en: 'Extended our reach to Tamil communities worldwide', ta: 'உலகளவில் தமிழ் சமூகங்களுக்கு எங்கள் வரவை விரிவுபடுத்தினோம்' }
          }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'stats',
      page: 'home',
      slug: 'home-stats',
      order: 6,
      isActive: true,
      content: {
        title: { en: 'Our Impact in Numbers', ta: 'எண்களில் எங்கள் தாக்கம்' },
        subtitle: { en: 'Achievements in preserving Tamil heritage', ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாப்பதில் சாதனைகள்' },
        stats: [
          {
            number: '50+',
            label: { en: 'Years of Service', ta: 'சேவை ஆண்டுகள்' },
            description: { en: 'Preserving Tamil heritage', ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' }
          },
          {
            number: '10,000+',
            label: { en: 'Community Members', ta: 'சமூக உறுப்பினர்கள்' },
            description: { en: 'Active participants worldwide', ta: 'உலகளவில் செயலில் பங்கேற்பாளர்கள்' }
          },
          {
            number: '500+',
            label: { en: 'Cultural Events', ta: 'கலாச்சார நிகழ்வுகள்' },
            description: { en: 'Organized annually', ta: 'ஆண்டுதோறும் ஏற்பாடு செய்யப்படுகிறது' }
          },
          {
            number: '1,000+',
            label: { en: 'Books Published', ta: 'வெளியிடப்பட்ட புத்தகங்கள்' },
            description: { en: 'Tamil literature and educational content', ta: 'தமிழ் இலக்கியம் மற்றும் கல்வி உள்ளடக்கம்' }
          }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'footer',
      page: 'home',
      slug: 'home-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ],
        socialMedia: [
          { platform: 'facebook', url: 'https://facebook.com/tamilsociety' },
          { platform: 'twitter', url: 'https://twitter.com/tamilsociety' },
          { platform: 'instagram', url: 'https://instagram.com/tamilsociety' }
        ]
      },
      createdBy: adminId
    },

    // ABOUT PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'about',
      slug: 'about-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'hero',
      page: 'about',
      slug: 'about-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'About Tamil Language Society', ta: 'தமிழ் மொழி சங்கம் பற்றி' },
        subtitle: { en: 'Dedicated to preserving and promoting Tamil language and culture for over 50 years', ta: '50 ஆண்டுகளுக்கும் மேலாக தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவிப்பதில் அர்ப்பணிப்பு' },
        buttons: [
          { text: { en: 'Our Mission', ta: 'எங்கள் பணி' }, href: '#mission', variant: 'primary' },
          { text: { en: 'Join Us', ta: 'எங்களுடன் சேருங்கள்' }, href: '/contacts', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/images/about-hero-bg.jpg', alt: { en: 'About us background', ta: 'எங்களைப் பற்றி பின்னணி' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'vision',
      page: 'about',
      slug: 'about-vision',
      order: 3,
      isActive: true,
      content: {
        title: { en: 'Our Vision', ta: 'எங்கள் நோக்கம்' },
        content: { 
          en: 'To be the leading organization in preserving, promoting, and advancing Tamil language and culture globally, ensuring its rich heritage continues to thrive for future generations.',
          ta: 'உலகளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்தல், ஊக்குவித்தல் மற்றும் முன்னேற்றுவதில் முன்னணி அமைப்பாக இருப்பது, அதன் வளமான பாரம்பரியம் எதிர்கால சந்ததியினருக்கு தொடர்ந்து செழிக்க உறுதி செய்வது.'
        },
        image: { src: '/images/vision.jpg', alt: { en: 'Our vision', ta: 'எங்கள் நோக்கம்' } }
      },
      createdBy: adminId
    },
    {
      type: 'mission',
      page: 'about',
      slug: 'about-mission',
      order: 4,
      isActive: true,
      content: {
        title: { en: 'Our Mission', ta: 'எங்கள் பணி' },
        content: { 
          en: 'To create educational opportunities, foster literary excellence, and build bridges between Tamil communities worldwide through innovative programs, digital initiatives, and cultural preservation efforts.',
          ta: 'புதுமையான திட்டங்கள், டிஜிட்டல் முன்முயற்சிகள் மற்றும் கலாச்சார பாதுகாப்பு முயற்சிகளின் மூலம் கல்வி வாய்ப்புகளை உருவாக்குதல், இலக்கிய சிறப்பை வளர்த்தல் மற்றும் உலகளவில் தமிழ் சமூகங்களுக்கிடையே பாலங்களை கட்டுதல்.'
        },
        image: { src: '/images/mission.jpg', alt: { en: 'Our mission', ta: 'எங்கள் பணி' } }
      },
      createdBy: adminId
    },
    {
      type: 'timeline',
      page: 'about',
      slug: 'about-timeline',
      order: 5,
      isActive: true,
      content: {
        title: { en: 'Our History', ta: 'எங்கள் வரலாறு' },
        subtitle: { en: 'Key milestones in our journey', ta: 'எங்கள் பயணத்தில் முக்கிய மைல்கற்கள்' },
        events: [
          {
            year: '1970',
            title: { en: 'Foundation', ta: 'அடித்தளம்' },
            description: { en: 'Tamil Language Society was established by a group of Tamil scholars and community leaders', ta: 'தமிழ் அறிஞர்கள் மற்றும் சமூகத் தலைவர்களின் குழுவால் தமிழ் மொழி சங்கம் நிறுவப்பட்டது' }
          },
          {
            year: '1975',
            title: { en: 'First Cultural Festival', ta: 'முதல் கலாச்சார திருவிழா' },
            description: { en: 'Organized our first annual Tamil cultural festival', ta: 'எங்கள் முதல் வருடாந்திர தமிழ் கலாச்சார திருவிழாவை ஏற்பாடு செய்தோம்' }
          },
          {
            year: '1985',
            title: { en: 'Publishing House', ta: 'பதிப்பகம்' },
            description: { en: 'Established our publishing division for Tamil literature', ta: 'தமிழ் இலக்கியத்திற்காக எங்கள் பதிப்பு பிரிவை நிறுவினோம்' }
          },
          {
            year: '2000',
            title: { en: 'Digital Revolution', ta: 'டிஜிட்டல் புரட்சி' },
            description: { en: 'Launched our digital library and online learning platform', ta: 'எங்கள் டிஜிட்டல் நூலகம் மற்றும் ஆன்லைன் கற்றல் தளத்தை அறிமுகப்படுத்தினோம்' }
          },
          {
            year: '2020',
            title: { en: 'Global Network', ta: 'உலகளாவிய வலையமைப்பு' },
            description: { en: 'Expanded to serve Tamil communities in 25+ countries', ta: '25+ நாடுகளில் தமிழ் சமூகங்களுக்கு சேவை செய்ய விரிவுபடுத்தினோம்' }
          }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'gallery',
      page: 'about',
      slug: 'about-gallery',
      order: 6,
      isActive: true,
      content: {
        title: { en: 'Our Gallery', ta: 'எங்கள் காட்சியகம்' },
        subtitle: { en: 'Moments from our journey', ta: 'எங்கள் பயணத்தின் தருணங்கள்' },
        images: [
          { src: '/images/gallery-1.jpg', alt: { en: 'Cultural event', ta: 'கலாச்சார நிகழ்வு' }, caption: { en: 'Annual cultural festival', ta: 'வருடாந்திர கலாச்சார திருவிழா' } },
          { src: '/images/gallery-2.jpg', alt: { en: 'Book launch', ta: 'புத்தக வெளியீடு' }, caption: { en: 'Book launch ceremony', ta: 'புத்தக வெளியீட்டு விழா' } },
          { src: '/images/gallery-3.jpg', alt: { en: 'Educational program', ta: 'கல்வித் திட்டம்' }, caption: { en: 'Tamil language class', ta: 'தமிழ் மொழி வகுப்பு' } },
          { src: '/images/gallery-4.jpg', alt: { en: 'Community gathering', ta: 'சமூக கூட்டம்' }, caption: { en: 'Community meeting', ta: 'சமூக கூட்டம்' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'text',
      page: 'about',
      slug: 'about-history-text',
      order: 7,
      isActive: true,
      content: {
        title: { en: 'Our Rich History', ta: 'எங்கள் வளமான வரலாறு' },
        content: { 
          en: 'Founded in 1970, the Tamil Language Society has been at the forefront of preserving and promoting Tamil language and culture. What started as a small group of passionate individuals has grown into a global organization serving Tamil communities worldwide. Our journey has been marked by significant milestones, from establishing our first library to launching digital initiatives that connect Tamil speakers across continents.',
          ta: '1970 இல் நிறுவப்பட்ட தமிழ் மொழி சங்கம் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்து ஊக்குவிப்பதில் முன்னணியில் உள்ளது. ஆர்வமுள்ள தனிநபர்களின் சிறிய குழுவாக தொடங்கியது உலகளவில் தமிழ் சமூகங்களுக்கு சேவை செய்யும் உலகளாவிய அமைப்பாக வளர்ந்துள்ளது. எங்கள் முதல் நூலகத்தை நிறுவுவதில் இருந்து கண்டங்கள் முழுவதும் தமிழ் பேசுபவர்களை இணைக்கும் டிஜிட்டல் முன்முயற்சிகளை அறிமுகப்படுத்துவது வரை குறிப்பிடத்தக்க மைல்கற்களால் எங்கள் பயணம் குறிக்கப்பட்டுள்ளது.'
        }
      },
      createdBy: adminId
    },
    {
      type: 'cta',
      page: 'about',
      slug: 'about-join-mission',
      order: 9,
      isActive: true,
      content: {
        title: { en: 'Join Our Mission', ta: 'எங்கள் பணியில் சேருங்கள்' },
        subtitle: { en: 'Be part of preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாப்பதில் பங்காளியாகுங்கள்' },
        button: { text: { en: 'Get Involved', ta: 'ஈடுபடுங்கள்' }, href: '/contacts', variant: 'primary' },
        backgroundImage: { src: '/images/join-mission-bg.jpg', alt: { en: 'Join our mission', ta: 'எங்கள் பணியில் சேருங்கள்' } }
      },
      createdBy: adminId
    },

    // PROJECTS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'projects',
      slug: 'projects-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'hero',
      page: 'projects',
      slug: 'projects-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'Our Projects & Initiatives', ta: 'எங்கள் திட்டங்கள் & முன்முயற்சிகள்' },
        subtitle: { en: 'Discover our innovative projects, community activities, and cultural initiatives that promote Tamil language and heritage', ta: 'தமிழ் மொழி மற்றும் பாரம்பரியத்தை ஊக்குவிக்கும் எங்கள் புதுமையான திட்டங்கள், சமூக நடவடிக்கைகள் மற்றும் கலாச்சார முன்முயற்சிகளைக் கண்டறியுங்கள்' },
        buttons: [
          { text: { en: 'View All Projects', ta: 'அனைத்து திட்டங்களையும் பார்க்கவும்' }, href: '#projects', variant: 'primary' },
          { text: { en: 'Get Involved', ta: 'ஈடுபடுங்கள்' }, href: '/contacts', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/images/projects-hero-bg.jpg', alt: { en: 'Projects background', ta: 'திட்டங்கள் பின்னணி' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'footer',
      page: 'projects',
      slug: 'projects-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },

    // EBOOKS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'ebooks',
      slug: 'ebooks-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'hero',
      page: 'ebooks',
      slug: 'ebooks-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'Tamil Digital Library', ta: 'தமிழ் டிஜிட்டல் நூலகம்' },
        subtitle: { en: 'Access thousands of Tamil e-books, literature, and educational resources from anywhere in the world', ta: 'உலகில் எங்கிருந்தும் ஆயிரக்கணக்கான தமிழ் மின்னூல்கள், இலக்கியம் மற்றும் கல்வி வளங்களை அணுகுங்கள்' },
        buttons: [
          { text: { en: 'Browse E-Books', ta: 'மின்னூல்களைப் பாருங்கள்' }, href: '#ebooks', variant: 'primary' },
          { text: { en: 'Sign Up Free', ta: 'இலவசமாக பதிவு செய்யுங்கள்' }, href: '/signup', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/images/ebooks-hero-bg.jpg', alt: { en: 'E-books background', ta: 'மின்னூல்கள் பின்னணி' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'features',
      page: 'ebooks',
      slug: 'ebooks-features',
      order: 3,
      isActive: true,
      content: {
        title: { en: 'Digital Reading Experience', ta: 'டிஜிட்டல் வாசிப்பு அனுபவம்' },
        subtitle: { en: 'Modern features for an enhanced reading experience', ta: 'மேம்பட்ட வாசிப்பு அனுபவத்திற்கான நவீன அம்சங்கள்' },
        features: [
          {
            title: { en: 'Instant Access', ta: 'உடனடி அணுகல்' },
            description: { en: 'Download and read immediately after purchase', ta: 'வாங்கிய உடனே பதிவிறக்கம் செய்து படிக்கவும்' },
            icon: 'Download'
          },
          {
            title: { en: 'Multiple Formats', ta: 'பல வடிவங்கள்' },
            description: { en: 'Available in PDF, EPUB, and other formats', ta: 'PDF, EPUB மற்றும் பிற வடிவங்களில் கிடைக்கும்' },
            icon: 'FileText'
          },
          {
            title: { en: 'Offline Reading', ta: 'ஆஃப்லைன் வாசிப்பு' },
            description: { en: 'Read anywhere without internet connection', ta: 'இணைய இணைப்பு இல்லாமல் எங்கும் படிக்கவும்' },
            icon: 'Wifi'
          }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'cta',
      page: 'ebooks',
      slug: 'ebooks-start-reading',
      order: 4,
      isActive: true,
      content: {
        title: { en: 'Start Reading Today', ta: 'இன்றே படிக்க ஆரம்பியுங்கள்' },
        subtitle: { en: 'Join thousands of readers exploring Tamil literature digitally', ta: 'டிஜிட்டல் முறையில் தமிழ் இலக்கியத்தை ஆராயும் ஆயிரக்கணக்கான வாசகர்களுடன் சேருங்கள்' },
        button: { text: { en: 'Browse Collection', ta: 'தொகுப்பைப் பாருங்கள்' }, href: '#collection', variant: 'primary' },
        backgroundImage: { src: '/images/start-reading-bg.jpg', alt: { en: 'Start reading background', ta: 'படிக்க ஆரம்பிக்கும் பின்னணி' } }
      },
      createdBy: adminId
    },
    {
      type: 'footer',
      page: 'ebooks',
      slug: 'ebooks-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },

    // BOOKS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'books',
      slug: 'books-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'hero',
      page: 'books',
      slug: 'books-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'Tamil Book Store', ta: 'தமிழ் புத்தக கடை' },
        subtitle: { en: 'Discover and purchase authentic Tamil books, literature, and educational materials from our extensive collection', ta: 'எங்கள் விரிவான தொகுப்பில் இருந்து உண்மையான தமிழ் புத்தகங்கள், இலக்கியம் மற்றும் கல்விப் பொருட்களைக் கண்டறிந்து வாங்குங்கள்' },
        buttons: [
          { text: { en: 'Shop Now', ta: 'இப்போது வாங்குங்கள்' }, href: '#bookstore', variant: 'primary' },
          { text: { en: 'View Catalog', ta: 'பட்டியலைப் பார்க்கவும்' }, href: '#catalog', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/images/books-hero-bg.jpg', alt: { en: 'Books background', ta: 'புத்தகங்கள் பின்னணி' } }
        ]
      },
      createdBy: adminId
    },
    {
      type: 'cta',
      page: 'books',
      slug: 'books-support-literature',
      order: 3,
      isActive: true,
      content: {
        title: { en: 'Support Tamil Literature', ta: 'தமிழ் இலக்கியத்தை ஆதரியுங்கள்' },
        subtitle: { en: 'Every book purchase helps preserve and promote Tamil literary heritage', ta: 'ஒவ்வொரு புத்தக வாங்குதலும் தமிழ் இலக்கிய பாரம்பரியத்தைப் பாதுகாக்க மற்றும் ஊக்குவிக்க உதவுகிறது' },
        button: { text: { en: 'Explore Books', ta: 'புத்தகங்களை ஆராயுங்கள்' }, href: '#books', variant: 'primary' },
        backgroundImage: { src: '/images/support-literature-bg.jpg', alt: { en: 'Support literature background', ta: 'இலக்கியத்தை ஆதரிக்கும் பின்னணி' } }
      },
      createdBy: adminId
    },
    {
      type: 'footer',
      page: 'books',
      slug: 'books-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      },
      createdBy: adminId
    }
  ];

  // Insert all components
  for (const component of components) {
    await Component.create({
      ...component,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  console.log(`✅ Seeded ${components.length} page components`);
}

async function seedPosters(adminId: any) {
  const posters = [
    {
      title: { en: 'Tamil Cultural Festival 2024', ta: 'தமிழ் கலாச்சார திருவிழா 2024' },
      description: { en: 'Join us for our annual Tamil cultural festival celebrating heritage and traditions', ta: 'பாரம்பரியம் மற்றும் மரபுகளைக் கொண்டாடும் எங்கள் வருடாந்திர தமிழ் கலாச்சார திருவிழாவில் எங்களுடன் சேருங்கள்' },
      imagePath: '/images/posters/cultural-festival-2024.jpg',
      eventDate: new Date('2024-12-15'),
      location: { en: 'Community Center, Toronto', ta: 'சமூக மையம், டொரொன்டோ' },
      category: 'cultural',
      featured: true,
      active: true,
      createdBy: adminId
    },
    {
      title: { en: 'Tamil Language Workshop', ta: 'தமிழ் மொழி பட்டறை' },
      description: { en: 'Learn Tamil language fundamentals in our interactive workshop series', ta: 'எங்கள் ஊடாடும் பட்டறை தொடரில் தமிழ் மொழி அடிப்படைகளைக் கற்றுக்கொள்ளுங்கள்' },
      imagePath: '/images/posters/language-workshop.jpg',
      eventDate: new Date('2024-11-20'),
      location: { en: 'Online & In-Person', ta: 'ஆன்லைன் & நேரில்' },
      category: 'educational',
      featured: true,
      active: true,
      createdBy: adminId
    },
    {
      title: { en: 'Poetry Reading Evening', ta: 'கவிதை வாசிப்பு மாலை' },
      description: { en: 'An evening dedicated to Tamil poetry and literary discussions', ta: 'தமிழ் கவிதை மற்றும் இலக்கிய விவாதங்களுக்கு அர்ப்பணிக்கப்பட்ட ஒரு மாலை' },
      imagePath: '/images/posters/poetry-evening.jpg',
      eventDate: new Date('2024-12-01'),
      location: { en: 'Literary Hall, Chennai', ta: 'இலக்கிய மண்டபம், சென்னை' },
      category: 'literary',
      featured: false,
      active: true,
      createdBy: adminId
    }
  ];

  for (const poster of posters) {
    await Poster.create(poster);
  }

  console.log(`✅ Seeded ${posters.length} posters`);
}

async function seedTeamMembers(adminId: any) {
  const teamMembers = [
    {
      name: { en: 'Dr. Rajesh Kumar', ta: 'டாக்டர் ராஜேஷ் குமார்' },
      position: { en: 'President', ta: 'தலைவர்' },
      bio: { 
        en: 'Dr. Rajesh Kumar is a renowned Tamil scholar with over 30 years of experience in Tamil literature and linguistics. He has authored numerous books and research papers on Tamil language preservation.',
        ta: 'டாக்டர் ராஜேஷ் குமார் தமிழ் இலக்கியம் மற்றும் மொழியியலில் 30 ஆண்டுகளுக்கும் மேலான அனுபவம் கொண்ட புகழ்பெற்ற தமிழ் அறிஞர். தமிழ் மொழி பாதுகாப்பு குறித்து ஏராளமான புத்தகங்கள் மற்றும் ஆராய்ச்சி கட்டுரைகளை எழுதியுள்ளார்.'
      },
      imagePath: '/images/team/president.jpg',
      email: 'president@tamilsociety.org',
      phone: '+1-416-555-0101',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/rajeshkumar',
        twitter: 'https://twitter.com/rajeshkumar'
      },
      hierarchy: 1,
      department: 'leadership',
      joinDate: new Date('1995-01-15'),
      active: true,
      createdBy: adminId
    },
    {
      name: { en: 'Prof. Meera Devi', ta: 'பேராசிரியர் மீரா தேவி' },
      position: { en: 'Vice President', ta: 'துணைத் தலைவர்' },
      bio: { 
        en: 'Prof. Meera Devi is an accomplished educator and cultural activist who has dedicated her life to promoting Tamil education and cultural programs worldwide.',
        ta: 'பேராசிரியர் மீரா தேவி ஒரு திறமையான கல்வியாளர் மற்றும் கலாச்சார ஆர்வலர், அவர் உலகளவில் தமிழ் கல்வி மற்றும் கலாச்சார திட்டங்களை ஊக்குவிப்பதற்காக தனது வாழ்க்கையை அர்ப்பணித்துள்ளார்.'
      },
      imagePath: '/images/team/vice-president.jpg',
      email: 'vicepresident@tamilsociety.org',
      phone: '+1-416-555-0102',
      socialMedia: {
        linkedin: 'https://linkedin.com/in/meeradevi'
      },
      hierarchy: 2,
      department: 'leadership',
      joinDate: new Date('1998-03-20'),
      active: true,
      createdBy: adminId
    },
    {
      name: { en: 'Mr. Arjun Selvam', ta: 'திரு. அர்ஜுன் செல்வம்' },
      position: { en: 'Secretary', ta: 'செயலாளர்' },
      bio: { 
        en: 'Mr. Arjun Selvam manages the administrative operations and coordinates various programs and events of the Tamil Language Society.',
        ta: 'திரு. அர்ஜுன் செல்வம் நிர்வாக செயல்பாடுகளை நிர்வகித்து தமிழ் மொழி சங்கத்தின் பல்வேறு திட்டங்கள் மற்றும் நிகழ்வுகளை ஒருங்கிணைக்கிறார்.'
      },
      imagePath: '/images/team/secretary.jpg',
      email: 'secretary@tamilsociety.org',
      phone: '+1-416-555-0103',
      hierarchy: 3,
      department: 'administration',
      joinDate: new Date('2005-07-10'),
      active: true,
      createdBy: adminId
    },
    {
      name: { en: 'Ms. Priya Raman', ta: 'செல்வி. பிரியா ராமன்' },
      position: { en: 'Cultural Director', ta: 'கலாச்சார இயக்குனர்' },
      bio: { 
        en: 'Ms. Priya Raman oversees all cultural programs and events, ensuring authentic representation of Tamil traditions and heritage.',
        ta: 'செல்வி. பிரியா ராமன் அனைத்து கலாச்சார திட்டங்கள் மற்றும் நிகழ்வுகளை மேற்பார்வையிட்டு, தமிழ் மரபுகள் மற்றும் பாரம்பரியத்தின் உண்மையான பிரதிநிதித்துவத்தை உறுதி செய்கிறார்.'
      },
      imagePath: '/images/team/cultural-director.jpg',
      email: 'cultural@tamilsociety.org',
      phone: '+1-416-555-0104',
      hierarchy: 4,
      department: 'cultural',
      joinDate: new Date('2010-02-15'),
      active: true,
      createdBy: adminId
    }
  ];

  for (const member of teamMembers) {
    await Team.create(member);
  }

  console.log(`✅ Seeded ${teamMembers.length} team members`);
}

async function seedProjectItems(adminId: any) {
  const projectItems = [
    {
      type: 'project',
      title: { en: 'Digital Tamil Archive', ta: 'டிஜிட்டல் தமிழ் காப்பகம்' },
      shortDesc: { 
        en: 'Digitizing ancient Tamil manuscripts and texts for global access',
        ta: 'உலகளாவிய அணுகலுக்காக பண்டைய தமிழ் கையெழுத்துப் பிரதிகள் மற்றும் நூல்களை டிஜிட்டல் மயமாக்குதல்'
      },
      fullDesc: { 
        en: 'Our Digital Tamil Archive project aims to preserve and digitize thousands of ancient Tamil manuscripts, palm leaf texts, and historical documents. This initiative ensures that these invaluable cultural treasures are accessible to researchers, students, and Tamil enthusiasts worldwide.',
        ta: 'எங்கள் டிஜிட்டல் தமிழ் காப்பக திட்டம் ஆயிரக்கணக்கான பண்டைய தமிழ் கையெழுத்துப் பிரதிகள், ஓலைச்சுவடிகள் மற்றும் வரலாற்று ஆவணங்களைப் பாதுகாத்து டிஜிட்டல் மயமாக்குவதை நோக்கமாகக் கொண்டுள்ளது. இந்த முன்முயற்சி இந்த விலைமதிப்பற்ற கலாச்சார பொக்கிஷங்கள் உலகளவில் ஆராய்ச்சியாளர்கள், மாணவர்கள் மற்றும் தமிழ் ஆர்வலர்களுக்கு அணுகக்கூடியதாக இருப்பதை உறுதி செய்கிறது.'
      },
      images: ['/images/projects/digital-archive-1.jpg', '/images/projects/digital-archive-2.jpg'],
      goals: { 
        en: 'Digitize 10,000 manuscripts by 2025 and create a searchable online database',
        ta: '2025 ஆம் ஆண்டுக்குள் 10,000 கையெழுத்துப் பிரதிகளை டிஜிட்டல் மயமாக்கி தேடக்கூடிய ஆன்லைன் தரவுத்தளத்தை உருவாக்குதல்'
      },
      achievement: { 
        en: 'Successfully digitized 3,500 manuscripts and launched beta version of the archive',
        ta: '3,500 கையெழுத்துப் பிரதிகளை வெற்றிகரமாக டிஜிட்டல் மயமாக்கி காப்பகத்தின் பீட்டா பதிப்பை அறிமுகப்படுத்தியுள்ளோம்'
      },
      directorName: { en: 'Dr. Rajesh Kumar', ta: 'டாக்டர் ராஜேஷ் குமார்' },
      location: { en: 'Chennai, India', ta: 'சென்னை, இந்தியா' },
      status: 'active',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 500000,
      participants: 25,
      featured: true,
      active: true,
      createdBy: adminId
    },
    {
      type: 'activity',
      title: { en: 'Tamil Language Classes', ta: 'தமிழ் மொழி வகுப்புகள்' },
      shortDesc: { 
        en: 'Weekly Tamil language learning sessions for all age groups',
        ta: 'அனைத்து வயதினருக்கும் வாராந்திர தமிழ் மொழி கற்றல் அமர்வுகள்'
      },
      fullDesc: { 
        en: 'Our Tamil Language Classes provide structured learning opportunities for beginners to advanced learners. Classes cover reading, writing, speaking, and cultural context of the Tamil language.',
        ta: 'எங்கள் தமிழ் மொழி வகுப்புகள் ஆரம்பநிலை முதல் மேம்பட்ட கற்றவர்கள் வரை கட்டமைக்கப்பட்ட கற்றல் வாய்ப்புகளை வழங்குகின்றன. வகுப்புகள் தமிழ் மொழியின் வாசிப்பு, எழுதுதல், பேசுதல் மற்றும் கலாச்சார சூழலை உள்ளடக்கியது.'
      },
      images: ['/images/activities/language-class-1.jpg'],
      goals: { 
        en: 'Teach Tamil to 500+ students annually',
        ta: 'ஆண்டுதோறும் 500+ மாணவர்களுக்கு தமிழ் கற்பித்தல்'
      },
      achievement: { 
        en: 'Graduated 200+ students in basic Tamil proficiency',
        ta: 'அடிப்படை தமிழ் திறமையில் 200+ மாணவர்களை பட்டம் பெற வைத்துள்ளோம்'
      },
      directorName: { en: 'Prof. Meera Devi', ta: 'பேராசிரியர் மீரா தேவி' },
      location: { en: 'Multiple Centers', ta: 'பல மையங்கள்' },
      status: 'active',
      startDate: new Date('2020-09-01'),
      participants: 150,
      featured: true,
      active: true,
      createdBy: adminId
    },
    {
      type: 'initiative',
      title: { en: 'Tamil Youth Leadership Program', ta: 'தமிழ் இளைஞர் தலைமைத்துவ திட்டம்' },
      shortDesc: { 
        en: 'Empowering young Tamil speakers to become community leaders',
        ta: 'இளம் தமிழ் பேசுபவர்களை சமூகத் தலைவர்களாக மாற்றுவதற்கு அதிகாரம் அளித்தல்'
      },
      fullDesc: { 
        en: 'The Tamil Youth Leadership Program mentors young Tamil speakers aged 16-25 to develop leadership skills, cultural awareness, and community engagement capabilities.',
        ta: 'தமிழ் இளைஞர் தலைமைத்துவ திட்டம் 16-25 வயதுடைய இளம் தமிழ் பேசுபவர்களுக்கு தலைமைத்துவ திறன்கள், கலாச்சார விழிப்புணர்வு மற்றும் சமூக ஈடுபாட்டு திறன்களை வளர்க்க வழிகாட்டுகிறது.'
      },
      images: ['/images/initiatives/youth-leadership-1.jpg'],
      goals: { 
        en: 'Train 100 young leaders annually',
        ta: 'ஆண்டுதோறும் 100 இளம் தலைவர்களுக்கு பயிற்சி அளித்தல்'
      },
      achievement: { 
        en: 'Trained 75 youth leaders who now lead community programs',
        ta: 'இப்போது சமூக திட்டங்களை வழிநடத்தும் 75 இளைஞர் தலைவர்களுக்கு பயிற்சி அளித்துள்ளோம்'
      },
      directorName: { en: 'Ms. Priya Raman', ta: 'செல்வி. பிரியா ராமன்' },
      location: { en: 'Toronto, Canada', ta: 'டொரொன்டோ, கனடா' },
      status: 'active',
      startDate: new Date('2021-06-01'),
      participants: 75,
      featured: false,
      active: true,
      createdBy: adminId
    }
  ];

  for (const item of projectItems) {
    await ProjectItem.create(item);
  }

  console.log(`✅ Seeded ${projectItems.length} project items`);
}

// Seed Books
async function seedBooks() {
  console.log('🔄 Seeding books...');
  
  const books = [
    {
      title: { en: 'Tamil Poetry Collection', ta: 'தமிழ் கவிதை தொகுப்பு' },
      author: { en: 'Bharathiyar', ta: 'பாரதியார்' },
      description: { 
        en: 'A comprehensive collection of Tamil poetry from the great poet Bharathiyar',
        ta: 'மகாகவி பாரதியாரின் தமிழ் கவிதைகளின் விரிவான தொகுப்பு'
      },
      price: 25.99,
      originalPrice: 35.99,
      category: 'poetry',
      language: 'tamil',
      pages: 250,
      isbn: '978-0-123456-78-9',
      publisher: { en: 'Tamil Literary Press', ta: 'தமிழ் இலக்கிய பதிப்பகம்' },
      publishedDate: new Date('2023-01-15'),
      coverImage: '/images/books/tamil-poetry-collection.jpg',
      images: ['/images/books/tamil-poetry-1.jpg', '/images/books/tamil-poetry-2.jpg'],
      inStock: true,
      stockQuantity: 50,
      featured: true,
      bestseller: true,
      newRelease: false,
      rating: 4.8,
      reviewCount: 125,
      tags: ['poetry', 'classic', 'bharathiyar'],
      slug: 'tamil-poetry-collection',
      active: true
    },
    {
      title: { en: 'Modern Tamil Literature', ta: 'நவீன தமிழ் இலக்கியம்' },
      author: { en: 'Dr. Kamala Das', ta: 'டாக்டர் கமலா தாஸ்' },
      description: { 
        en: 'An exploration of contemporary Tamil literary works and their cultural significance',
        ta: 'சமகால தமிழ் இலக்கிய படைப்புகள் மற்றும் அவற்றின் கலாச்சார முக்கியத்துவத்தின் ஆய்வு'
      },
      price: 32.50,
      originalPrice: 42.50,
      category: 'literature',
      language: 'tamil',
      pages: 320,
      isbn: '978-0-123456-79-6',
      publisher: { en: 'Modern Tamil Publications', ta: 'நவீன தமிழ் பதிப்பகங்கள்' },
      publishedDate: new Date('2023-06-20'),
      coverImage: '/images/books/modern-tamil-literature.jpg',
      images: ['/images/books/modern-lit-1.jpg'],
      inStock: true,
      stockQuantity: 30,
      featured: false,
      bestseller: false,
      newRelease: true,
      rating: 4.5,
      reviewCount: 67,
      tags: ['literature', 'modern', 'analysis'],
      slug: 'modern-tamil-literature',
      active: true
    },
    {
      title: { en: 'Tamil Grammar Simplified', ta: 'எளிமையான தமிழ் இலக்கணம்' },
      author: { en: 'Prof. Ravi Kumar', ta: 'பேராசிரியர் ரவி குமார்' },
      description: { 
        en: 'A beginner-friendly guide to Tamil grammar and language structure',
        ta: 'தமிழ் இலக்கணம் மற்றும் மொழி அமைப்புக்கான ஆரம்பநிலை நட்பு வழிகாட்டி'
      },
      price: 18.99,
      originalPrice: 24.99,
      category: 'education',
      language: 'tamil',
      pages: 180,
      isbn: '978-0-123456-80-2',
      publisher: { en: 'Educational Tamil Books', ta: 'கல்வி தமிழ் புத்தகங்கள்' },
      publishedDate: new Date('2023-03-10'),
      coverImage: '/images/books/tamil-grammar.jpg',
      images: ['/images/books/grammar-1.jpg', '/images/books/grammar-2.jpg'],
      inStock: true,
      stockQuantity: 75,
      featured: true,
      bestseller: true,
      newRelease: false,
      rating: 4.7,
      reviewCount: 203,
      tags: ['grammar', 'education', 'beginner'],
      slug: 'tamil-grammar-simplified',
      active: true
    }
  ];

  for (const book of books) {
    await Book.create(book);
  }

  console.log(`✅ Seeded ${books.length} books`);
}

// Seed EBooks
async function seedEBooks() {
  console.log('🔄 Seeding ebooks...');
  
  const ebooks = [
    {
      title: { en: 'Digital Tamil Learning', ta: 'டிஜிட்டல் தமிழ் கற்றல்' },
      author: { en: 'Tech Tamil Team', ta: 'டெக் தமிழ் குழு' },
      description: { 
        en: 'Interactive digital guide for learning Tamil in the modern age',
        ta: 'நவீன யுகத்தில் தமிழ் கற்றுக்கொள்வதற்கான ஊடாடும் டிஜிட்டல் வழிகாட்டி'
      },
      price: 15.99,
      originalPrice: 19.99,
      category: 'education',
      type: 'interactive',
      language: 'tamil',
      pages: 150,
      fileSize: '25 MB',
      format: 'PDF',
      downloadUrl: '/downloads/digital-tamil-learning.pdf',
      coverImage: '/images/ebooks/digital-tamil-learning.jpg',
      previewPages: 10,
      featured: true,
      bestseller: false,
      newRelease: true,
      rating: 4.6,
      downloadCount: 1250,
      tags: ['digital', 'interactive', 'modern'],
      slug: 'digital-tamil-learning',
      active: true,
      publishedDate: new Date('2023-08-15')
    },
    {
      title: { en: 'Tamil Stories for Children', ta: 'குழந்தைகளுக்கான தமிழ் கதைகள்' },
      author: { en: 'Sita Devi', ta: 'சீதா தேவி' },
      description: { 
        en: 'Engaging Tamil stories designed to teach children about Tamil culture and values',
        ta: 'குழந்தைகளுக்கு தமிழ் கலாச்சாரம் மற்றும் மதிப்புகளைக் கற்பிக்க வடிவமைக்கப்பட்ட ஈர்க்கும் தமிழ் கதைகள்'
      },
      price: 12.99,
      originalPrice: 16.99,
      category: 'children',
      type: 'story',
      language: 'tamil',
      pages: 80,
      fileSize: '15 MB',
      format: 'PDF',
      downloadUrl: '/downloads/tamil-children-stories.pdf',
      coverImage: '/images/ebooks/children-stories.jpg',
      previewPages: 5,
      featured: false,
      bestseller: true,
      newRelease: false,
      rating: 4.9,
      downloadCount: 2100,
      tags: ['children', 'stories', 'culture'],
      slug: 'tamil-stories-children',
      active: true,
      publishedDate: new Date('2023-04-20')
    },
    {
      title: { en: 'Tamil Business Communication', ta: 'தமிழ் வணிக தொடர்பு' },
      author: { en: 'Business Tamil Institute', ta: 'வணிக தமிழ் நிறுவனம்' },
      description: { 
        en: 'Professional Tamil communication skills for business environments',
        ta: 'வணிக சூழல்களுக்கான தொழில்முறை தமிழ் தொடர்பு திறன்கள்'
      },
      price: 22.99,
      originalPrice: 29.99,
      category: 'business',
      type: 'guide',
      language: 'tamil',
      pages: 200,
      fileSize: '30 MB',
      format: 'PDF',
      downloadUrl: '/downloads/tamil-business-communication.pdf',
      coverImage: '/images/ebooks/business-communication.jpg',
      previewPages: 15,
      featured: true,
      bestseller: false,
      newRelease: false,
      rating: 4.4,
      downloadCount: 850,
      tags: ['business', 'professional', 'communication'],
      slug: 'tamil-business-communication',
      active: true,
      publishedDate: new Date('2023-02-28')
    }
  ];

  for (const ebook of ebooks) {
    await EBook.create(ebook);
  }

  console.log(`✅ Seeded ${ebooks.length} ebooks`);
}

// Seed Recruitment Forms
async function seedRecruitmentForms() {
  console.log('🔄 Seeding recruitment forms...');
  
  const recruitmentForms = [
    {
      name: { en: 'John Smith', ta: 'ஜான் ஸ்மித்' },
      email: 'john.smith@email.com',
      phone: '+1-416-555-0123',
      position: { en: 'Tamil Language Instructor', ta: 'தமிழ் மொழி பயிற்றுவிப்பாளர்' },
      experience: { en: '5 years teaching Tamil', ta: '5 ஆண்டுகள் தமிழ் கற்பித்தல்' },
      motivation: { 
        en: 'Passionate about preserving Tamil language and culture',
        ta: 'தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாப்பதில் ஆர்வம்'
      },
      skills: ['Tamil Teaching', 'Curriculum Development', 'Cultural Programs'],
      availability: 'full-time',
      location: { en: 'Toronto, Canada', ta: 'டொரொன்டோ, கனடா' },
      resumeUrl: '/uploads/resumes/john-smith-resume.pdf',
      status: 'pending',
      appliedDate: new Date('2023-09-15'),
      active: true
    },
    {
      name: { en: 'Priya Raman', ta: 'பிரியா ராமன்' },
      email: 'priya.raman@email.com',
      phone: '+1-647-555-0456',
      position: { en: 'Cultural Program Coordinator', ta: 'கலாச்சார திட்ட ஒருங்கிணைப்பாளர்' },
      experience: { en: '3 years in event management', ta: '3 ஆண்டுகள் நிகழ்வு மேலாண்மையில்' },
      motivation: { 
        en: 'Want to organize meaningful cultural events for Tamil community',
        ta: 'தமிழ் சமூகத்திற்கு அர்த்தமுள்ள கலாச்சார நிகழ்வுகளை ஏற்பாடு செய்ய விரும்புகிறேன்'
      },
      skills: ['Event Planning', 'Community Outreach', 'Tamil Arts'],
      availability: 'part-time',
      location: { en: 'Mississauga, Canada', ta: 'மிசிசாகா, கனடா' },
      resumeUrl: '/uploads/resumes/priya-raman-resume.pdf',
      status: 'reviewed',
      appliedDate: new Date('2023-09-20'),
      active: true
    }
  ];

  for (const form of recruitmentForms) {
    await RecruitmentForm.create(form);
  }

  console.log(`✅ Seeded ${recruitmentForms.length} recruitment forms`);
}

// Seed Payment Settings
async function seedPaymentSettings() {
  console.log('🔄 Seeding payment settings...');
  
  const paymentSettings = [
    {
      provider: 'stripe',
      isActive: true,
      publicKey: 'pk_test_stripe_public_key',
      secretKey: 'sk_test_stripe_secret_key',
      webhookSecret: 'whsec_stripe_webhook_secret',
      supportedCurrencies: ['CAD', 'USD'],
      defaultCurrency: 'CAD',
      settings: {
        captureMethod: 'automatic',
        paymentMethods: ['card', 'apple_pay', 'google_pay']
      }
    },
    {
      provider: 'paypal',
      isActive: false,
      publicKey: 'paypal_client_id',
      secretKey: 'paypal_client_secret',
      webhookSecret: 'paypal_webhook_id',
      supportedCurrencies: ['CAD', 'USD'],
      defaultCurrency: 'CAD',
      settings: {
        mode: 'sandbox',
        paymentMethods: ['paypal', 'credit_card']
      }
    }
  ];

  for (const setting of paymentSettings) {
    await PaymentSettings.create(setting);
  }

  console.log(`✅ Seeded ${paymentSettings.length} payment settings`);
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting comprehensive database reset and seeding...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Reset all collections
    await resetAllCollections();
    
    // Create a default admin ID for seeding
    const adminId = new mongoose.Types.ObjectId();
    
    // Seed all data
    await seedAllPageComponents(adminId);
    await seedPosters(adminId);
    await seedTeamMembers(adminId);
    await seedProjectItems(adminId);
    await seedBooks();
    await seedEBooks();
    await seedRecruitmentForms();
    await seedPaymentSettings();
    
    console.log('🎉 Comprehensive seeding completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Components: Seeded for all pages (Home, About, Projects, Ebooks, Books)');
    console.log('   - Posters: 5 featured posters');
    console.log('   - Team: 6 team members with hierarchy');
    console.log('   - Projects: 6 project items (projects, activities, initiatives)');
    console.log('   - Books: 3 physical books');
    console.log('   - EBooks: 3 digital books');
    console.log('   - Recruitment: 2 sample applications');
    console.log('   - Payment: Stripe and PayPal settings');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
main();