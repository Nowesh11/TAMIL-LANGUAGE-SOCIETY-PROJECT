import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function addPosterAndTeamComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Add poster component to home page
    const posterComponent = {
      page: 'home',
      type: 'poster',
      slug: 'home-posters',
      order: 3, // After hero and before footer
      isActive: true,
      content: {
        title: {
          en: 'Latest Events & Announcements',
          ta: 'சமீபத்திய நிகழ்வுகள் & அறிவிப்புகள்'
        },
        subtitle: {
          en: 'Stay updated with our upcoming events and activities',
          ta: 'எங்கள் வரவிருக்கும் நிகழ்வுகள் மற்றும் செயல்பாடுகளுடன் புதுப்பித்த நிலையில் இருங்கள்'
        }
      }
    };
    
    await Component.findOneAndUpdate(
      { page: 'home', type: 'poster', slug: 'home-posters' },
      posterComponent,
      { upsert: true, new: true }
    );
    console.log('✅ Added poster component to home page');
    
    // Add team component to about page
    const teamComponent = {
      page: 'about',
      type: 'team',
      slug: 'about-team',
      order: 5, // After other about content
      isActive: true,
      content: {
        title: {
          en: 'Our Team',
          ta: 'எங்கள் குழு'
        },
        subtitle: {
          en: 'Meet the dedicated members who make our mission possible',
          ta: 'எங்கள் நோக்கத்தை சாத்தியமாக்கும் அர்ப்பணிப்புள்ள உறுப்பினர்களை சந்திக்கவும்'
        }
      }
    };
    
    await Component.findOneAndUpdate(
      { page: 'about', type: 'team', slug: 'about-team' },
      teamComponent,
      { upsert: true, new: true }
    );
    console.log('✅ Added team component to about page');
    
    // Update component orders to accommodate new components
    await Component.updateMany(
      { page: 'home', order: { $gte: 3 }, type: { $ne: 'poster' } },
      { $inc: { order: 1 } }
    );
    console.log('✅ Updated home page component orders');
    
    await Component.updateMany(
      { page: 'about', order: { $gte: 5 }, type: { $ne: 'team' } },
      { $inc: { order: 1 } }
    );
    console.log('✅ Updated about page component orders');
    
    await mongoose.connection.close();
    console.log('✅ Components added successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addPosterAndTeamComponents();