import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function updateHeroBackgrounds() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all hero components with hardcoded background images
    const heroComponents = await Component.find({
      type: 'hero',
      'content.backgroundImages': { $exists: true }
    });

    console.log(`Found ${heroComponents.length} hero components to update`);

    let updatedCount = 0;

    for (const component of heroComponents) {
      let hasUpdates = false;
      const content = component.content as any;

      if (content.backgroundImages && Array.isArray(content.backgroundImages)) {
        for (let i = 0; i < content.backgroundImages.length; i++) {
          const img = content.backgroundImages[i];
          
          // Update hardcoded SVG paths to use uploads directory
          if (img.src === '/hero-bg-1.svg') {
            img.src = '/api/files/image?path=/uploads/our%20history/images/sample-history-1.svg';
            hasUpdates = true;
          } else if (img.src === '/hero-bg-2.svg') {
            img.src = '/api/files/image?path=/uploads/our%20history/images/sample-history-2.svg';
            hasUpdates = true;
          } else if (img.src === '/hero-bg-3.svg') {
            // Use the logo as a fallback for hero-bg-3
            img.src = '/api/files/image?path=/uploads/logo/tls-logo.png';
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        await component.save();
        updatedCount++;
        console.log(`✅ Updated hero component: ${component.page || 'unknown'} (${component.slug || component._id})`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} hero components with proper background image paths`);

  } catch (error) {
    console.error('❌ Error updating hero backgrounds:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('📦 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  updateHeroBackgrounds()
    .then(() => {
      console.log('🎉 Hero background update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Hero background update failed:', error);
      process.exit(1);
    });
}

export default updateHeroBackgrounds;