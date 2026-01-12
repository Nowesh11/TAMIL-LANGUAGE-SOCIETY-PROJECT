import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.ts';
import Team from '../src/models/Team.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function fixDuplicateTeamComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check current about page components
    console.log('\n📋 Current About Page Components:');
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    aboutComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    // Find team components
    const teamComponents = aboutComponents.filter(c => c.type === 'team');
    console.log(`\n👥 Found ${teamComponents.length} team components:`);
    teamComponents.forEach(comp => {
      console.log(`  - Order: ${comp.order}, Slug: ${comp.slug}`);
      console.log(`    Content:`, JSON.stringify(comp.content, null, 2));
    });
    
    if (teamComponents.length > 1) {
      console.log('\n🔧 Removing duplicate team components...');
      
      // Keep the first team component and remove others
      const keepComponent = teamComponents[0];
      const removeComponents = teamComponents.slice(1);
      
      for (const comp of removeComponents) {
        await Component.findByIdAndDelete(comp._id);
        console.log(`❌ Removed duplicate team component: ${comp.slug} (order: ${comp.order})`);
      }
      
      // Update the remaining component with proper content
      const updatedContent = {
        title: {
          en: "Meet Our Team",
          ta: "எங்கள் குழுவை சந்திக்கவும்"
        },
        subtitle: {
          en: "Dedicated individuals working towards preserving and promoting Tamil language and culture",
          ta: "தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்து ஊக்குவிப்பதில் அர்பணிப்புடன் பணியாற்றும் நபர்கள்"
        }
      };
      
      keepComponent.content = updatedContent;
      keepComponent.slug = 'about-team';
      await keepComponent.save();
      console.log(`✅ Updated remaining team component: ${keepComponent.slug}`);
    }
    
    // Reorder components to ensure proper sequence
    console.log('\n🔄 Reordering about page components...');
    const updatedComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    
    for (let i = 0; i < updatedComponents.length; i++) {
      const comp = updatedComponents[i];
      const newOrder = i + 1;
      if (comp.order !== newOrder) {
        comp.order = newOrder;
        await comp.save();
        console.log(`📝 Updated ${comp.type} component order to ${newOrder}`);
      }
    }
    
    // Check team data
    console.log('\n👥 Checking Team Members Data:');
    const teamMembers = await Team.find({ isActive: true });
    console.log(`Found ${teamMembers.length} active team members:`);
    teamMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name.en} - ${member.role.en}`);
      console.log(`     Email: ${member.email || 'Not provided'}`);
      console.log(`     Image: ${member.image || 'No image'}`);
    });
    
    // Final verification
    console.log('\n📋 Final About Page Components:');
    const finalComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    finalComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}, Active: ${comp.isActive}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Team components fix completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDuplicateTeamComponents();