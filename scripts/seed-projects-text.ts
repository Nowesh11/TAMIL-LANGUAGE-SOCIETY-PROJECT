import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function seedProjectsText() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Projects page text content
    const projectsTextData = {
      page: 'projects',
      type: 'text',
      content: {
        projects: {
          en: 'Projects',
          ta: 'திட்டங்கள்'
        },
        activities: {
          en: 'Activities',
          ta: 'செயல்பாடுகள்'
        },
        initiatives: {
          en: 'Initiatives',
          ta: 'முயற்சிகள்'
        }
      },
      order: 1,
      isActive: true
    };

    // Projects page SEO
    const projectsSEOData = {
      page: 'projects',
      type: 'seo',
      content: {
        title: {
          en: 'Projects - Tamil Language Society',
          ta: 'திட்டங்கள் - தமிழ் மொழி சங்கம்'
        },
        description: {
          en: 'Explore our comprehensive projects, activities, and initiatives dedicated to promoting Tamil language and culture worldwide.',
          ta: 'உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தை மேம்படுத்துவதற்கான எங்கள் விரிவான திட்டங்கள், செயல்பாடுகள் மற்றும் முயற்சிகளை ஆராயுங்கள்.'
        }
      },
      order: 1,
      isActive: true
    };

    // Upsert projects text content
    await Component.findOneAndUpdate(
      { page: 'projects', type: 'text' },
      projectsTextData,
      { upsert: true, new: true }
    );

    // Upsert projects SEO
    await Component.findOneAndUpdate(
      { page: 'projects', type: 'seo' },
      projectsSEOData,
      { upsert: true, new: true }
    );

    console.log('✅ Seeded projects page text content and SEO');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding projects text:', error);
    process.exit(1);
  }
}

seedProjectsText();