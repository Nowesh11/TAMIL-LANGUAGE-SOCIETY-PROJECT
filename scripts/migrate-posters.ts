import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Poster from '../src/models/Poster';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  return mongoose.connect(MONGODB_URI);
}

async function migratePosters() {
  try {
    console.log('🔄 Starting poster migration...');
    
    await connectDB();
    
    // Get all posters with old field structure
    const posters = await mongoose.connection.db.collection('posters').find({}).toArray();
    
    console.log(`📊 Found ${posters.length} posters to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const poster of posters) {
      const updates: any = {};
      let needsUpdate = false;
      
      const setUpdates: any = {};
      const unsetUpdates: any = {};
      
      // Migrate 'active' to 'isActive'
      if (poster.hasOwnProperty('active') && !poster.hasOwnProperty('isActive')) {
        setUpdates.isActive = poster.active;
        unsetUpdates.active = 1;
        needsUpdate = true;
      }
      
      // Add missing fields with defaults
      if (!poster.hasOwnProperty('isFeatured')) {
        setUpdates.isFeatured = false;
        needsUpdate = true;
      }
      
      if (!poster.hasOwnProperty('category')) {
        setUpdates.category = 'announcement'; // Default category
        needsUpdate = true;
      }
      
      if (!poster.hasOwnProperty('eventDate')) {
        setUpdates.eventDate = null;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const updateDoc: any = {};
        
        if (Object.keys(setUpdates).length > 0) {
          updateDoc.$set = setUpdates;
        }
        
        if (Object.keys(unsetUpdates).length > 0) {
          updateDoc.$unset = unsetUpdates;
        }
        
        await mongoose.connection.db.collection('posters').updateOne(
          { _id: poster._id },
          updateDoc
        );
        migrated++;
        console.log(`✅ Migrated poster: ${poster.title?.en || 'Unknown'}`);
      } else {
        skipped++;
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Migrated: ${migrated} posters`);
    console.log(`⏭️  Skipped: ${skipped} posters (already up to date)`);
    
    // Verify migration
    const updatedPosters = await Poster.find({}).lean();
    console.log(`\n📋 Verification:`);
    console.log(`- Total posters: ${updatedPosters.length}`);
    console.log(`- Active posters: ${updatedPosters.filter(p => p.isActive).length}`);
    console.log(`- Featured posters: ${updatedPosters.filter(p => p.isFeatured).length}`);
    
    const categoryCounts = updatedPosters.reduce((acc, poster) => {
      acc[poster.category] = (acc[poster.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`- Categories:`, categoryCounts);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePosters()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migratePosters;