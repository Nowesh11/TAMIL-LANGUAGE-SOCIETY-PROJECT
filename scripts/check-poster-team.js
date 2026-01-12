import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';
import Poster from '../src/models/Poster.js';
import Team from '../src/models/Team.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkPosterAndTeam() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check poster components
    const posterComponents = await Component.find({ type: 'poster' });
    console.log(`📋 Found ${posterComponents.length} poster components:`);
    posterComponents.forEach(comp => {
      console.log(`  Page: ${comp.page}, Order: ${comp.order}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    // Check poster data
    const posters = await Poster.find({});
    console.log(`\n🖼️ Found ${posters.length} posters in database:`);
    posters.forEach(poster => {
      console.log(`  Title: ${poster.title}, Active: ${poster.isActive}, Image: ${poster.imageUrl ? 'Yes' : 'No'}`);
    });
    
    // Check team components
    const teamComponents = await Component.find({ type: 'team' });
    console.log(`\n👥 Found ${teamComponents.length} team components:`);
    teamComponents.forEach(comp => {
      console.log(`  Page: ${comp.page}, Order: ${comp.order}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    // Check team data
    const teamMembers = await Team.find({});
    console.log(`\n👤 Found ${teamMembers.length} team members in database:`);
    teamMembers.forEach(member => {
      console.log(`  Name: ${member.name}, Role: ${member.role}, Active: ${member.isActive}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPosterAndTeam();