#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import RecruitmentForm from '../src/models/RecruitmentForm';
import ProjectItem from '../src/models/ProjectItem';

async function connectDB() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
}

async function ensureAdmin() {
  const email = 'admin@tamilsociety.org';
  let admin = await User.findOne({ email });
  if (!admin) {
    const passwordHash = await bcrypt.hash('password123', 10);
    admin = await User.create({
      email,
      passwordHash,
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      role: 'admin',
      purchases: []
    });
    console.log('✅ Admin user created');
  }
  return admin;
}

async function main() {
  await connectDB();
  const admin = await ensureAdmin();

  // Get some project items to link recruitment forms to
  const projectItems = await ProjectItem.find({ type: 'project' }).limit(3);

  const recruitmentForms = [
    {
      title: { 
        en: 'Volunteer Recruitment - Tamil Language Classes', 
        ta: 'தன்னார்வலர் ஆட்சேர்ப்பு - தமிழ் மொழி வகுப்புகள்' 
      },
      description: { 
        en: 'Join our team as a volunteer to help teach Tamil language to community members. We are looking for passionate individuals who want to preserve and promote Tamil culture.',
        ta: 'சமூக உறுப்பினர்களுக்கு தமிழ் மொழி கற்பிக்க உதவ எங்கள் குழுவில் தன்னார்வலராக சேருங்கள். தமிழ் கலாச்சாரத்தைப் பாதுகாக்கவும் ஊக்குவிக்கவும் விரும்பும் ஆர்வமுள்ள நபர்களை நாங்கள் தேடுகிறோம்.'
      },
      role: 'volunteer' as const,
      projectItemId: projectItems[0]?._id,
      fields: [
        {
          id: 'full_name',
          label: { en: 'Full Name', ta: 'முழு பெயர்' },
          type: 'text' as const,
          required: true,
          order: 1,
          placeholder: { en: 'Enter your full name', ta: 'உங்கள் முழு பெயரை உள்ளிடுங்கள்' }
        },
        {
          id: 'email',
          label: { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
          type: 'email' as const,
          required: true,
          order: 2,
          placeholder: { en: 'your.email@example.com', ta: 'உங்கள்.மின்னஞ்சல்@உதாரணம்.com' }
        },
        {
          id: 'phone',
          label: { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
          type: 'tel' as const,
          required: true,
          order: 3,
          placeholder: { en: '+1 (555) 123-4567', ta: '+1 (555) 123-4567' }
        },
        {
          id: 'tamil_proficiency',
          label: { en: 'Tamil Language Proficiency', ta: 'தமிழ் மொழித் திறன்' },
          type: 'select' as const,
          required: true,
          order: 4,
          options: [
            { en: 'Native Speaker', ta: 'தாய்மொழி பேசுபவர்', value: 'native' },
            { en: 'Fluent', ta: 'சரளமாக', value: 'fluent' },
            { en: 'Intermediate', ta: 'நடுநிலை', value: 'intermediate' },
            { en: 'Beginner', ta: 'ஆரம்பநிலை', value: 'beginner' }
          ]
        },
        {
          id: 'teaching_experience',
          label: { en: 'Teaching Experience', ta: 'கற்பித்தல் அனுபவம்' },
          type: 'textarea' as const,
          required: true,
          order: 5,
          placeholder: { en: 'Describe your teaching experience...', ta: 'உங்கள் கற்பித்தல் அனுபவத்தை விவரிக்கவும்...' }
        },
        {
          id: 'availability',
          label: { en: 'Availability', ta: 'கிடைக்கும் நேரம்' },
          type: 'textarea' as const,
          required: true,
          order: 6,
          placeholder: { en: 'When are you available to volunteer?', ta: 'நீங்கள் எப்போது தன்னார்வ சேவை செய்ய கிடைக்கிறீர்கள்?' }
        },
        {
          id: 'motivation',
          label: { en: 'Why do you want to volunteer?', ta: 'நீங்கள் ஏன் தன்னார்வ சேவை செய்ய விரும்புகிறீர்கள்?' },
          type: 'textarea' as const,
          required: true,
          order: 7,
          placeholder: { en: 'Share your motivation...', ta: 'உங்கள் உந்துதலைப் பகிருங்கள்...' }
        }
      ],
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      maxResponses: 50,
      currentResponses: 0,
      emailNotification: true,
      createdBy: admin._id
    },
    {
      title: { 
        en: 'Crew Recruitment - Cultural Event Production', 
        ta: 'குழு ஆட்சேர்ப்பு - கலாச்சார நிகழ்வு தயாரிப்பு' 
      },
      description: { 
        en: 'We are looking for dedicated crew members to help with our upcoming cultural events. Join our production team and help bring Tamil culture to life.',
        ta: 'எங்கள் வரவிருக்கும் கலாச்சார நிகழ்வுகளுக்கு உதவ அர்ப்பணிப்புள்ள குழு உறுப்பினர்களை நாங்கள் தேடுகிறோம். எங்கள் தயாரிப்பு குழுவில் சேர்ந்து தமிழ் கலாச்சாரத்தை உயிர்ப்பிக்க உதவுங்கள்.'
      },
      role: 'crew' as const,
      projectItemId: projectItems[1]?._id,
      fields: [
        {
          id: 'full_name',
          label: { en: 'Full Name', ta: 'முழு பெயர்' },
          type: 'text' as const,
          required: true,
          order: 1
        },
        {
          id: 'email',
          label: { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
          type: 'email' as const,
          required: true,
          order: 2
        },
        {
          id: 'phone',
          label: { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
          type: 'tel' as const,
          required: true,
          order: 3
        },
        {
          id: 'role_interest',
          label: { en: 'Area of Interest', ta: 'ஆர்வமுள்ள பகுதி' },
          type: 'select' as const,
          required: true,
          order: 4,
          options: [
            { en: 'Stage Management', ta: 'மேடை மேலாண்மை', value: 'stage_management' },
            { en: 'Sound & Lighting', ta: 'ஒலி மற்றும் விளக்குகள்', value: 'sound_lighting' },
            { en: 'Costume & Makeup', ta: 'உடை மற்றும் ஒப்பனை', value: 'costume_makeup' },
            { en: 'Photography/Videography', ta: 'புகைப்படம்/வீடியோகிராபி', value: 'photography' },
            { en: 'Event Coordination', ta: 'நிகழ்வு ஒருங்கிணைப்பு', value: 'coordination' }
          ]
        },
        {
          id: 'experience',
          label: { en: 'Relevant Experience', ta: 'தொடர்புடைய அனுபவம்' },
          type: 'textarea' as const,
          required: true,
          order: 5
        },
        {
          id: 'portfolio',
          label: { en: 'Portfolio/Work Samples (Optional)', ta: 'போர்ட்ஃபோலியோ/வேலை மாதிரிகள் (விருப்பம்)' },
          type: 'url' as const,
          required: false,
          order: 6
        }
      ],
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      maxResponses: 30,
      currentResponses: 0,
      emailNotification: true,
      createdBy: admin._id
    },
    {
      title: { 
        en: 'Participant Registration - Tamil Literature Workshop', 
        ta: 'பங்கேற்பாளர் பதிவு - தமிழ் இலக்கிய பட்டறை' 
      },
      description: { 
        en: 'Register to participate in our intensive Tamil literature workshop. Learn from renowned Tamil scholars and poets.',
        ta: 'எங்கள் தீவிர தமிழ் இலக்கிய பட்டறையில் பங்கேற்க பதிவு செய்யுங்கள். புகழ்பெற்ற தமிழ் அறிஞர்கள் மற்றும் கவிஞர்களிடமிருந்து கற்றுக்கொள்ளுங்கள்.'
      },
      role: 'participants' as const,
      projectItemId: projectItems[2]?._id,
      fields: [
        {
          id: 'full_name',
          label: { en: 'Full Name', ta: 'முழு பெயர்' },
          type: 'text' as const,
          required: true,
          order: 1
        },
        {
          id: 'email',
          label: { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
          type: 'email' as const,
          required: true,
          order: 2
        },
        {
          id: 'age',
          label: { en: 'Age', ta: 'வயது' },
          type: 'number' as const,
          required: true,
          order: 3,
          validation: { min: 16, max: 100 }
        },
        {
          id: 'education_level',
          label: { en: 'Education Level', ta: 'கல்வி நிலை' },
          type: 'select' as const,
          required: true,
          order: 4,
          options: [
            { en: 'High School', ta: 'உயர்நிலைப் பள்ளி', value: 'high_school' },
            { en: 'Undergraduate', ta: 'இளங்கலை', value: 'undergraduate' },
            { en: 'Graduate', ta: 'முதுகலை', value: 'graduate' },
            { en: 'Postgraduate', ta: 'முதுகலை பட்டம்', value: 'postgraduate' }
          ]
        },
        {
          id: 'tamil_reading_level',
          label: { en: 'Tamil Reading Level', ta: 'தமிழ் வாசிப்பு நிலை' },
          type: 'select' as const,
          required: true,
          order: 5,
          options: [
            { en: 'Beginner', ta: 'ஆரம்பநிலை', value: 'beginner' },
            { en: 'Intermediate', ta: 'நடுநிலை', value: 'intermediate' },
            { en: 'Advanced', ta: 'மேம்பட்ட', value: 'advanced' },
            { en: 'Expert', ta: 'நிபுணர்', value: 'expert' }
          ]
        },
        {
          id: 'interests',
          label: { en: 'Literary Interests', ta: 'இலக்கிய ஆர்வங்கள்' },
          type: 'textarea' as const,
          required: true,
          order: 6,
          placeholder: { en: 'What aspects of Tamil literature interest you most?', ta: 'தமிழ் இலக்கியத்தின் எந்த அம்சங்கள் உங்களுக்கு மிகவும் ஆர்வமாக உள்ளன?' }
        },
        {
          id: 'expectations',
          label: { en: 'Workshop Expectations', ta: 'பட்டறை எதிர்பார்ப்புகள்' },
          type: 'textarea' as const,
          required: true,
          order: 7,
          placeholder: { en: 'What do you hope to gain from this workshop?', ta: 'இந்த பட்டறையிலிருந்து நீங்கள் என்ன பெற நம்புகிறீர்கள்?' }
        }
      ],
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxResponses: 100,
      currentResponses: 0,
      emailNotification: true,
      createdBy: admin._id
    }
  ];

  for (const formData of recruitmentForms) {
    await RecruitmentForm.findOneAndUpdate(
      { 'title.en': formData.title.en },
      formData,
      { upsert: true, new: true }
    );
    console.log(`✅ Seeded recruitment form: ${formData.title.en}`);
  }

  console.log(`✅ Seeded ${recruitmentForms.length} recruitment forms`);
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed recruitment forms:', err);
  await mongoose.connection.close();
  process.exit(1);
});