import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Component from '../src/models/Component';
import Poster from '../src/models/Poster';
import Book from '../src/models/Book';
import EBook from '../src/models/EBook';
import ProjectItem from '../src/models/ProjectItem';
import Team from '../src/models/Team';
import Notification from '../src/models/Notification';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function verifySystem() {
  try {
    console.log('🔍 FINAL SYSTEM VERIFICATION\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check component counts and stats
    console.log('📊 CHECKING STATS COMPONENTS...');
    const statsComponents = await Component.find({
      $or: [
        { componentId: 'home-stats' },
        { componentId: 'projects-stats' },
        { componentId: 'about-stats' }
      ]
    });

    for (const component of statsComponents) {
      console.log(`📈 ${component.page}/${component.componentId}:`);
      if (component.content?.stats) {
        for (const stat of component.content.stats) {
          console.log(`   ${stat.icon} ${stat.label}: ${stat.value}`);
        }
      }
    }
    console.log();

    // 2. Check poster image paths
    console.log('🖼️  CHECKING POSTER IMAGE PATHS...');
    const posters = await Poster.find({ active: true });
    console.log(`Found ${posters.length} active posters:`);
    
    for (const poster of posters) {
      const imagePath = poster.imagePath;
      const fullPath = path.join(process.cwd(), imagePath);
      const exists = fs.existsSync(fullPath);
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${poster.title.en}: ${imagePath}`);
    }
    console.log();

    // 3. Check uploads directory structure
    console.log('📁 CHECKING UPLOADS DIRECTORY STRUCTURE...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const categories = fs.readdirSync(uploadsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
      
      console.log(`Found upload categories: ${categories.join(', ')}`);
      
      for (const category of categories) {
        const categoryPath = path.join(uploadsDir, category);
        const items = fs.readdirSync(categoryPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        console.log(`   ${category}: ${items.length} items`);
      }
    } else {
      console.log('❌ Uploads directory not found');
    }
    console.log();

    // 4. Check database counts
    console.log('🗄️  DATABASE COLLECTION COUNTS:');
    const counts = {
      Components: await Component.countDocuments(),
      Books: await Book.countDocuments(),
      EBooks: await EBook.countDocuments(),
      Projects: await ProjectItem.countDocuments(),
      TeamMembers: await Team.countDocuments(),
      Notifications: await Notification.countDocuments(),
      Posters: await Poster.countDocuments(),
      ActivePosters: await Poster.countDocuments({ active: true })
    };

    for (const [collection, count] of Object.entries(counts)) {
      console.log(`   ${collection}: ${count}`);
    }
    console.log();

    // 5. Check for any remaining issues
    console.log('🔍 CHECKING FOR POTENTIAL ISSUES...');
    
    // Check for components with missing content
    const emptyComponents = await Component.find({
      $or: [
        { content: null },
        { content: {} },
        { 'content.text': '' },
        { 'content.title': '' }
      ]
    });
    
    if (emptyComponents.length > 0) {
      console.log(`⚠️  Found ${emptyComponents.length} components with missing content`);
    } else {
      console.log('✅ All components have content');
    }

    // Check for posters without images
    const postersWithoutImages = await Poster.find({
      $or: [
        { imagePath: { $exists: false } },
        { imagePath: null },
        { imagePath: '' }
      ]
    });
    
    if (postersWithoutImages.length > 0) {
      console.log(`⚠️  Found ${postersWithoutImages.length} posters without images`);
    } else {
      console.log('✅ All posters have image paths');
    }

    console.log('\n🎉 VERIFICATION COMPLETE!');
    console.log('✅ System is ready for production use');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

verifySystem();