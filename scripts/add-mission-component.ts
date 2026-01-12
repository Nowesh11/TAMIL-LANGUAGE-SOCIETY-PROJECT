import mongoose from 'mongoose';
import '../src/models/Component';
import '../src/models/User';

const Component = mongoose.model('Component');
const User = mongoose.model('User');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function addMissionComponent() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ Admin user not found');
      process.exit(1);
    }

    // Check if mission component already exists
    const existingMission = await Component.findOne({ 
      type: 'text', 
      page: 'about', 
      slug: 'mission' 
    });

    if (existingMission) {
      console.log('✅ Mission component already exists');
      console.log('Content:', JSON.stringify(existingMission.content, null, 2));
      await mongoose.disconnect();
      return;
    }

    // Create mission component
    const missionComponent = new Component({
      type: 'text',
      page: 'about',
      slug: 'mission',
      content: {
        title: {
          en: 'Our Mission',
          ta: 'எங்கள் பணி'
        },
        content: {
          en: 'To preserve, promote, and propagate the Tamil language and culture worldwide. We are dedicated to fostering Tamil literature, supporting educational initiatives, and building bridges between Tamil communities across the globe. Through our comprehensive programs, we aim to ensure that the rich heritage of Tamil civilization continues to thrive for future generations.',
          ta: 'உலகம் முழுவதும் தமிழ் மொழி மற்றும் கலாச்சாரத்தை பாதுகாத்து, ஊக்குவித்து, பரப்புவது. தமிழ் இலக்கியத்தை வளர்ப்பதிலும், கல்வி முயற்சிகளை ஆதரிப்பதிலும், உலகம் முழுவதும் உள்ள தமிழ் சமூகங்களுக்கிடையே பாலங்களை கட்டுவதிலும் நாங்கள் அர்ப்பணிப்புடன் உள்ளோம். எங்கள் விரிவான திட்டங்களின் மூலம், தமிழ் நாகரிகத்தின் வளமான பாரம்பரியம் எதிர்கால சந்ததியினருக்கு தொடர்ந்து செழிக்க வேண்டும் என்பதை உறுதி செய்வதை நோக்கமாகக் கொண்டுள்ளோம்.'
        },
        alignment: 'center',
        format: 'plain'
      },
      order: 2,
      isActive: true,
      createdBy: admin._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await missionComponent.save();
    console.log('✅ Mission component created successfully');
    console.log('Component ID:', missionComponent._id);
    console.log('Content:', JSON.stringify(missionComponent.content, null, 2));

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error adding mission component:', error);
    process.exit(1);
  }
}

addMissionComponent();