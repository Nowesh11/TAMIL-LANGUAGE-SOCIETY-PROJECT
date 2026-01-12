const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import User model (TypeScript)
const { User } = require('../src/models');

async function testAdminLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-society');
    console.log('✅ Connected to MongoDB');

    // Test login credentials
    const email = 'admin@test.com';
    const password = 'admin123';

    console.log('\n🔐 Testing admin login...');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    // List all users first
    const allUsers = await User.find({});
    console.log(`\n📋 Found ${allUsers.length} users in database:`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - Active: ${user.isActive || 'undefined'}`);
    });

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('\n👤 User found:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Password field: ${user.password ? 'Set' : 'Not set'}`);
    console.log(`   PasswordHash field: ${user.passwordHash ? 'Set' : 'Not set'}`);

    // Verify password using the correct field
    const passwordField = user.passwordHash || user.password;
    if (!passwordField) {
      console.log('❌ No password hash found');
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, passwordField);
    
    if (isPasswordValid) {
      console.log('✅ Password is valid');
      console.log('✅ Admin login test successful!');
      
      // Check admin permissions
      if (user.role === 'admin' && user.isActive) {
        console.log('✅ User has admin permissions');
        console.log('✅ User account is active');
        console.log('\n🎉 Admin authentication fully verified!');
      } else {
        console.log('❌ User lacks admin permissions or account is inactive');
      }
    } else {
      console.log('❌ Invalid password');
    }

  } catch (error) {
    console.error('❌ Error testing admin login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAdminLogin();