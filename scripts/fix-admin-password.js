const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model (TypeScript)
const { User } = require('../src/models');

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-society');
    console.log('✅ Connected to MongoDB');

    const email = 'admin@test.com';
    const password = 'admin123';

    console.log('\n🔧 Fixing admin password...');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // Find the admin user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('\n👤 Found admin user:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n🔐 Generated password hash');

    // Update the user with the password hash and required fields
    user.passwordHash = passwordHash;
    
    // Ensure bilingual name is set
    if (!user.name || !user.name.en || !user.name.ta) {
      user.name = {
        en: 'Admin User',
        ta: 'நிர்வாக பயனர்'
      };
    }
    
    await user.save();

    console.log('✅ Admin password updated successfully!');

    // Verify the password works
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('\n🎉 Admin user is now ready for login!');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } else {
      console.log('❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAdminPassword();