import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function upsertComponent(filter: any, doc: any) {
  return await Component.findOneAndUpdate(filter, doc, { upsert: true, new: true });
}

async function seedHomeComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Features component for home page
    const featuresDoc = {
      type: 'features',
      page: 'home',
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
      slug: 'home-features'
    };
    await upsertComponent({ type: 'features', page: 'home' }, featuresDoc);
    console.log('✅ Seeded home features component');

    // Stats component for home page
    const statsDoc = {
      type: 'stats',
      page: 'home',
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
      slug: 'home-stats'
    };
    await upsertComponent({ type: 'stats', page: 'home' }, statsDoc);
    console.log('✅ Seeded home stats component');

    // Timeline component for home page
    const timelineDoc = {
      type: 'timeline',
      page: 'home',
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
      slug: 'home-timeline'
    };
    await upsertComponent({ type: 'timeline', page: 'home' }, timelineDoc);
    console.log('✅ Seeded home timeline component');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding home components:', error);
    process.exit(1);
  }
}

seedHomeComponents();