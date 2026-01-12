const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function seedAllComponents() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log('🌱 Starting comprehensive component seeding...\n');
  
  // Define all components needed for each page
  const componentsToSeed = [
    // HOME PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'home',
      slug: 'home-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'seo',
      page: 'home',
      slug: 'home-seo',
      order: 0,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society - Preserving Tamil Heritage', ta: 'தமிழ் மொழி சங்கம் - தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        description: { en: 'Join the Tamil Language Society to preserve, promote, and celebrate Tamil language and culture through education, literature, and community engagement.', ta: 'கல்வி, இலக்கியம் மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாக்க, ஊக்குவிக்க மற்றும் கொண்டாட தமிழ் மொழி சங்கத்தில் சேருங்கள்.' },
        keywords: 'Tamil language, Tamil culture, Tamil society, Tamil education, Tamil literature',
        ogImage: '/images/og-home.jpg'
      }
    },

    // ABOUT PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'about',
      slug: 'about-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'hero',
      page: 'about',
      slug: 'about-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'About Tamil Language Society', ta: 'தமிழ் மொழி சங்கம் பற்றி' },
        subtitle: { en: 'Preserving Tamil Heritage for Future Generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        description: { en: 'Dedicated to promoting Tamil language, literature, and culture through education, research, and community engagement.', ta: 'கல்வி, ஆராய்ச்சி மற்றும் சமூக ஈடுபாட்டின் மூலம் தமிழ் மொழி, இலக்கியம் மற்றும் கலாச்சாரத்தை ஊக்குவிப்பதில் அர்ப்பணிப்பு.' },
        backgroundImage: '/images/about-hero-bg.svg',
        ctaButton: { text: { en: 'Learn More', ta: 'மேலும் அறிய' }, href: '#our-mission' }
      }
    },
    {
      type: 'text',
      page: 'about',
      slug: 'vision-mission',
      order: 3,
      isActive: true,
      content: {
        title: { en: 'Our Vision & Mission', ta: 'எங்கள் நோக்கம் & பணி' },
        sections: [
          {
            title: { en: 'Vision', ta: 'நோக்கம்' },
            content: { en: 'To be the leading organization in preserving, promoting, and advancing Tamil language and culture globally.', ta: 'உலகளவில் தமிழ் மொழி மற்றும் கலாச்சாரத்தைப் பாதுகாத்தல், ஊக்குவித்தல் மற்றும் முன்னேற்றுவதில் முன்னணி அமைப்பாக இருப்பது.' }
          },
          {
            title: { en: 'Mission', ta: 'பணி' },
            content: { en: 'To create educational opportunities, foster literary excellence, and build bridges between Tamil communities worldwide through innovative programs and digital initiatives.', ta: 'புதுமையான திட்டங்கள் மற்றும் டிஜிட்டல் முயற்சிகளின் மூலம் கல்வி வாய்ப்புகளை உருவாக்குதல், இலக்கிய சிறப்பை வளர்த்தல் மற்றும் உலகளாவிய தமிழ் சமூகங்களுக்கிடையே பாலங்களை கட்டுதல்.' }
          }
        ]
      }
    },
    {
      type: 'seo',
      page: 'about',
      slug: 'about-seo',
      order: 0,
      isActive: true,
      content: {
        title: { en: 'About Us - Tamil Language Society', ta: 'எங்களைப் பற்றி - தமிழ் மொழி சங்கம்' },
        description: { en: 'Learn about Tamil Language Society\'s mission to preserve Tamil heritage, our vision for the future, and meet our dedicated team members.', ta: 'தமிழ் பாரம்பரியத்தைப் பாதுகாக்கும் தமிழ் மொழி சங்கத்தின் பணி, எதிர்காலத்திற்கான எங்கள் நோக்கம் மற்றும் எங்கள் அர்ப்பணிப்புள்ள குழு உறுப்பினர்களைப் பற்றி அறியுங்கள்.' },
        keywords: 'Tamil Language Society, about us, Tamil heritage, Tamil culture, team',
        ogImage: '/images/og-about.jpg'
      }
    },

    // BOOKS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'books',
      slug: 'books-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'seo',
      page: 'books',
      slug: 'books-seo',
      order: 0,
      isActive: true,
      content: {
        title: { en: 'Tamil Books - Tamil Language Society', ta: 'தமிழ் புத்தகங்கள் - தமிழ் மொழி சங்கம்' },
        description: { en: 'Discover our collection of Tamil books including literature, educational materials, and cultural publications. Purchase authentic Tamil books online.', ta: 'இலக்கியம், கல்விப் பொருட்கள் மற்றும் கலாச்சார வெளியீடுகள் உட்பட எங்கள் தமிழ் புத்தகங்களின் தொகுப்பைக் கண்டறியுங்கள். ஆன்லைனில் உண்மையான தமிழ் புத்தகங்களை வாங்குங்கள்.' },
        keywords: 'Tamil books, Tamil literature, Tamil educational books, buy Tamil books online',
        ogImage: '/images/og-books.jpg'
      }
    },
    {
      type: 'footer',
      page: 'books',
      slug: 'books-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // EBOOKS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'ebooks',
      slug: 'ebooks-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'footer',
      page: 'ebooks',
      slug: 'ebooks-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // PROJECTS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'projects',
      slug: 'projects-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'seo',
      page: 'projects',
      slug: 'projects-seo',
      order: 0,
      isActive: true,
      content: {
        title: { en: 'Projects - Tamil Language Society', ta: 'திட்டங்கள் - தமிழ் மொழி சங்கம்' },
        description: { en: 'Explore our innovative projects and initiatives to promote Tamil language and culture. Join our activities and initiatives for Tamil community development.', ta: 'தமிழ் மொழி மற்றும் கலாச்சாரத்தை ஊக்குவிக்க எங்கள் புதுமையான திட்டங்கள் மற்றும் முயற்சிகளை ஆராயுங்கள். தமிழ் சமூக வளர்ச்சிக்கான எங்கள் செயல்பாடுகள் மற்றும் முயற்சிகளில் சேருங்கள்.' },
        keywords: 'Tamil projects, Tamil initiatives, Tamil community, Tamil activities',
        ogImage: '/images/og-projects.jpg'
      }
    },
    {
      type: 'footer',
      page: 'projects',
      slug: 'projects-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // CONTACTS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'contacts',
      slug: 'contacts-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'footer',
      page: 'contacts',
      slug: 'contacts-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // NOTIFICATIONS PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'notifications',
      slug: 'notifications-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'hero',
      page: 'notifications',
      slug: 'notifications-hero',
      order: 2,
      isActive: true,
      content: {
        title: { en: 'Notifications & Updates', ta: 'அறிவிப்புகள் & புதுப்பிப்புகள்' },
        subtitle: { en: 'Stay Updated with Tamil Language Society', ta: 'தமிழ் மொழி சங்கத்துடன் புதுப்பித்த நிலையில் இருங்கள்' },
        description: { en: 'Get the latest news, announcements, and updates from Tamil Language Society.', ta: 'தமிழ் மொழி சங்கத்திலிருந்து சமீபத்திய செய்திகள், அறிவிப்புகள் மற்றும் புதுப்பிப்புகளைப் பெறுங்கள்.' },
        backgroundImage: '/images/notifications-hero-bg.jpg'
      }
    },
    {
      type: 'footer',
      page: 'notifications',
      slug: 'notifications-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // LOGIN PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'login',
      slug: 'login-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'footer',
      page: 'login',
      slug: 'login-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    },

    // SIGNUP PAGE COMPONENTS
    {
      type: 'navbar',
      page: 'signup',
      slug: 'signup-navbar',
      order: 1,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        logo: '/images/logo.png',
        navigation: [
          { label: { en: 'Home', ta: 'முகப்பு' }, href: '/' },
          { label: { en: 'About', ta: 'எங்களைப் பற்றி' }, href: '/about' },
          { label: { en: 'Projects', ta: 'திட்டங்கள்' }, href: '/projects' },
          { label: { en: 'Books', ta: 'புத்தகங்கள்' }, href: '/books' },
          { label: { en: 'E-Books', ta: 'மின்னூல்கள்' }, href: '/ebooks' },
          { label: { en: 'Contact', ta: 'தொடர்பு' }, href: '/contacts' }
        ]
      }
    },
    {
      type: 'footer',
      page: 'signup',
      slug: 'signup-footer',
      order: 100,
      isActive: true,
      content: {
        title: { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' },
        description: { en: 'Preserving Tamil heritage for future generations', ta: 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தைப் பாதுகாத்தல்' },
        links: [
          { label: { en: 'Privacy Policy', ta: 'தனியுரிமைக் கொள்கை' }, href: '/privacy' },
          { label: { en: 'Terms of Service', ta: 'சேவை விதிமுறைகள்' }, href: '/terms' },
          { label: { en: 'Contact Us', ta: 'எங்களைத் தொடர்பு கொள்ளுங்கள்' }, href: '/contacts' }
        ]
      }
    }
  ];

  // Insert components that don't already exist
  let insertedCount = 0;
  let skippedCount = 0;

  for (const component of componentsToSeed) {
    const existing = await db.collection('components').findOne({
      page: component.page,
      slug: component.slug
    });

    if (!existing) {
      await db.collection('components').insertOne({
        ...component,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Added ${component.type} component for ${component.page} page (${component.slug})`);
      insertedCount++;
    } else {
      console.log(`⏭️  Skipped ${component.type} component for ${component.page} page (already exists)`);
      skippedCount++;
    }
  }

  console.log(`\n🎉 Seeding completed!`);
  console.log(`📊 Summary:`);
  console.log(`   - Inserted: ${insertedCount} new components`);
  console.log(`   - Skipped: ${skippedCount} existing components`);
  console.log(`   - Total processed: ${componentsToSeed.length} components`);

  await client.close();
}

seedAllComponents().catch(console.error);