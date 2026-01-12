import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Team from '../src/models/Team.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function fixTeamRoles() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all team members
    const teamMembers = await Team.find({});
    console.log(`📋 Found ${teamMembers.length} team members`);
    
    // Valid roles from the enum
    const validRoles = [
      "President",
      "Vice President", 
      "Secretary",
      "Treasurer"
    ];
    
    // Fix team members with undefined or missing roles
    for (let i = 0; i < teamMembers.length; i++) {
      const member = teamMembers[i];
      
      if (!member.role || !validRoles.includes(member.role)) {
        const roleIndex = i % validRoles.length;
        member.role = validRoles[roleIndex];
        
        // Fix phone number format if invalid
        if (member.phone && !/^(\+?6?0?1[0-9]{8,9}|[\+]?[1-9][\d]{7,15})$/.test(member.phone)) {
          member.phone = `+60${Math.floor(Math.random() * 900000000) + 100000000}`;
        }
        
        await member.save();
        console.log(`🔧 Fixed role for ${member.name.en}: ${member.role}`);
      } else {
        console.log(`✅ ${member.name.en} already has role: ${member.role}`);
      }
    }
    
    // Verify the fix
    console.log('\n👥 Updated Team Members:');
    const updatedMembers = await Team.find({ isActive: true });
    updatedMembers.forEach((member, index) => {
      console.log(`  ${index + 1}. ${member.name.en} - ${member.role}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Team roles fix completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixTeamRoles();