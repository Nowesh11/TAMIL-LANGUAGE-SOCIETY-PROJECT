import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import ProjectItem from '../src/models/ProjectItem';
import User from '../src/models/User';
import RecruitmentForm from '../src/models/RecruitmentForm';

async function run() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);

  const items = await ProjectItem.find({});
  if (!items.length) {
    console.log('No ProjectItem documents found.');
    process.exit(0);
  }

  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000); // opened 1 hour ago
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // closes in 30 days

  // Ensure an admin user exists for createdBy
  const email = 'admin@tamilsociety.org';
  let admin = await User.findOne({ email });
  if (!admin) {
    admin = await User.create({
      email,
      passwordHash: '$2a$10$A1LdUdmockhashforseedonlyfiller1234567890',
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      role: 'admin',
      purchases: []
    });
  }

  let createdCount = 0;
  for (const item of items) {
    try {
      const form = new RecruitmentForm({
        title: {
          en: 'Crew Recruitment',
          ta: 'அணியினர் சேர்க்கை'
        },
        description: {
          en: 'Join our production crew. Share your experience and availability.',
          ta: 'எங்கள் தயாரிப்பு அணியில் சேருங்கள். உங்கள் அனுபவமும் கிடைக்கும் நேரத்தையும் பகிரவும்.'
        },
        role: 'crew',
        isActive: true,
        startDate: start,
        endDate: end,
        maxResponses: 100,
        currentResponses: 0,
        emailNotification: true,
        createdBy: admin._id,
        fields: [
          {
            id: 'experience',
            label: { en: 'Relevant experience', ta: 'தொடர்புடைய அனுபவம்' },
            type: 'textarea',
            required: true,
            order: 1,
            placeholder: { en: 'Describe your experience', ta: 'உங்கள் அனுபவத்தை விளக்குங்கள்' },
            validation: { minLength: 10, maxLength: 1000 }
          },
          {
            id: 'availability',
            label: { en: 'Availability dates', ta: 'கிடைக்கும் தேதிகள்' },
            type: 'text',
            required: true,
            order: 2,
            placeholder: { en: 'e.g., weekends, evenings', ta: 'எ.கா., வார இறுதி, மாலை' }
          },
          {
            id: 'phone',
            label: { en: 'Phone number', ta: 'தொலைபேசி எண்' },
            type: 'tel',
            required: false,
            order: 3
          },
          {
            id: 'portfolio',
            label: { en: 'Portfolio link (optional)', ta: 'செயல்திட்ட இணைப்பு (விருப்பம்)' },
            type: 'url',
            required: false,
            order: 4
          },
          {
            id: 'motivation',
            label: { en: 'Why do you want to join?', ta: 'நீங்கள் ஏன் சேர விரும்புகிறீர்கள்?' },
            type: 'textarea',
            required: true,
            order: 5,
            validation: { minLength: 10, maxLength: 1000 }
          }
        ]
      });
      await form.save();

      item.recruitmentFormId = form._id;
      await item.save();
      createdCount += 1;
      console.log(`Linked crew form ${form._id.toString()} to ProjectItem ${item._id.toString()}`);
    } catch (e) {
      console.error(`Failed to seed for ProjectItem ${item._id?.toString?.()}`, e);
    }
  }

  console.log(`Seeded crew recruitment forms for ${createdCount} project items.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  mongoose.connection.close().catch(() => {});
  process.exit(1);
});