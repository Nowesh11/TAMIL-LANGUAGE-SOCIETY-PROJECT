#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import ProjectItem from '../src/models/ProjectItem';

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

async function upsertItemByTitleEn(titleEn: string, payload: Record<string, unknown>) {
  await ProjectItem.updateOne({ 'title.en': titleEn }, { $set: payload }, { upsert: true });
}

async function main() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');

  const admin = await ensureAdmin();

  const base = {
    images: ['/vercel.svg', '/globe.svg'],
    heroImagePath: '/vercel.svg',
    goals: {
      en: 'Define clear goals and measurable outcomes to maximize impact.',
      ta: 'தெளிவான இலக்குகள் மற்றும் அளவிடக்கூடிய முடிவுகளை வரையறுக்கவும்.'
    },
    achievement: {
      en: 'Early milestones achieved with strong community engagement.',
      ta: 'வலுவான சமூக ஈடுபாட்டுடன் ஆரம்பகட்ட சாதனைகள்.'
    },
    directorName: {
      en: 'Director Name',
      ta: 'இயக்குநர் பெயர்'
    },
    location: {
      en: 'Global',
      ta: 'உலகம்'
    },
    status: 'active',
    featured: true,
    active: true,
    createdBy: admin._id,
  } as const;

  const items = [
    // Projects (5)
    {
      type: 'project',
      bureau: 'sports_leadership',
      title: { en: 'Leadership Training Camp', ta: 'தலைமைத்திறன் பயிற்சி முகாம்' },
      shortDesc: { en: 'Empowering youth through sports leadership workshops.', ta: 'விளையாட்டு தலைமைத்திறன் வழியில் இளைஞர்களை வலுப்படுத்துதல்.' },
      fullDesc: { en: 'A structured program delivering leadership skills via team sports.', ta: 'அணி விளையாட்டுகள் மூலம் தலைமைத் திறன்களை வழங்கும் அமைப்பான திட்டம்.' }
    },
    {
      type: 'project',
      bureau: 'language_literature',
      title: { en: 'Tamil Literature Digitization', ta: 'தமிழ் இலக்கியம் மின்-ஆக்கம்' },
      shortDesc: { en: 'Digitizing rare Tamil manuscripts for open access.', ta: 'விரைவாக மாறும் தமிழ் கையெழுத்துகள் தன்னிச்சையான அணுகலுக்காக மின்-ஆக்கம்.' },
      fullDesc: { en: 'Preservation initiative to archive and publish classics.', ta: 'காப்பகம் செய்து சிறந்த படைப்புகளை வெளியிடும் பாதுகாப்பு முயற்சி.' }
    },
    {
      type: 'project',
      bureau: 'arts_culture',
      title: { en: 'Cultural Heritage Exhibition', ta: 'பண்பாட்டு பாரம்பரியக் கண்காட்சி' },
      shortDesc: { en: 'Showcasing Tamil art, music, and dance.', ta: 'தமிழ் கலை, இசை, நடனத்தைத் திகழ்த்தல்.' },
      fullDesc: { en: 'A curated exhibition highlighting diverse Tamil culture.', ta: 'தமிழ் பண்பாட்டின் பல்வேறு அம்சங்களை எடுத்துக்காட்டும் தேர்ந்தெடுக்கப்பட்ட கண்காட்சி.' }
    },
    {
      type: 'project',
      bureau: 'social_welfare_voluntary',
      title: { en: 'Community Health Awareness', ta: 'சமூக சுகாதார விழிப்புணர்வு' },
      shortDesc: { en: 'Health camps and awareness sessions for the community.', ta: 'சமூகத்திற்கான சுகாதார முகாம்கள் மற்றும் விழிப்புணர்வு அமர்வுகள்.' },
      fullDesc: { en: 'Collaborations with local clinics to promote wellbeing.', ta: 'உள்ளூர் மருத்துவமனைகளுடன் இணைந்து நலனைக் கட்டியெழுப்புதல்.' }
    },
    {
      type: 'project',
      bureau: 'education_intellectual',
      title: { en: 'Advanced Tamil Language Workshops', ta: 'மேம்பட்ட தமிழ் மொழி பட்டறைகள்' },
      shortDesc: { en: 'Skill-building sessions in grammar, poetry, and prose.', ta: 'இலக்கணம், கவிதை, உரை ஆகியவற்றில் திறனை வளர்த்தல்.' },
      fullDesc: { en: 'Expert-led workshops for intermediate and advanced learners.', ta: 'நிபுணர்களால் வழிநடத்தப்படும் நடுநிலை மற்றும் மேம்பட்ட கற்றலர்களுக்கான பட்டறைகள்.' }
    },

    // Activities (5)
    {
      type: 'activity',
      bureau: 'education_intellectual',
      title: { en: 'Weekly Tamil Classes', ta: 'வாரந்தோறும் தமிழ் வகுப்புகள்' },
      shortDesc: { en: 'Interactive sessions for learners of all ages.', ta: 'அனைத்து வயது கற்றலர்களுக்கான செயல்பாடுகள்.' },
      fullDesc: { en: 'Beginner to advanced modules with certified mentors.', ta: 'சான்றளிக்கப்பட்ட வழிகாட்டிகளுடன் தொடக்க முதல் மேம்பட்ட பகுதிகள்.' }
    },
    {
      type: 'activity',
      bureau: 'social_welfare_voluntary',
      title: { en: 'Community Volunteering Drive', ta: 'சமூக தன்னார்வ இயக்கம்' },
      shortDesc: { en: 'Mobilizing volunteers for local outreach programs.', ta: 'உள்ளூர் அணுகல் திட்டங்களுக்கு தன்னார்வலர்களை இயக்குதல்.' },
      fullDesc: { en: 'Monthly events supporting education and welfare.', ta: 'கல்வி மற்றும் நலனை ஆதரிக்கும் மாதாந்திர நிகழ்வுகள்.' }
    },
    {
      type: 'activity',
      bureau: 'arts_culture',
      title: { en: 'Art and Craft Meetup', ta: 'கலை மற்றும் கைவினைக் கூட்டம்' },
      shortDesc: { en: 'Hands-on sessions exploring traditional Tamil crafts.', ta: 'தமிழின் பாரம்பரிய கைவினைகளை ஆராயும் நேரடி அமர்வுகள்.' },
      fullDesc: { en: 'Community-led meetups fostering creativity and culture.', ta: 'படைப்பாற்றல் மற்றும் பண்பாட்டை ஊக்குவிக்கும் சமூக கூட்டங்கள்.' }
    },
    {
      type: 'activity',
      bureau: 'sports_leadership',
      title: { en: 'Sports Mentoring Sessions', ta: 'விளையாட்டு வழிகாட்டும் அமர்வுகள்' },
      shortDesc: { en: 'Mentorship for youth in team sports and leadership.', ta: 'அணி விளையாட்டுகள் மற்றும் தலைமைத் திறன்களில் இளைஞர்களுக்கு வழிகாட்டுதல்.' },
      fullDesc: { en: 'Weekly sessions focusing on discipline and teamwork.', ta: 'ஒழுக்கம் மற்றும் குழுப்பணியை மையமாகக் கொண்ட வாராந்திர அமர்வுகள்.' }
    },
    {
      type: 'activity',
      bureau: 'language_literature',
      title: { en: 'Book Reading Circle', ta: 'நூல் வாசிப்பு வட்டம்' },
      shortDesc: { en: 'Group readings and discussions of Tamil literature.', ta: 'தமிழ் இலக்கியத்தைப் பற்றிய குழு வாசிப்புகள் மற்றும் விவாதங்கள்.' },
      fullDesc: { en: 'Monthly themes exploring poetry, novels, and essays.', ta: 'கவிதை, நாவல்கள், கட்டுரைகள் ஆகியவற்றை ஆராயும் மாதாந்திர தலைப்புகள்.' }
    },

    // Initiatives (5)
    {
      type: 'initiative',
      bureau: 'language_literature',
      title: { en: 'Open Tamil Knowledge Base', ta: 'திறந்த தமிழ் அறிவுக் களம்' },
      shortDesc: { en: 'Building a community-driven repository of resources.', ta: 'சமூக வழிமுறையில் வளங்களின் தொகுப்பு உருவாக்குதல்.' },
      fullDesc: { en: 'Crowdsourced articles and media to advance learning.', ta: 'கற்றலை முன்னேற்ற கூட்ட முயற்சியில் கட்டுரைகள் மற்றும் ஊடகம்.' }
    },
    {
      type: 'initiative',
      bureau: 'education_intellectual',
      title: { en: 'Research Fellowship Program', ta: 'ஆய்வுத் தோழமை திட்டம்' },
      shortDesc: { en: 'Supporting academic research in Tamil studies.', ta: 'தமிழ் ஆய்வில் கல்வி ஆய்வுகளை ஆதரித்தல்.' },
      fullDesc: { en: 'Grants and mentorship for promising scholars.', ta: 'வாக்குறுதியான ஆய்வாளர்களுக்கு உதவித்தொகை மற்றும் வழிகாட்டுதல்.' }
    },
    {
      type: 'initiative',
      bureau: 'sports_leadership',
      title: { en: 'Youth Leadership Incubator', ta: 'இளைஞர் தலைமைத் திறன் மேம்பாட்டு மையம்' },
      shortDesc: { en: 'Nurturing leadership qualities in young volunteers.', ta: 'இளம் தன்னார்வலர்களின் தலைமைத் திறன்களை வளர்த்தல்.' },
      fullDesc: { en: 'Structured mentorship, workshops, and community projects.', ta: 'ஒழுங்கமைக்கப்பட்ட வழிகாட்டுதல், பட்டறைகள், சமூகத் திட்டங்கள்.' }
    },
    {
      type: 'initiative',
      bureau: 'arts_culture',
      title: { en: 'Cultural Preservation Archive', ta: 'பண்பாட்டு பாதுகாப்பு காப்பகம்' },
      shortDesc: { en: 'Digitally archiving cultural artifacts and oral histories.', ta: 'பண்பாட்டு பொருட்கள் மற்றும் வாய்மொழித் தகவல்களின் மின்காப்பகம்.' },
      fullDesc: { en: 'Community submissions curated for future generations.', ta: 'எதிர்கால தலைமுறைகளுக்காக சமூக சமர்ப்பிப்புகள் தேர்வு.' }
    },
    {
      type: 'initiative',
      bureau: 'social_welfare_voluntary',
      title: { en: 'Social Welfare Aid Network', ta: 'சமூக நல உதவி வலைப்பின்னல்' },
      shortDesc: { en: 'Connecting donors and beneficiaries efficiently.', ta: 'நன்கொடையாளர்கள் மற்றும் பயனாளர்களை திறமையாக இணைத்தல்.' },
      fullDesc: { en: 'Transparent processes to handle aid and outreach.', ta: 'உதவி மற்றும் அணுகலை கையாள வெளிப்படையான செயல்முறைகள்.' }
    },
  ] as const;

  for (const it of items) {
    const doc = {
      type: it.type,
      bureau: it.bureau,
      title: it.title,
      shortDesc: it.shortDesc,
      fullDesc: it.fullDesc,
      ...base,
      startDate: new Date(),
      endDate: undefined,
      budget: undefined,
      participants: undefined,
    } as Partial<ProjectItem>;
    await upsertItemByTitleEn(it.title.en, doc);

    console.log(`✅ Upserted ${it.type}: ${it.title.en}`);
  }

  console.log('✅ Seeded ProjectItem data across types and bureaus');
  await mongoose.connection.close();
}

main().catch(async (err) => {
  console.error('❌ Failed to seed project items:', err);
  await mongoose.connection.close();
  process.exit(1);
});