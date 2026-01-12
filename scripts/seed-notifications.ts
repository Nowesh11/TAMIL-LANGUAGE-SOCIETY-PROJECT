import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Notification from '../src/models/Notification';
import User from '../src/models/User';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function seedNotifications() {
  try {
    await connectDB();

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('Cleared existing notifications');

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    const notifications = [
      // Announcement notifications
      {
        title: {
          en: "New Tamil Literature Workshop Series",
          ta: "புதிய தமிழ் இலக்கிய பயிற்சி வரிசை"
        },
        message: {
          en: "Join our comprehensive Tamil literature workshop series starting next month. Learn from renowned Tamil scholars and poets.",
          ta: "அடுத்த மாதம் தொடங்கும் எங்கள் விரிவான தமிழ் இலக்கிய பயிற்சி வரிசையில் சேரவும். புகழ்பெற்ற தமிழ் அறிஞர்கள் மற்றும் கவிஞர்களிடமிருந்து கற்றுக்கொள்ளுங்கள்."
        },
        type: 'announcement',
        priority: 'high',
        targetAudience: 'all',
        tags: ['workshop', 'literature', 'education'],
        // imageUrl: '/images/workshop-banner.jpg', // Removed due to URL validation
        // actionUrl: '/views/projects.html', // Removed due to URL validation
        createdBy: adminUser._id,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        title: {
          en: "Annual Tamil Cultural Festival 2025",
          ta: "வருடாந்திர தமிழ் கலாச்சார விழா 2025"
        },
        message: {
          en: "Save the date! Our annual Tamil Cultural Festival will be held on March 15-17, 2025. Registration opens soon.",
          ta: "தேதியை சேமிக்கவும்! எங்கள் வருடாந்திர தமிழ் கலாச்சார விழா மார்ச் 15-17, 2025 அன்று நடைபெறும். பதிவு விரைவில் தொடங்கும்."
        },
        type: 'announcement',
        priority: 'high',
        targetAudience: 'all',
        tags: ['festival', 'culture', 'event'],
        // imageUrl: '/images/festival-2025.jpg', // Removed due to URL validation
        // actionUrl: '/views/contact.html', // Removed due to URL validation
        createdBy: adminUser._id,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      },

      // News notifications
      {
        title: {
          en: "New Digital Library Collection Added",
          ta: "புதிய டிஜிட்டல் நூலக தொகுப்பு சேர்க்கப்பட்டது"
        },
        message: {
          en: "We've added 25 new Tamil ebooks to our digital library, including classic literature and modern works.",
          ta: "எங்கள் டிஜிட்டல் நூலகத்தில் 25 புதிய தமிழ் மின்னூல்களை சேர்த்துள்ளோம், இதில் பாரம்பரிய இலக்கியம் மற்றும் நவீன படைப்புகள் உள்ளன."
        },
        type: 'news',
        priority: 'medium',
        targetAudience: 'all',
        tags: ['ebooks', 'library', 'literature'],
        // imageUrl: '/images/new-books.jpg', // Removed due to URL validation
        actionUrl: '/ebooks', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days
      },
      {
        title: {
          en: "Partnership with Tamil Nadu Government",
          ta: "தமிழ்நாடு அரசுடன் கூட்டாண்மை"
        },
        message: {
          en: "We're proud to announce our new partnership with Tamil Nadu Government for promoting Tamil language education globally.",
          ta: "தமிழ் மொழி கல்வியை உலகளவில் மேம்படுத்துவதற்காக தமிழ்நாடு அரசுடன் எங்கள் புதிய கூட்டாண்மையை அறிவிப்பதில் பெருமை கொள்கிறோம்."
        },
        type: 'news',
        priority: 'high',
        targetAudience: 'all',
        tags: ['partnership', 'government', 'education'],
        // imageUrl: '/images/partnership.jpg', // Removed due to URL validation
        actionUrl: '/about', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },

      // Urgent notifications
      {
        title: {
          en: "Website Maintenance Scheduled",
          ta: "வலைத்தள பராமரிப்பு திட்டமிடப்பட்டுள்ளது"
        },
        message: {
          en: "Our website will undergo maintenance on January 20, 2025, from 2:00 AM to 6:00 AM IST. Some services may be temporarily unavailable.",
          ta: "எங்கள் வலைத்தளம் ஜனவரி 20, 2025 அன்று இந்திய நேரம் காலை 2:00 முதல் 6:00 வரை பராமரிப்பு பணிகளுக்கு உட்படும். சில சேவைகள் தற்காலிகமாக கிடைக்காமல் போகலாம்."
        },
        type: 'urgent',
        priority: 'high',
        targetAudience: 'all',
        tags: ['maintenance', 'website', 'downtime'],
        createdBy: adminUser._id,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        title: {
          en: "Security Update Required",
          ta: "பாதுகாப்பு புதுப்பிப்பு தேவை"
        },
        message: {
          en: "Please update your password for enhanced security. We recommend using a strong password with at least 8 characters.",
          ta: "மேம்பட்ட பாதுகாப்பிற்காக உங்கள் கடவுச்சொல்லை புதுப்பிக்கவும். குறைந்தது 8 எழுத்துகள் கொண்ட வலுவான கடவுச்சொல்லை பயன்படுத்த பரிந்துரைக்கிறோம்."
        },
        type: 'urgent',
        priority: 'medium',
        targetAudience: 'members', // Fixed: changed from 'registered' to 'members'
        tags: ['security', 'password', 'update'],
        actionUrl: '/profile', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      },

      // General notifications
      {
        title: {
          en: "Welcome to Tamil Language Society",
          ta: "தமிழ் மொழி சங்கத்திற்கு வரவேற்கிறோம்"
        },
        message: {
          en: "Thank you for joining our community! Explore our digital library, participate in workshops, and connect with fellow Tamil enthusiasts.",
          ta: "எங்கள் சமூகத்தில் சேர்ந்ததற்கு நன்றி! எங்கள் டிஜிட்டல் நூலகத்தை ஆராயுங்கள், பயிற்சிகளில் பங்கேற்கவும், மற்றும் தமிழ் ஆர்வலர்களுடன் இணைந்து கொள்ளுங்கள்."
        },
        type: 'general',
        priority: 'low',
        targetAudience: 'members', // Fixed: changed from 'registered' to 'members'
        tags: ['welcome', 'community', 'introduction'],
        actionUrl: '/about', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        title: {
          en: "Monthly Newsletter Available",
          ta: "மாதாந்திர செய்திமடல் கிடைக்கிறது"
        },
        message: {
          en: "Our January 2025 newsletter is now available! Read about recent events, upcoming workshops, and community highlights.",
          ta: "எங்கள் ஜனவரி 2025 செய்திமடல் இப்போது கிடைக்கிறது! சமீபத்திய நிகழ்வுகள், வரவிருக்கும் பயிற்சிகள் மற்றும் சமூக சிறப்பம்சங்களைப் பற்றி படிக்கவும்."
        },
        type: 'general',
        priority: 'low',
        targetAudience: 'all',
        tags: ['newsletter', 'monthly', 'updates'],
        actionUrl: '/newsletter', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },

      // Update notifications
      {
        title: {
          en: "New Features Added to Digital Library",
          ta: "டிஜிட்டல் நூலகத்தில் புதிய அம்சங்கள் சேர்க்கப்பட்டன"
        },
        message: {
          en: "We've added new search filters, bookmarking features, and reading progress tracking to enhance your reading experience.",
          ta: "உங்கள் வாசிப்பு அனுபவத்தை மேம்படுத்த புதிய தேடல் வடிகட்டிகள், புக்மார்க் அம்சங்கள் மற்றும் வாசிப்பு முன்னேற்ற கண்காணிப்பு ஆகியவற்றை சேர்த்துள்ளோம்."
        },
        type: 'update',
        priority: 'medium',
        targetAudience: 'all',
        tags: ['features', 'library', 'enhancement'],
        actionUrl: '/ebooks', // Fixed URL format
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
      },
      {
        title: {
          en: "Mobile App Coming Soon",
          ta: "மொபைல் ஆப் விரைவில் வருகிறது"
        },
        message: {
          en: "We're developing a mobile app for easier access to our services. Beta testing will begin next month.",
          ta: "எங்கள் சேவைகளை எளிதாக அணுகுவதற்காக ஒரு மொபைல் ஆப்பை உருவாக்கி வருகிறோம். பீட்டா சோதனை அடுத்த மாதம் தொடங்கும்."
        },
        type: 'update',
        priority: 'medium',
        targetAudience: 'all',
        tags: ['mobile', 'app', 'development'],
        createdBy: adminUser._id,
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      }
    ];

    // Insert notifications
    const insertedNotifications = await Notification.insertMany(notifications);
    console.log(`Successfully seeded ${insertedNotifications.length} notifications`);

    // Display summary
    const typeCounts = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    console.log('\nNotification Summary:');
    typeCounts.forEach(({ _id, count }) => {
      console.log(`- ${_id}: ${count} notifications`);
    });

  } catch (error) {
    console.error('Error seeding notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedNotifications();
}

export default seedNotifications;