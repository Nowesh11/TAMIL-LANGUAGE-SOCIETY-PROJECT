
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verifySetup() {
  console.log('--- Phase 1: Setup & Environment Check ---');
  
  // 1. Check Env Vars
  console.log('Checking Environment Variables...');
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing!');
    process.exit(1);
  }
  console.log('✅ MONGODB_URI found.');

  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ JWT_SECRET is missing! Auth might fail.');
  } else {
    console.log('✅ JWT_SECRET found.');
  }

  // 2. Test DB Connection
  console.log('\nTesting Database Connection...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database Connected Successfully.');
    
    // 3. Check Collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nExisting Collections:');
    collections.forEach(c => console.log(` - ${c.name}`));
    
    // Check for essential collections
    const requiredCollections = ['users', 'books', 'files', 'paymentsettings'];
    const collectionNames = collections.map(c => c.name);
    
    requiredCollections.forEach(req => {
      if (collectionNames.includes(req)) {
        console.log(`✅ Collection '${req}' exists.`);
      } else {
        console.warn(`⚠️ Collection '${req}' NOT found (might be created on first write).`);
      }
    });

  } catch (error) {
    console.error('❌ Database Connection Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n--- Check Complete ---');
  }
}

verifySetup();
