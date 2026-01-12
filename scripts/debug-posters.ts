import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongodb';
import Poster from '../src/models/Poster';
import fs from 'fs/promises';
import path from 'path';

async function debugPosters() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Get all posters
    const posters = await Poster.find({});
    console.log(`\n📊 Found ${posters.length} posters in database:`);

    for (const poster of posters) {
      console.log(`\n🖼️  Poster ID: ${poster._id}`);
      console.log(`   Title: ${poster.title?.en || 'No title'}`);
      console.log(`   Image Path: ${poster.imagePath || 'No image path'}`);
      console.log(`   Active: ${poster.active}`);
      console.log(`   Featured: ${poster.featured}`);

      // Check if image file exists
      if (poster.imagePath) {
        const cleanedPath = poster.imagePath.replace(/^[/\\]+/, '');
        const fullPath = path.join(process.cwd(), cleanedPath);
        
        try {
          const stats = await fs.stat(fullPath);
          console.log(`   ✅ Image file exists (${stats.size} bytes)`);
        } catch (error) {
          console.log(`   ❌ Image file NOT found at: ${fullPath}`);
          
          // Try alternative paths
          const publicPath = path.join(process.cwd(), 'public', cleanedPath);
          try {
            await fs.stat(publicPath);
            console.log(`   ⚠️  Found in public folder: ${publicPath}`);
          } catch {
            console.log(`   ❌ Also not found in public folder`);
          }
        }
      }
    }

    // Check uploads directory structure
    console.log('\n📁 Checking uploads directory structure:');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    try {
      const uploadsExists = await fs.stat(uploadsDir);
      console.log(`✅ Uploads directory exists`);
      
      const postersDir = path.join(uploadsDir, 'posters');
      try {
        const postersDirContents = await fs.readdir(postersDir);
        console.log(`📂 Posters directory contents: ${postersDirContents.join(', ')}`);
        
        // Check each poster subdirectory
        for (const subdir of postersDirContents) {
          const subdirPath = path.join(postersDir, subdir);
          try {
            const subdirStats = await fs.stat(subdirPath);
            if (subdirStats.isDirectory()) {
              const files = await fs.readdir(subdirPath);
              console.log(`   📁 ${subdir}/: ${files.join(', ')}`);
            }
          } catch (error) {
            console.log(`   ❌ Error reading ${subdir}: ${error}`);
          }
        }
      } catch (error) {
        console.log(`❌ Posters directory not found or error: ${error}`);
      }
    } catch (error) {
      console.log(`❌ Uploads directory not found: ${error}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error during debugging:', error);
    process.exit(1);
  }
}

debugPosters();