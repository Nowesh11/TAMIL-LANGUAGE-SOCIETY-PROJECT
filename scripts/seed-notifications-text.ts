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

async function seedNotificationsText() {
  try {
    await connectDB();

    // Notifications page text content
    const notificationsTextData = {
      page: 'notifications',
      type: 'text',
      content: {
        title: {
          en: 'Notifications',
          ta: 'அறிவிப்புகள்'
        },
        description: {
          en: 'Stay updated with the latest announcements, news, and important information from the Tamil Language Society.',
          ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், செய்திகள் மற்றும் முக்கியமான தகவல்களுடன் புதுப்பித்துக் கொள்ளுங்கள்.'
        },
        stats: {
          totalNotifications: {
            en: 'Total Notifications',
            ta: 'மொத்த அறிவிப்புகள்'
          },
          unread: {
            en: 'Unread',
            ta: 'படிக்காதவை'
          },
          realTimeUpdates: {
            en: 'Real-time Updates',
            ta: 'நேரடி புதுப்பிப்புகள்'
          }
        }
      },
      order: 1,
      isActive: true
    };

    // Notifications page SEO
    const notificationsSEOData = {
      page: 'notifications',
      type: 'seo',
      content: {
        title: {
          en: 'Notifications - Tamil Language Society',
          ta: 'அறிவிப்புகள் - தமிழ் மொழி சங்கம்'
        },
        description: {
          en: 'Stay informed with the latest notifications, announcements, and updates from the Tamil Language Society.',
          ta: 'தமிழ் மொழி சங்கத்தின் சமீபத்திய அறிவிப்புகள், அறிவிப்புகள் மற்றும் புதுப்பிப்புகளுடன் தகவலறிந்து இருங்கள்.'
        }
      },
      order: 1,
      isActive: true
    };

    // Upsert notifications text content
    await Component.findOneAndUpdate(
      { page: 'notifications', type: 'text' },
      notificationsTextData,
      { upsert: true, new: true }
    );

    // Upsert notifications SEO
    await Component.findOneAndUpdate(
      { page: 'notifications', type: 'seo' },
      notificationsSEOData,
      { upsert: true, new: true }
    );

    console.log('✅ Seeded notifications page text content and SEO');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding notifications text:', error);
    process.exit(1);
  }
}

seedNotificationsText();