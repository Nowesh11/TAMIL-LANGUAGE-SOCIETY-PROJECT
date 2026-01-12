import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.ts';
import Team from '../src/models/Team.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function fixTeamDisplay() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check current about page components
    console.log('\n📋 Current About Page Components:');
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    aboutComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    // Find any components that might be related to team (invalid type 'team')
    const invalidTeamComponents = aboutComponents.filter(c => c.type === 'team');
    console.log(`\n❌ Found ${invalidTeamComponents.length} invalid team components (type: 'team')`);
    
    // Remove invalid team components
    for (const comp of invalidTeamComponents) {
      await Component.findByIdAndDelete(comp._id);
      console.log(`🗑️ Removed invalid team component: ${comp.slug || 'unnamed'} (order: ${comp.order})`);
    }
    
    // Check if there's already a gallery component for team
    const existingGallery = aboutComponents.find(c => c.type === 'gallery' && 
      (c.slug?.includes('team') || c.content?.title?.en?.toLowerCase().includes('team')));
    
    if (existingGallery) {
      console.log('\n✅ Found existing gallery component for team');
    } else {
      // Create a gallery component for team members
      console.log('\n🔧 Creating gallery component for team members...');
      
      // Get team members data
      const teamMembers = await Team.find({ isActive: true });
      console.log(`📋 Found ${teamMembers.length} active team members`);
      
      // Create a default user ID for createdBy
      const defaultUserId = new mongoose.Types.ObjectId();
      
      // Create gallery component with team members
      const teamGalleryComponent = new Component({
        type: 'gallery',
        page: 'about',
        content: {
          title: {
            en: "Meet Our Team",
            ta: "எங்கள் குழுவை சந்திக்கவும்"
          },
          images: teamMembers.map(member => ({
            src: member.image || '/placeholder-avatar.svg',
            alt: {
              en: `${member.name.en} - ${member.role.en}`,
              ta: `${member.name.ta} - ${member.role.ta}`
            }
          })),
          layout: 'grid',
          columns: 3,
          showThumbnails: false
        },
        order: 3, // Place after hero and text components
        isActive: true,
        slug: 'about-team-gallery',
        createdBy: defaultUserId,
        visibility: {
          desktop: true,
          tablet: true,
          mobile: true
        }
      });
      
      await teamGalleryComponent.save();
      console.log('✅ Created team gallery component');
    }
    
    // Also create a text component with team member details
    const existingTeamText = aboutComponents.find(c => c.type === 'text' && 
      (c.slug?.includes('team') || c.content?.title?.en?.toLowerCase().includes('team')));
    
    if (!existingTeamText) {
      console.log('\n🔧 Creating text component for team details...');
      
      const teamMembers = await Team.find({ isActive: true });
      
      // Create team members text content
      let teamTextEn = "Our dedicated team members work tirelessly to preserve and promote Tamil language and culture:\\n\\n";
      let teamTextTa = "எங்கள் அர்பணிப்புள்ள குழு உறுப்பினர்கள் தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்து ஊக்குவிப்பதில் அயராது பணியாற்றுகின்றனர்:\\n\\n";
      
      teamMembers.forEach(member => {
        teamTextEn += `**${member.name.en}** - ${member.role.en}\\n`;
        teamTextTa += `**${member.name.ta}** - ${member.role.ta}\\n`;
        if (member.email) {
          teamTextEn += `Email: ${member.email}\\n`;
          teamTextTa += `மின்னஞ்சல்: ${member.email}\\n`;
        }
        teamTextEn += "\\n";
        teamTextTa += "\\n";
      });
      
      const defaultUserId = new mongoose.Types.ObjectId();
      
      const teamTextComponent = new Component({
        type: 'text',
        page: 'about',
        content: {
          title: {
            en: "Our Team Members",
            ta: "எங்கள் குழு உறுப்பினர்கள்"
          },
          content: {
            en: teamTextEn,
            ta: teamTextTa
          },
          format: 'markdown',
          alignment: 'left'
        },
        order: 4, // Place after gallery
        isActive: true,
        slug: 'about-team-details',
        createdBy: defaultUserId,
        visibility: {
          desktop: true,
          tablet: true,
          mobile: true
        }
      });
      
      await teamTextComponent.save();
      console.log('✅ Created team details text component');
    }
    
    // Reorder all about components
    console.log('\n🔄 Reordering about page components...');
    const updatedComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    
    for (let i = 0; i < updatedComponents.length; i++) {
      const comp = updatedComponents[i];
      const newOrder = i + 1;
      if (comp.order !== newOrder) {
        comp.order = newOrder;
        await comp.save();
        console.log(`📝 Updated ${comp.type} component (${comp.slug}) order to ${newOrder}`);
      }
    }
    
    // Final verification
    console.log('\n📋 Final About Page Components:');
    const finalComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    finalComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    // Check team data
    console.log('\n👥 Team Members Data:');
    const teamMembers = await Team.find({ isActive: true });
    console.log(`Found ${teamMembers.length} active team members:`);
    teamMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name.en} - ${member.role.en}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Team display fix completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixTeamDisplay();