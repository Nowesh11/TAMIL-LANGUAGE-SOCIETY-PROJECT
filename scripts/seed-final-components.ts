import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function upsertComponent(filter: any, doc: any) {
  return await Component.findOneAndUpdate(filter, doc, { upsert: true, new: true });
}

async function seedFinalComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Check current count
    const currentCount = await Component.countDocuments();
    console.log(`📊 Current component count: ${currentCount}`);

    if (currentCount >= 59) {
      console.log('✅ Already have 59 or more components!');
      await mongoose.disconnect();
      return;
    }

    const needed = 59 - currentCount;
    console.log(`🎯 Need ${needed} more components to reach 59`);

    // Add CTA component for ebooks page
    const ebooksCTADoc = {
      type: 'cta',
      page: 'ebooks',
      content: {
        title: {
          en: "Start Reading Today",
          ta: "இன்றே படிக்க ஆரம்பியுங்கள்"
        },
        subtitle: {
          en: "Join thousands of readers exploring Tamil literature digitally",
          ta: "டிஜிட்டல் முறையில் தமிழ் இலக்கியத்தை ஆராயும் ஆயிரக்கணக்கான வாசகர்களுடன் சேருங்கள்"
        },
        primaryCTA: {
          text: {
            en: "Browse Ebooks",
            ta: "மின்புத்தகங்களைப் பார்க்க"
          },
          href: "/ebooks",
          variant: "primary"
        },
        secondaryCTA: {
          text: {
            en: "Create Account",
            ta: "கணக்கு உருவாக்க"
          },
          href: "/signup",
          variant: "secondary"
        },
        backgroundImage: {
          src: "/images/ebooks-cta-bg.jpg",
          alt: {
            en: "Digital reading background",
            ta: "டிஜிட்டல் வாசிப்பு பின்னணி"
          }
        }
      },
      slug: 'ebooks-cta'
    };
    await upsertComponent({ type: 'cta', page: 'ebooks' }, ebooksCTADoc);
    console.log('✅ Added ebooks CTA component');

    // Add stats component for about page
    const aboutStatsDoc = {
      type: 'stats',
      page: 'about',
      content: {
        title: {
          en: "Our Achievements",
          ta: "எங்கள் சாதனைகள்"
        },
        subtitle: {
          en: "Milestones in preserving and promoting Tamil culture",
          ta: "தமிழ் கலாச்சாரத்தைப் பாதுகாத்து மேம்படுத்துவதில் மைல்கற்கள்"
        },
        stats: [
          {
            number: "50+",
            label: {
              en: "Years of Service",
              ta: "சேவை ஆண்டுகள்"
            },
            description: {
              en: "Dedicated to Tamil heritage",
              ta: "தமிழ் பாரம்பரியத்திற்கு அர்ப்பணிப்பு"
            }
          },
          {
            number: "5000+",
            label: {
              en: "Active Members",
              ta: "செயலில் உள்ள உறுப்பினர்கள்"
            },
            description: {
              en: "Growing community",
              ta: "வளர்ந்து வரும் சமூகம்"
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
              ta: "ஆண்டுதோறும் ஏற்பாடு"
            }
          },
          {
            number: "1000+",
            label: {
              en: "Publications",
              ta: "வெளியீடுகள்"
            },
            description: {
              en: "Books and resources",
              ta: "புத்தகங்கள் மற்றும் வளங்கள்"
            }
          }
        ]
      },
      slug: 'about-stats'
    };
    await upsertComponent({ type: 'stats', page: 'about' }, aboutStatsDoc);
    console.log('✅ Added about stats component');

    // Check final count
    const finalCount = await Component.countDocuments();
    console.log(`\n🎯 Final component count: ${finalCount}/59`);

    if (finalCount === 59) {
      console.log('🎉 Successfully reached exactly 59 components!');
    } else if (finalCount > 59) {
      console.log(`⚠️  Exceeded target: ${finalCount} components (${finalCount - 59} over)`);
    } else {
      console.log(`⚠️  Still need ${59 - finalCount} more components`);
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding final components:', error);
    process.exit(1);
  }
}

seedFinalComponents();