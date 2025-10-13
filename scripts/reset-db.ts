import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function resetDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    
    console.log('🗑️ Clearing all collections...');
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    
    // Drop each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`   Dropping collection: ${collectionName}`);
      await db.dropCollection(collectionName);
    }
    
    console.log('✅ Database reset completed successfully!');
    console.log('📊 All collections have been cleared.');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
  }
}

// Run the reset function
resetDatabase();