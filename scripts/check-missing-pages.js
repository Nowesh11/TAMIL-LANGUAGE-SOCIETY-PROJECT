const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const componentSchema = new mongoose.Schema({
  type: String,
  page: String,
  slug: String,
  order: Number,
  content: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true }
});

const Component = mongoose.model('Component', componentSchema);

async function checkMissingPages() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const loginComponents = await Component.find({ page: 'login' }).sort({ order: 1 });
    console.log(`📋 Found ${loginComponents.length} login page components:`);
    loginComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}`);
    });
    
    const signupComponents = await Component.find({ page: 'signup' }).sort({ order: 1 });
    console.log(`\n📋 Found ${signupComponents.length} signup page components:`);
    signupComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}`);
    });
    
    const notificationComponents = await Component.find({ page: 'notifications' }).sort({ order: 1 });
    console.log(`\n📋 Found ${notificationComponents.length} notifications page components:`);
    notificationComponents.forEach(comp => {
      console.log(`  Order: ${comp.order}, Type: ${comp.type}, Slug: ${comp.slug}`);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Check completed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMissingPages();