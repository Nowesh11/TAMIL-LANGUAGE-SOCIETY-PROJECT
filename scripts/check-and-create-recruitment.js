import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ProjectItem from '../src/models/ProjectItem.ts';
import RecruitmentForm from '../src/models/RecruitmentForm.ts';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function checkAndCreateRecruitment() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check existing project items
    const projectItems = await ProjectItem.find({});
    console.log(`📋 Found ${projectItems.length} project items:`);
    
    const projectIds = [];
    projectItems.forEach((item, index) => {
      console.log(`  ${index + 1}. ID: ${item._id}`);
      console.log(`     Title: ${item.title.en}`);
      console.log(`     Category: ${item.category}`);
      projectIds.push(item._id);
    });
    
    if (projectIds.length === 0) {
      console.log('❌ No project items found. Creating some sample project items first...');
      
      // Create sample project items
      const sampleProjects = [
        {
          title: { en: 'Tamil Cultural Festival 2024', ta: 'தமிழ் கலாச்சார விழா 2024' },
          description: { en: 'Annual cultural festival celebrating Tamil heritage', ta: 'தமிழ் பாரம்பரியத்தை கொண்டாடும் வருடாந்திர கலாச்சார விழா' },
          category: 'cultural',
          status: 'active',
          isActive: true
        },
        {
          title: { en: 'Tamil Language Workshop', ta: 'தமிழ் மொழி பயிலரங்கம்' },
          description: { en: 'Educational workshop for Tamil language learning', ta: 'தமிழ் மொழி கற்றலுக்கான கல்வி பயிலரங்கம்' },
          category: 'education',
          status: 'active',
          isActive: true
        },
        {
          title: { en: 'Community Outreach Program', ta: 'சமூக விரிவாக்க திட்டம்' },
          description: { en: 'Program to reach out to Tamil communities', ta: 'தமிழ் சமூகங்களை அடைவதற்கான திட்டம்' },
          category: 'community',
          status: 'active',
          isActive: true
        }
      ];
      
      for (const project of sampleProjects) {
        const newProject = await ProjectItem.create(project);
        projectIds.push(newProject._id);
        console.log(`✅ Created project: ${project.title.en}`);
      }
    }
    
    // Create 15 recruitment forms with mixed types
    const recruitmentTypes = ['crew', 'volunteer', 'participants'];
    const forms = [];
    
    // Create a default user ID (you might want to use an actual user ID)
    const defaultUserId = new mongoose.Types.ObjectId();
    
    for (let i = 0; i < 15; i++) {
      const projectItemId = projectIds[i % projectIds.length]; // Cycle through available project IDs
      const role = recruitmentTypes[i % recruitmentTypes.length]; // Cycle through types
      
      const form = {
        projectItemId: projectItemId,
        title: {
          en: `${role.charAt(0).toUpperCase() + role.slice(1)} Application Form ${i + 1}`,
          ta: `${role === 'crew' ? 'குழு' : role === 'volunteer' ? 'தன்னார்வலர்' : 'பங்கேற்பாளர்கள்'} விண்ணப்ப படிவம் ${i + 1}`
        },
        description: {
          en: `Application form for ${role} positions in our projects`,
          ta: `எங்கள் திட்டங்களில் ${role === 'crew' ? 'குழு' : role === 'volunteer' ? 'தன்னார்வலர்' : 'பங்கேற்பாளர்கள்'} பதவிகளுக்கான விண்ணப்ப படிவம்`
        },
        role: role,
        createdBy: defaultUserId,
        fields: [
          {
            id: `fullName_${i}`,
            label: { en: 'Full Name', ta: 'முழு பெயர்' },
            type: 'text',
            required: true,
            order: 1
          },
          {
            id: `email_${i}`,
            label: { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
            type: 'email',
            required: true,
            order: 2
          },
          {
            id: `phone_${i}`,
            label: { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
            type: 'tel',
            required: true,
            order: 3
          },
          {
            id: `experience_${i}`,
            label: { en: 'Relevant Experience', ta: 'தொடர்புடைய அனுபவம்' },
            type: 'textarea',
            required: false,
            order: 4
          },
          {
            id: `motivation_${i}`,
            label: { en: 'Why do you want to join?', ta: 'நீங்கள் ஏன் சேர விரும்புகிறீர்கள்?' },
            type: 'textarea',
            required: true,
            order: 5
          }
        ],
        isActive: true
      };
      
      forms.push(form);
    }
    
    // Clear existing recruitment forms and insert new ones
    await RecruitmentForm.deleteMany({});
    console.log('🗑️ Cleared existing recruitment forms');
    
    const createdForms = await RecruitmentForm.insertMany(forms);
    console.log(`✅ Created ${createdForms.length} recruitment forms`);
    
    // Summary
    console.log('\n📊 Recruitment Forms Summary:');
    const crewCount = createdForms.filter(f => f.role === 'crew').length;
    const volunteerCount = createdForms.filter(f => f.role === 'volunteer').length;
    const participantsCount = createdForms.filter(f => f.role === 'participants').length;
    
    console.log(`- Crew forms: ${crewCount}`);
    console.log(`- Volunteer forms: ${volunteerCount}`);
    console.log(`- Participants forms: ${participantsCount}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Process completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndCreateRecruitment();