import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import RecruitmentForm from '../src/models/RecruitmentForm.ts';
import ProjectItem from '../src/models/ProjectItem.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function verifyRecruitmentForms() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all recruitment forms
    const recruitmentForms = await RecruitmentForm.find({}).populate('projectItemId');
    console.log(`📋 Found ${recruitmentForms.length} recruitment forms`);
    
    // Get all project items
    const projectItems = await ProjectItem.find({ active: true });
    console.log(`📋 Found ${projectItems.length} active project items`);
    
    // Check recruitment forms by role
    const formsByRole = {
      crew: recruitmentForms.filter(f => f.role === 'crew'),
      volunteer: recruitmentForms.filter(f => f.role === 'volunteer'),
      participants: recruitmentForms.filter(f => f.role === 'participants')
    };
    
    console.log('\n📊 Recruitment Forms by Role:');
    Object.entries(formsByRole).forEach(([role, forms]) => {
      console.log(`  ${role}: ${forms.length} forms`);
    });
    
    // Check which project items have recruitment forms
    console.log('\n🔗 Project Items with Recruitment Forms:');
    for (const project of projectItems) {
      const projectForms = recruitmentForms.filter(f => 
        f.projectItemId && f.projectItemId._id.toString() === project._id.toString()
      );
      
      console.log(`  📁 ${project.title.en}:`);
      if (projectForms.length > 0) {
        projectForms.forEach(form => {
          console.log(`    - ${form.title.en} (${form.role}) - Active: ${form.isActive}`);
        });
      } else {
        console.log(`    - No recruitment forms found`);
      }
    }
    
    // Check for orphaned recruitment forms (forms without valid project items)
    console.log('\n🔍 Checking for orphaned recruitment forms...');
    const orphanedForms = recruitmentForms.filter(f => !f.projectItemId);
    if (orphanedForms.length > 0) {
      console.log(`❌ Found ${orphanedForms.length} orphaned recruitment forms:`);
      orphanedForms.forEach(form => {
        console.log(`  - ${form.title.en} (${form.role})`);
      });
    } else {
      console.log('✅ No orphaned recruitment forms found');
    }
    
    // Check form field structure
    console.log('\n📝 Sample Form Field Structure:');
    if (recruitmentForms.length > 0) {
      const sampleForm = recruitmentForms[0];
      console.log(`Sample form: ${sampleForm.title.en}`);
      console.log(`Fields count: ${sampleForm.fields.length}`);
      sampleForm.fields.forEach((field, index) => {
        console.log(`  ${index + 1}. ${field.label.en} (${field.type}) - Required: ${field.required}`);
      });
    }
    
    // Check active vs inactive forms
    const activeForms = recruitmentForms.filter(f => f.isActive);
    const inactiveForms = recruitmentForms.filter(f => !f.isActive);
    
    console.log('\n📈 Form Status Summary:');
    console.log(`  Active forms: ${activeForms.length}`);
    console.log(`  Inactive forms: ${inactiveForms.length}`);
    console.log(`  Total forms: ${recruitmentForms.length}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Recruitment forms verification completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyRecruitmentForms();