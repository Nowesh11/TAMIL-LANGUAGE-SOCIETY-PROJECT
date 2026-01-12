import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from './src/models/Component.js';
import Team from './src/models/Team.js';
import ProjectItem from './src/models/ProjectItem.js';
import RecruitmentForm from './src/models/RecruitmentForm.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function performFinalVerification() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Performing final verification of Tamil Language Society website...\n');

    // 1. Check Components by Page
    console.log('📋 COMPONENT VERIFICATION:');
    const pages = ['home', 'about', 'projects', 'ebooks', 'books', 'contacts', 'notifications', 'login', 'signup', 'donate'];
    
    for (const page of pages) {
      const components = await Component.find({ page }).sort({ order: 1 });
      const activeComponents = components.filter(c => c.isActive);
      console.log(`  ${page.toUpperCase()}: ${activeComponents.length}/${components.length} active components`);
      
      if (page === 'about') {
        const teamGallery = components.find(c => c.type === 'gallery' && c.slug.includes('team'));
        const teamText = components.find(c => c.type === 'text' && c.slug.includes('team'));
        console.log(`    - Team Gallery: ${teamGallery ? '✅ Found' : '❌ Missing'}`);
        console.log(`    - Team Text: ${teamText ? '✅ Found' : '❌ Missing'}`);
      }
    }

    // 2. Check Team Members
    console.log('\n👥 TEAM VERIFICATION:');
    const teamMembers = await Team.find({ isActive: true }).sort({ orderNum: 1 });
    console.log(`  Active team members: ${teamMembers.length}`);
    
    const roles = {};
    teamMembers.forEach(member => {
      roles[member.role] = (roles[member.role] || 0) + 1;
    });
    
    console.log('  Role distribution:');
    Object.entries(roles).forEach(([role, count]) => {
      console.log(`    - ${role}: ${count}`);
    });

    // 3. Check Project Items
    console.log('\n🚀 PROJECT ITEMS VERIFICATION:');
    const projectItems = await ProjectItem.find({ active: true });
    console.log(`  Active project items: ${projectItems.length}`);
    
    const bureaus = {};
    projectItems.forEach(item => {
      bureaus[item.bureau] = (bureaus[item.bureau] || 0) + 1;
    });
    
    console.log('  Bureau distribution:');
    Object.entries(bureaus).forEach(([bureau, count]) => {
      console.log(`    - ${bureau}: ${count}`);
    });

    // 4. Check Recruitment Forms
    console.log('\n📝 RECRUITMENT FORMS VERIFICATION:');
    const recruitmentForms = await RecruitmentForm.find({ isActive: true });
    console.log(`  Active recruitment forms: ${recruitmentForms.length}`);
    
    const formTypes = {};
    recruitmentForms.forEach(form => {
      formTypes[form.role] = (formTypes[form.role] || 0) + 1;
    });
    
    console.log('  Form type distribution:');
    Object.entries(formTypes).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });

    // 5. Check Form-Project Linking
    console.log('\n🔗 FORM-PROJECT LINKING VERIFICATION:');
    const linkedForms = await RecruitmentForm.find({ 
      isActive: true, 
      projectItemId: { $exists: true, $ne: null } 
    });
    console.log(`  Forms linked to projects: ${linkedForms.length}/${recruitmentForms.length}`);

    // 6. Check for Invalid Component Types
    console.log('\n⚠️  COMPONENT TYPE VALIDATION:');
    const validTypes = ['hero', 'banner', 'text', 'image', 'gallery', 'testimonials', 'stats', 'features', 'cta', 'faq', 'contact-form', 'newsletter', 'social-links', 'video', 'countdown', 'navbar', 'footer', 'seo', 'timeline'];
    const allComponents = await Component.find({});
    const invalidComponents = allComponents.filter(c => !validTypes.includes(c.type));
    
    if (invalidComponents.length > 0) {
      console.log(`  ❌ Found ${invalidComponents.length} components with invalid types:`);
      invalidComponents.forEach(comp => {
        console.log(`    - ${comp.slug} (${comp.type}) on ${comp.page}`);
      });
    } else {
      console.log('  ✅ All components have valid types');
    }

    // 7. Summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log(`  Total Components: ${allComponents.length}`);
    console.log(`  Active Components: ${allComponents.filter(c => c.isActive).length}`);
    console.log(`  Team Members: ${teamMembers.length}`);
    console.log(`  Project Items: ${projectItems.length}`);
    console.log(`  Recruitment Forms: ${recruitmentForms.length}`);
    console.log(`  Form-Project Links: ${linkedForms.length}`);
    
    const healthScore = Math.round(
      ((allComponents.filter(c => c.isActive).length / allComponents.length) * 30 +
       (teamMembers.length > 0 ? 20 : 0) +
       (projectItems.length > 0 ? 20 : 0) +
       (recruitmentForms.length > 0 ? 15 : 0) +
       (linkedForms.length === recruitmentForms.length ? 15 : (linkedForms.length / recruitmentForms.length) * 15))
    );
    
    console.log(`\n🎯 Website Health Score: ${healthScore}/100`);
    
    if (healthScore >= 90) {
      console.log('🎉 Excellent! Website is in great condition.');
    } else if (healthScore >= 75) {
      console.log('👍 Good! Website is functioning well with minor issues.');
    } else if (healthScore >= 60) {
      console.log('⚠️  Fair! Website needs some attention.');
    } else {
      console.log('🚨 Poor! Website requires significant fixes.');
    }

    await mongoose.connection.close();
    console.log('\n✅ Final verification completed');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    await mongoose.connection.close();
  }
}

performFinalVerification();