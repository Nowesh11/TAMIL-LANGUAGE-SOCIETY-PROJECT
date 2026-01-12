import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function seedRecruitmentComponents() {
  await connectDB();

  // Find or create admin user
  let admin = await User.findOne({ email: 'admin@tamilsociety.org' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@tamilsociety.org',
      password: 'hashedpassword',
      role: 'admin'
    });
  }

  // Seed hero component for recruitment page
  await Component.findOneAndUpdate(
    { type: 'hero', page: 'recruitment', slug: 'recruitment-hero' },
    {
      type: 'hero',
      page: 'recruitment',
      content: {
        title: {
          en: 'Join Our Mission',
          ta: 'எங்கள் நோக்கத்தில் சேரவும்'
        },
        subtitle: {
          en: 'Be part of preserving and promoting Tamil language and culture',
          ta: 'தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாத்து மேம்படுத்துவதில் பங்கேற்கவும்'
        },
        description: {
          en: 'Discover exciting career opportunities with the Tamil Language Society. Join our dedicated team working to preserve Tamil heritage for future generations.',
          ta: 'தமிழ் மொழி சங்கத்துடன் அற்புதமான வேலைவாய்ப்புகளைக் கண்டறியுங்கள். எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாக்க உழைக்கும் எங்கள் அர்பணிப்புள்ள குழுவில் சேரவும்.'
        },
        backgroundImages: [
          { src: '/hero-bg-1.svg', alt: { en: 'Career opportunities background', ta: 'வேலைவாய்ப்பு பின்னணி' } },
          { src: '/hero-bg-2.svg', alt: { en: 'Join our team background', ta: 'எங்கள் குழுவில் சேர பின்னணி' } },
          { src: '/hero-bg-3.svg', alt: { en: 'Tamil culture preservation', ta: 'தமிழ் பண்பாடு பாதுகாப்பு' } }
        ],
        buttons: [
          {
            text: { en: 'View Open Positions', ta: 'திறந்த பதவிகளைப் பார்க்கவும்' },
            href: '#positions',
            variant: 'primary'
          },
          {
            text: { en: 'Learn About Us', ta: 'எங்களைப் பற்றி அறியவும்' },
            href: '/about',
            variant: 'secondary'
          }
        ],
        alignment: 'center'
      },
      order: 1,
      isActive: true,
      createdBy: admin._id,
      slug: 'recruitment-hero'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded recruitment page hero component');

  // Seed text section about working with us
  await Component.findOneAndUpdate(
    { type: 'text', page: 'recruitment', slug: 'why-join-us' },
    {
      type: 'text',
      page: 'recruitment',
      content: {
        title: {
          en: 'Why Work With Us?',
          ta: 'ஏன் எங்களுடன் பணியாற்ற வேண்டும்?'
        },
        content: {
          en: 'Join a passionate team dedicated to preserving Tamil language and culture. We offer competitive benefits, professional development opportunities, and the chance to make a meaningful impact in the Tamil community worldwide.',
          ta: 'தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாப்பதில் அர்பணிப்புள்ள ஒரு உற்சாகமான குழுவில் சேரவும். நாங்கள் போட்டித்தன்மையான நன்மைகள், தொழில்முறை வளர்ச்சி வாய்ப்புகள் மற்றும் உலகளாவிய தமிழ் சமூகத்தில் அர்த்தமுள்ள தாக்கத்தை ஏற்படுத்தும் வாய்ப்பை வழங்குகிறோம்.'
        },
        alignment: 'center'
      },
      order: 2,
      isActive: true,
      createdBy: admin._id,
      slug: 'why-join-us'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded recruitment page text section');

  // Seed features component highlighting benefits
  await Component.findOneAndUpdate(
    { type: 'features', page: 'recruitment', slug: 'employee-benefits' },
    {
      type: 'features',
      page: 'recruitment',
      content: {
        title: {
          en: 'Employee Benefits',
          ta: 'ஊழியர் நன்மைகள்'
        },
        subtitle: {
          en: 'Comprehensive benefits package for our team members',
          ta: 'எங்கள் குழு உறுப்பினர்களுக்கான விரிவான நன்மைகள் தொகுப்பு'
        },
        features: [
          {
            title: { en: 'Competitive Salary', ta: 'போட்டித்தன்மையான சம்பளம்' },
            description: { en: 'Fair compensation based on experience and skills', ta: 'அனுபவம் மற்றும் திறமைகளின் அடிப்படையில் நியாயமான ஊதியம்' },
            icon: 'fas fa-dollar-sign'
          },
          {
            title: { en: 'Professional Development', ta: 'தொழில்முறை வளர்ச்சி' },
            description: { en: 'Training programs and career advancement opportunities', ta: 'பயிற்சி திட்டங்கள் மற்றும் தொழில் முன்னேற்ற வாய்ப்புகள்' },
            icon: 'fas fa-graduation-cap'
          },
          {
            title: { en: 'Flexible Work', ta: 'நெகிழ்வான பணி' },
            description: { en: 'Remote work options and flexible scheduling', ta: 'தொலைநிலை பணி விருப்பங்கள் மற்றும் நெகிழ்வான அட்டவணை' },
            icon: 'fas fa-clock'
          },
          {
            title: { en: 'Health Benefits', ta: 'சுகாதார நன்மைகள்' },
            description: { en: 'Comprehensive health insurance coverage', ta: 'விரிவான சுகாதார காப்பீட்டு கவரேஜ்' },
            icon: 'fas fa-heart'
          },
          {
            title: { en: 'Cultural Impact', ta: 'பண்பாட்டு தாக்கம்' },
            description: { en: 'Make a difference in preserving Tamil heritage', ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாப்பதில் மாற்றத்தை ஏற்படுத்துங்கள்' },
            icon: 'fas fa-globe'
          },
          {
            title: { en: 'Team Environment', ta: 'குழு சூழல்' },
            description: { en: 'Collaborative and supportive work culture', ta: 'ஒத்துழைப்பு மற்றும் ஆதரவான பணி கலாச்சாரம்' },
            icon: 'fas fa-users'
          }
        ]
      },
      order: 3,
      isActive: true,
      createdBy: admin._id,
      slug: 'employee-benefits'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded recruitment page features component');

  // Seed CTA component for applications
  await Component.findOneAndUpdate(
    { type: 'cta', page: 'recruitment', slug: 'apply-now-cta' },
    {
      type: 'cta',
      page: 'recruitment',
      content: {
        title: {
          en: 'Ready to Join Us?',
          ta: 'எங்களுடன் சேர தயாரா?'
        },
        description: {
          en: 'Take the next step in your career and become part of our mission to preserve and promote Tamil language and culture.',
          ta: 'உங்கள் தொழில் வாழ்க்கையில் அடுத்த படியை எடுத்து, தமிழ் மொழி மற்றும் பண்பாட்டைப் பாதுகாத்து மேம்படுத்தும் எங்கள் நோக்கத்தின் ஒரு பகுதியாக மாறுங்கள்.'
        },
        buttons: [
          {
            text: { en: 'Apply Now', ta: 'இப்போது விண்ணப்பிக்கவும்' },
            href: '/contacts',
            variant: 'primary'
          },
          {
            text: { en: 'Contact HR', ta: 'HR ஐ தொடர்பு கொள்ளவும்' },
            href: '/contacts',
            variant: 'secondary'
          }
        ]
      },
      order: 4,
      isActive: true,
      createdBy: admin._id,
      slug: 'apply-now-cta'
    },
    { upsert: true, new: true }
  );

  console.log('✅ Seeded recruitment page CTA component');

  await mongoose.disconnect();
  console.log('✅ Recruitment components seeded successfully');
}

seedRecruitmentComponents().catch(async (error) => {
  console.error('❌ Failed to seed recruitment components:', error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});