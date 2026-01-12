import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProjectItem from '../src/models/ProjectItem.js';
import RecruitmentForm from '../src/models/RecruitmentForm.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function updateProjectRecruitmentLinks() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all recruitment forms
    const recruitmentForms = await RecruitmentForm.find({ isActive: true });
    console.log(`📋 Found ${recruitmentForms.length} active recruitment forms`);
    
    let updatedCount = 0;
    
    for (const form of recruitmentForms) {
      if (form.projectItemId) {
        // Update the corresponding project item
        const result = await ProjectItem.updateOne(
          { _id: form.projectItemId },
          { $set: { recruitmentFormId: form._id } }
        );
        
        if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`✅ Updated project item ${form.projectItemId} with recruitment form ${form._id}`);
        }
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} project items with recruitment form links`);
    
    // Verify the updates
    const projectsWithForms = await ProjectItem.find({ 
      recruitmentFormId: { $exists: true, $ne: null } 
    }).populate('recruitmentFormId');
    
    console.log(`\n📊 Verification: ${projectsWithForms.length} project items now have recruitment forms linked`);
    
    projectsWithForms.forEach(project => {
      console.log(`  📁 ${project.title.en} -> Form: ${project.recruitmentFormId?.title?.en || 'Unknown'}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Update completed successfully');
    
  } catch (error) {
    console.error('❌ Error updating project recruitment links:', error);
    process.exit(1);
  }
}

updateProjectRecruitmentLinks();