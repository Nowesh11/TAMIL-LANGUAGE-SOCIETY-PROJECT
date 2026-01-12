import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function upsertComponent(filter: any, doc: any) {
  return await Component.findOneAndUpdate(filter, doc, { upsert: true, new: true });
}

async function seedEbooksMissingComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Text component for ebooks page
    const textDoc = {
      type: 'text',
      page: 'ebooks',
      content: {
        title: {
          en: "Digital Tamil Literature",
          ta: "டிஜிட்டல் தமிழ் இலக்கியம்"
        },
        subtitle: {
          en: "Access thousands of Tamil ebooks anytime, anywhere",
          ta: "எந்த நேரத்திலும், எங்கிருந்தும் ஆயிரக்கணக்கான தமிழ் மின்புத்தகங்களை அணுகுங்கள்"
        },
        content: {
          en: "Our digital library offers an extensive collection of Tamil ebooks covering literature, poetry, history, culture, and educational content. Read online or download for offline reading on any device.",
          ta: "எங்கள் டிஜிட்டல் நூலகம் இலக்கியம், கவிதை, வரலாறு, கலாச்சாரம் மற்றும் கல்வி உள்ளடக்கத்தை உள்ளடக்கிய தமிழ் மின்புத்தகங்களின் விரிவான தொகுப்பை வழங்குகிறது. ஆன்லைனில் படிக்கவும் அல்லது எந்த சாதனத்திலும் ஆஃப்லைன் வாசிப்பிற்காக பதிவிறக்கம் செய்யவும்."
        }
      },
      slug: 'ebooks-text'
    };
    await upsertComponent({ type: 'text', page: 'ebooks' }, textDoc);
    console.log('✅ Seeded ebooks text component');

    // SEO component for ebooks page
    const seoDoc = {
      type: 'seo',
      page: 'ebooks',
      content: {
        title: {
          en: "Tamil Ebooks - Digital Library | Tamil Language Society",
          ta: "தமிழ் மின்புத்தகங்கள் - டிஜிட்டல் நூலகம் | தமிழ் மொழி சங்கம்"
        },
        description: {
          en: "Explore our vast collection of Tamil ebooks including literature, poetry, educational content, and cultural works. Read online or download for free.",
          ta: "இலக்கியம், கவிதை, கல்வி உள்ளடக்கம் மற்றும் கலாச்சார படைப்புகள் உட்பட எங்கள் பரந்த தமிழ் மின்புத்தக தொகுப்பை ஆராயுங்கள். ஆன்லைனில் படிக்கவும் அல்லது இலவசமாக பதிவிறக்கம் செய்யவும்."
        },
        keywords: {
          en: "Tamil ebooks, digital library, Tamil literature, Tamil poetry, Tamil books online, free Tamil ebooks, Tamil educational content",
          ta: "தமிழ் மின்புத்தகங்கள், டிஜிட்டல் நூலகம், தமிழ் இலக்கியம், தமிழ் கவிதை, ஆன்லைன் தமிழ் புத்தகங்கள், இலவச தமிழ் மின்புத்தகங்கள், தமிழ் கல்வி உள்ளடக்கம்"
        },
        ogImage: "/images/ebooks-og.jpg",
        canonical: "/ebooks"
      },
      slug: 'ebooks-seo'
    };
    await upsertComponent({ type: 'seo', page: 'ebooks' }, seoDoc);
    console.log('✅ Seeded ebooks SEO component');

    // Features component for ebooks page
    const featuresDoc = {
      type: 'features',
      page: 'ebooks',
      content: {
        title: {
          en: "Digital Reading Features",
          ta: "டிஜிட்டல் வாசிப்பு அம்சங்கள்"
        },
        subtitle: {
          en: "Enhanced reading experience with modern features",
          ta: "நவீன அம்சங்களுடன் மேம்பட்ட வாசிப்பு அனுபவம்"
        },
        features: [
          {
            icon: "📱",
            title: {
              en: "Multi-Device Access",
              ta: "பல சாதன அணுகல்"
            },
            description: {
              en: "Read on any device - phone, tablet, or computer with seamless synchronization",
              ta: "எந்த சாதனத்திலும் படிக்கவும் - தொலைபேசி, டேப்லெட் அல்லது கணினி தடையற்ற ஒத்திசைவுடன்"
            }
          },
          {
            icon: "🔍",
            title: {
              en: "Advanced Search",
              ta: "மேம்பட்ட தேடல்"
            },
            description: {
              en: "Find books by title, author, genre, or content with powerful search filters",
              ta: "சக்திவாய்ந்த தேடல் வடிப்பான்களுடன் தலைப்பு, ஆசிரியர், வகை அல்லது உள்ளடக்கத்தின் மூலம் புத்தகங்களைக் கண்டறியுங்கள்"
            }
          },
          {
            icon: "🎨",
            title: {
              en: "Customizable Reading",
              ta: "தனிப்பயனாக்கக்கூடிய வாசிப்பு"
            },
            description: {
              en: "Adjust font size, background color, and reading mode for comfortable reading",
              ta: "வசதியான வாசிப்பிற்காக எழுத்துரு அளவு, பின்னணி நிறம் மற்றும் வாசிப்பு முறையை சரிசெய்யுங்கள்"
            }
          },
          {
            icon: "📚",
            title: {
              en: "Personal Library",
              ta: "தனிப்பட்ட நூலகம்"
            },
            description: {
              en: "Create your personal collection with bookmarks, notes, and reading progress",
              ta: "புக்மார்க்குகள், குறிப்புகள் மற்றும் வாசிப்பு முன்னேற்றத்துடன் உங்கள் தனிப்பட்ட தொகுப்பை உருவாக்குங்கள்"
            }
          },
          {
            icon: "⬇️",
            title: {
              en: "Offline Reading",
              ta: "ஆஃப்லைன் வாசிப்பு"
            },
            description: {
              en: "Download books for offline reading without internet connection",
              ta: "இணைய இணைப்பு இல்லாமல் ஆஃப்லைன் வாசிப்பிற்காக புத்தகங்களைப் பதிவிறக்கம் செய்யுங்கள்"
            }
          },
          {
            icon: "🔄",
            title: {
              en: "Regular Updates",
              ta: "வழக்கமான புதுப்பிப்புகள்"
            },
            description: {
              en: "New books added regularly with latest Tamil literature and publications",
              ta: "சமீபத்திய தமிழ் இலக்கியம் மற்றும் வெளியீடுகளுடன் வழக்கமாக புதிய புத்தகங்கள் சேர்க்கப்படுகின்றன"
            }
          }
        ]
      },
      slug: 'ebooks-features'
    };
    await upsertComponent({ type: 'features', page: 'ebooks' }, featuresDoc);
    console.log('✅ Seeded ebooks features component');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding ebooks missing components:', error);
    process.exit(1);
  }
}

seedEbooksMissingComponents();