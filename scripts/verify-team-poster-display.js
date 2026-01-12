import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.ts';
import Team from '../src/models/Team.ts';
import Poster from '../src/models/Poster.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function verifyTeamPosterDisplay() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check team component on about page
    console.log('\n🏠 Checking About Page Components:');
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    console.log(`Found ${aboutComponents.length} components on about page:`);
    aboutComponents.forEach(comp => {
      console.log(`  - Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    const teamComponent = aboutComponents.find(c => c.type === 'team');
    if (teamComponent) {
      console.log('\n👥 Team Component Found:');
      console.log(`  - Order: ${teamComponent.order}`);
      console.log(`  - Active: ${teamComponent.isActive}`);
      console.log(`  - Content:`, JSON.stringify(teamComponent.content, null, 2));
    } else {
      console.log('\n❌ No team component found on about page');
    }
    
    // Check team data
    console.log('\n👥 Team Members Data:');
    const teamMembers = await Team.find({});
    console.log(`Found ${teamMembers.length} team members:`);
    teamMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name.en} (${member.role.en})`);
      console.log(`     Active: ${member.isActive}`);
      console.log(`     Image: ${member.image || 'No image'}`);
    });
    
    // Check home page components
    console.log('\n🏠 Checking Home Page Components:');
    const homeComponents = await Component.find({ page: 'home' }).sort({ order: 1 });
    console.log(`Found ${homeComponents.length} components on home page:`);
    homeComponents.forEach(comp => {
      console.log(`  - Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    const posterComponent = homeComponents.find(c => c.type === 'poster');
    if (posterComponent) {
      console.log('\n🖼️ Poster Component Found:');
      console.log(`  - Order: ${posterComponent.order}`);
      console.log(`  - Active: ${posterComponent.isActive}`);
      console.log(`  - Content:`, JSON.stringify(posterComponent.content, null, 2));
    } else {
      console.log('\n❌ No poster component found on home page');
    }
    
    // Check poster data
    console.log('\n🖼️ Posters Data:');
    const posters = await Poster.find({});
    console.log(`Found ${posters.length} posters:`);
    posters.forEach((poster, index) => {
      console.log(`  ${index + 1}. ${poster.title.en}`);
      console.log(`     Active: ${poster.isActive}`);
      console.log(`     Image: ${poster.image || 'No image'}`);
      console.log(`     Category: ${poster.category}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Verification completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyTeamPosterDisplay();