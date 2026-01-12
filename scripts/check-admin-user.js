const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: {
    en: { type: String, required: true },
    ta: { type: String, required: true }
  },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true }
});

const User = mongoose.model('User', userSchema);

async function checkAndCreateAdmin() {
  try {
    // Connect to database
    const uri = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@tamilsociety.org' });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.name.en}`);
      console.log(`   Role: ${adminUser.role}`);
      console.log(`   Active: ${adminUser.isActive}`);
      console.log(`   Password Hash: ${adminUser.passwordHash ? 'Set' : 'Not set'}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('admin123', adminUser.passwordHash);
      console.log(`   Password 'admin123' valid: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        console.log('🔧 Updating admin password...');
        const newHash = await bcrypt.hash('admin123', 12);
        await User.updateOne({ _id: adminUser._id }, { passwordHash: newHash });
        console.log('✅ Admin password updated');
      }
    } else {
      console.log('❌ Admin user not found. Creating...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      const newAdmin = new User({
        email: 'admin@tamilsociety.org',
        passwordHash: hashedPassword,
        name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
        role: 'admin',
        isActive: true
      });
      await newAdmin.save();
      console.log('✅ Admin user created');
    }

    // Check all users
    const allUsers = await User.find({});
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkAndCreateAdmin();