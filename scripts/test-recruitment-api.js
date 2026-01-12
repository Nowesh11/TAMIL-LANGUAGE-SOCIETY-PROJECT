import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProjectItem from '../src/models/ProjectItem.js';
import RecruitmentForm from '../src/models/RecruitmentForm.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function testRecruitmentAPI() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get a few project items with recruitment forms
    const projects = await ProjectItem.find({ 
      recruitmentFormId: { $exists: true, $ne: null } 
    }).limit(3).populate('recruitmentFormId');
    
    console.log(`📋 Testing ${projects.length} project items with recruitment forms:\n`);
    
    for (const project of projects) {
      console.log(`🔍 Testing Project: ${project.title.en}`);
      console.log(`   Project ID: ${project._id}`);
      console.log(`   Recruitment Form: ${project.recruitmentFormId?.title?.en || 'None'}`);
      console.log(`   Form Role: ${project.recruitmentFormId?.role || 'N/A'}`);
      console.log(`   Form Active: ${project.recruitmentFormId?.isActive || false}`);
      
      // Test the API endpoint
      try {
        const response = await fetch(`http://localhost:3000/api/project-items/${project._id}/recruitment`);
        const data = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ API Response: ${response.status} - Form found: ${!!data.form}`);
          if (data.form) {
            console.log(`   📝 Form Title: ${data.form.title?.en || 'Unknown'}`);
            console.log(`   🎯 Form Status: ${data.form.status}`);
            console.log(`   📊 Form Fields: ${data.form.fields?.length || 0} fields`);
          }
        } else {
          console.log(`   ❌ API Response: ${response.status} - ${data.error || 'Unknown error'}`);
        }
      } catch (apiError) {
        console.log(`   ❌ API Error: ${apiError.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Error testing recruitment API:', error);
    process.exit(1);
  }
}

testRecruitmentAPI();