import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.ts';
import Team from '../src/models/Team.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function updateTeamComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get team members with their updated roles
    const teamMembers = await Team.find({ isActive: true }).sort({ orderNum: 1 });
    console.log(`📋 Found ${teamMembers.length} active team members`);
    
    // Find team-related components
    const teamGallery = await Component.findOne({ 
      page: 'about', 
      type: 'gallery', 
      slug: 'about-team-gallery' 
    });
    
    const teamText = await Component.findOne({ 
      page: 'about', 
      type: 'text', 
      slug: 'about-team-details' 
    });
    
    if (teamGallery) {
      console.log('\n🔧 Updating team gallery component...');
      
      // Update gallery with team member images and proper alt text
      teamGallery.content.images = teamMembers.map(member => ({
        src: member.imagePath || '/placeholder-avatar.svg',
        alt: {
          en: `${member.name.en} - ${member.role}`,
          ta: `${member.name.ta} - ${member.role}`
        }
      }));
      
      await teamGallery.save();
      console.log('✅ Updated team gallery component');
    }
    
    if (teamText) {
      console.log('\n🔧 Updating team text component...');
      
      // Create updated team text content
      let teamTextEn = "Our dedicated team members work tirelessly to preserve and promote Tamil language and culture:\\n\\n";
      let teamTextTa = "எங்கள் அர்பணிப்புள்ள குழு உறுப்பினர்கள் தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்து ஊக்குவிப்பதில் அயராது பணியாற்றுகின்றனர்:\\n\\n";
      
      teamMembers.forEach(member => {
        teamTextEn += `**${member.name.en}** - ${member.role}\\n`;
        teamTextTa += `**${member.name.ta}** - ${member.role}\\n`;
        if (member.email) {
          teamTextEn += `Email: ${member.email}\\n`;
          teamTextTa += `மின்னஞ்சல்: ${member.email}\\n`;
        }
        if (member.bio && member.bio.en) {
          teamTextEn += `${member.bio.en}\\n`;
          teamTextTa += `${member.bio.ta}\\n`;
        }
        teamTextEn += "\\n";
        teamTextTa += "\\n";
      });
      
      teamText.content.content = {
        en: teamTextEn,
        ta: teamTextTa
      };
      
      await teamText.save();
      console.log('✅ Updated team text component');
    }
    
    // Verify final components
    console.log('\n📋 Final Team Components:');
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    aboutComponents.forEach(comp => {
      if (comp.slug && comp.slug.includes('team')) {
        console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
      }
    });
    
    console.log('\n👥 Team Members in Components:');
    teamMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name.en} - ${member.role}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Team components update completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateTeamComponents();