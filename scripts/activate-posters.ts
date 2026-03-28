import mongoose from 'mongoose';
import Poster from '../src/models/Poster';

const MONGODB_URI = process.env.MONGODB_URI;

async function activatePosters() {
  try {
    console.log('🔄 ACTIVATING ALL POSTERS...\n');
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Please configure it in .env/.env.local before running this script.');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update all posters to be active
    const result = await Poster.updateMany(
      {},
      { 
        $set: { 
          isActive: true
        } 
      }
    );

    console.log(`✅ Activated ${result.modifiedCount} posters`);

    // Verify the update
    const activePosters = await Poster.find({ isActive: true });
    console.log(`\n📊 Active posters: ${activePosters.length}`);
    
    for (const poster of activePosters) {
      console.log(`   ✅ ${poster.title.en}`);
    }

  } catch (error) {
    console.error('❌ Error activating posters:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

activatePosters();
