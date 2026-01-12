import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProjectItem from '../src/models/ProjectItem.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function activateProjectItems() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all project items
    const allProjects = await ProjectItem.find({});
    console.log(`📋 Found ${allProjects.length} total project items`);
    
    const activeProjects = allProjects.filter(p => p.active);
    const inactiveProjects = allProjects.filter(p => !p.active);
    
    console.log(`  Active: ${activeProjects.length}`);
    console.log(`  Inactive: ${inactiveProjects.length}`);
    
    if (inactiveProjects.length > 0) {
      console.log('\n🔧 Activating inactive project items...');
      
      for (const project of inactiveProjects) {
        project.active = true;
        await project.save();
        console.log(`✅ Activated: ${project.title.en}`);
      }
      
      console.log(`\n✅ Activated ${inactiveProjects.length} project items`);
    } else {
      console.log('\n✅ All project items are already active');
    }
    
    // Verify final state
    const finalActiveProjects = await ProjectItem.find({ active: true });
    console.log(`\n📊 Final Status: ${finalActiveProjects.length} active project items`);
    
    finalActiveProjects.forEach((project, index) => {
      console.log(`  ${index + 1}. ${project.title.en} - Category: ${project.category}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Project items activation completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

activateProjectItems();