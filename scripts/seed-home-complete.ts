import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

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

async function upsertComponent(filter: any, doc: any) {
  return await Component.findOneAndUpdate(filter, doc, { upsert: true, new: true });
}

async function seedHomeComponents() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const admin = await ensureAdmin();

    // 1. Hero component (order: 1)
    const heroDoc = {
      type: 'hero',
      page: 'home',
      order: 1,
      slug: 'home-hero',
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        subtitle: { en: 'Preserving heritage, promoting culture, empowering community.', ta: 'பாரம்பரியத்தை பாதுகாப்பு, பண்பாட்டை மேம்படுத்து, சமூகத்தை வலுப்படுத்து.' },
        ctas: [
          { text: { en: 'Explore Projects', ta: 'திட்டங்களை பார்க்க' }, href: '/projects', variant: 'primary' },
          { text: { en: 'Shop Books', ta: 'புத்தகங்கள் வாங்க' }, href: '/books', variant: 'secondary' }
        ],
        backgroundImages: [
          { src: '/hero-bg-1.svg', alt: { en: 'Tamil heritage background', ta: 'தமிழ் பாரம்பரிய பின்னணி' } },
          { src: '/hero-bg-2.svg', alt: { en: 'Cultural celebration background', ta: 'கலாச்சார கொண்டாட்ட பின்னணி' } },
          { src: '/hero-bg-3.svg', alt: { en: 'Community growth background', ta: 'சமூக வளர்ச்சி பின்னணி' } }
        ]
      },
      isActive: true,
      createdBy: admin._id
    };
    await upsertComponent({ type: 'hero', page: 'home' }, heroDoc);
    console.log('✅ Seeded home hero component (order: 1)');

    // 2. Features component (order: 2)
    const featuresDoc = {
      type: 'features',
      page: 'home',
      order: 2,
      slug: 'home-features',
      content: {
        title: {
          en: "Why Choose Tamil Language Society",
          ta: "ஏன் தமிழ் மொழி சங்கத்தை தேர்வு செய்ய வேண்டும்"
        },
        subtitle: {
          en: "Discover the benefits of joining our vibrant Tamil community",
          ta: "எங்கள் துடிப்பான தமிழ் சமூகத்தில் சேருவதன் நன்மைகளைக் கண்டறியுங்கள்"
        },
        features: [
          {
            icon: "📚",
            title: {
              en: "Rich Literature",
              ta: "வளமான இலக்கியம்"
            },
            description: {
              en: "Access to extensive collection of Tamil books, poetry, and classical literature",
              ta: "தமிழ் புத்தகங்கள், கவிதைகள் மற்றும் பாரம்பரிய இலக்கியங்களின் விரிவான தொகுப்பிற்கான அணுகல்"
            }
          },
          {
            icon: "🎭",
            title: {
              en: "Cultural Events",
              ta: "கலாச்சார நிகழ்வுகள்"
            },
            description: {
              en: "Regular festivals, performances, and cultural celebrations throughout the year",
              ta: "ஆண்டு முழுவதும் வழக்கமான திருவிழாக்கள், நிகழ்ச்சிகள் மற்றும் கலாச்சார கொண்டாட்டங்கள்"
            }
          },
          {
            icon: "👥",
            title: {
              en: "Community Support",
              ta: "சமூக ஆதரவு"
            },
            description: {
              en: "Connect with fellow Tamil speakers and build lasting friendships",
              ta: "சக தமிழ் பேசுபவர்களுடன் இணைந்து நீடித்த நட்புகளை உருவாக்குங்கள்"
            }
          },
          {
            icon: "🎓",
            title: {
              en: "Educational Programs",
              ta: "கல்வி திட்டங்கள்"
            },
            description: {
              en: "Language classes, workshops, and skill development programs for all ages",
              ta: "அனைத்து வயதினருக்கும் மொழி வகுப்புகள், பயிலரங்குகள் மற்றும் திறன் மேம்பாட்டு திட்டங்கள்"
            }
          }
        ]
      },
      isActive: true,
      createdBy: admin._id
    };
    await upsertComponent({ type: 'features', page: 'home' }, featuresDoc);
    console.log('✅ Seeded home features component (order: 2)');

    // 3. Stats component (order: 3)
    const statsDoc = {
      type: 'stats',
      page: 'home',
      order: 3,
      slug: 'home-stats',
      content: {
        title: {
          en: "Our Impact in Numbers",
          ta: "எண்களில் எங்கள் தாக்கம்"
        },
        subtitle: {
          en: "See how we're making a difference in the Tamil community",
          ta: "தமிழ் சமூகத்தில் நாங்கள் எவ்வாறு மாற்றத்தை ஏற்படுத்துகிறோம் என்பதைப் பாருங்கள்"
        },
        stats: [
          {
            number: "5000+",
            label: {
              en: "Community Members",
              ta: "சமூக உறுப்பினர்கள்"
            },
            description: {
              en: "Active participants in our programs",
              ta: "எங்கள் திட்டங்களில் செயலில் பங்கேற்பாளர்கள்"
            }
          },
          {
            number: "200+",
            label: {
              en: "Cultural Events",
              ta: "கலாச்சார நிகழ்வுகள்"
            },
            description: {
              en: "Organized annually",
              ta: "ஆண்டுதோறும் ஏற்பாடு செய்யப்படுகிறது"
            }
          },
          {
            number: "1000+",
            label: {
              en: "Books Published",
              ta: "வெளியிடப்பட்ட புத்தகங்கள்"
            },
            description: {
              en: "Tamil literature and educational content",
              ta: "தமிழ் இலக்கியம் மற்றும் கல்வி உள்ளடக்கம்"
            }
          },
          {
            number: "50+",
            label: {
              en: "Years of Service",
              ta: "சேவை ஆண்டுகள்"
            },
            description: {
              en: "Preserving Tamil heritage",
              ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்"
            }
          }
        ]
      },
      isActive: true,
      createdBy: admin._id
    };
    await upsertComponent({ type: 'stats', page: 'home' }, statsDoc);
    console.log('✅ Seeded home stats component (order: 3)');

    // 4. Timeline component (order: 4)
    const timelineDoc = {
      type: 'timeline',
      page: 'home',
      order: 4,
      slug: 'home-timeline',
      content: {
        title: {
          en: "Our Journey Through Time",
          ta: "காலத்தின் வழியாக எங்கள் பயணம்"
        },
        subtitle: {
          en: "Milestones in preserving and promoting Tamil culture",
          ta: "தமிழ் கலாச்சாரத்தைப் பாதுகாத்து மேம்படுத்துவதில் மைல்கற்கள்"
        },
        events: [
          {
            year: "1970",
            title: {
              en: "Foundation",
              ta: "அடித்தளம்"
            },
            description: {
              en: "Tamil Language Society was established with a vision to preserve Tamil heritage",
              ta: "தமிழ் பாரம்பரியத்தைப் பாதுகாக்கும் நோக்கத்துடன் தமிழ் மொழி சங்கம் நிறுவப்பட்டது"
            },
            icon: "🏛️"
          },
          {
            year: "1985",
            title: {
              en: "First Cultural Festival",
              ta: "முதல் கலாச்சார விழா"
            },
            description: {
              en: "Organized our inaugural cultural festival, attracting thousands of participants",
              ta: "எங்கள் முதல் கலாச்சார விழாவை ஏற்பாடு செய்து, ஆயிரக்கணக்கான பங்கேற்பாளர்களை ஈர்த்தது"
            },
            icon: "🎭"
          },
          {
            year: "1995",
            title: {
              en: "Educational Programs Launch",
              ta: "கல்வி திட்டங்கள் தொடக்கம்"
            },
            description: {
              en: "Started formal Tamil language classes and educational workshops",
              ta: "முறையான தமிழ் மொழி வகுப்புகள் மற்றும் கல்வி பயிலரங்குகளைத் தொடங்கினோம்"
            },
            icon: "🎓"
          },
          {
            year: "2005",
            title: {
              en: "Digital Library",
              ta: "டிஜிட்டல் நூலகம்"
            },
            description: {
              en: "Launched our digital library with thousands of Tamil books and resources",
              ta: "ஆயிரக்கணக்கான தமிழ் புத்தகங்கள் மற்றும் வளங்களுடன் எங்கள் டிஜிட்டல் நூலகத்தைத் தொடங்கினோம்"
            },
            icon: "💻"
          },
          {
            year: "2020",
            title: {
              en: "Virtual Expansion",
              ta: "மெய்நிகர் விரிவாக்கம்"
            },
            description: {
              en: "Adapted to digital platforms, reaching Tamil communities worldwide",
              ta: "டிஜிட்டல் தளங்களுக்கு ஏற்ப, உலகளவில் தமிழ் சமூகங்களை அடைந்தது"
            },
            icon: "🌐"
          },
          {
            year: "2024",
            title: {
              en: "Modern Platform",
              ta: "நவீன தளம்"
            },
            description: {
              en: "Launched our new comprehensive platform for enhanced community engagement",
              ta: "மேம்பட்ட சமூக ஈடுபாட்டிற்காக எங்கள் புதிய விரிவான தளத்தைத் தொடங்கினோம்"
            },
            icon: "🚀"
          }
        ]
      },
      isActive: true,
      createdBy: admin._id
    };
    await upsertComponent({ type: 'timeline', page: 'home' }, timelineDoc);
    console.log('✅ Seeded home timeline component (order: 4)');

    await mongoose.connection.close();
    console.log('✅ Home components seeding completed');
  } catch (error) {
    console.error('❌ Error seeding home components:', error);
    process.exit(1);
  }
}

seedHomeComponents();