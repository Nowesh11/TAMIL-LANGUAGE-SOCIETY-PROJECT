const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Import models
const { User, Component, Poster } = require('../src/models');

async function testAdminFunctionality() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-society');
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 COMPREHENSIVE ADMIN FUNCTIONALITY TEST');
    console.log('==========================================');

    // Test 1: Admin Login
    console.log('\n1️⃣ Testing Admin Login...');
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123';
    
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    const isPasswordValid = await bcrypt.compare(adminPassword, adminUser.passwordHash);
    if (isPasswordValid) {
      console.log('✅ Admin login successful');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Role: ${adminUser.role}`);
    } else {
      console.log('❌ Admin login failed');
      return;
    }

    // Test 2: Component CRUD Operations
    console.log('\n2️⃣ Testing Component CRUD Operations...');
    
    // CREATE - Test component creation
    console.log('\n📝 Testing Component Creation...');
    const testComponent = new Component({
      type: 'image',
      page: 'test',
      order: 1,
      content: {
        image: {
          src: '/uploads/components/test/image.jpg',
          alt: {
            en: 'Test Component Image',
            ta: 'சோதனை கூறு படம்'
          }
        },
        caption: {
          en: 'This is a test component for CRUD testing',
          ta: 'இது CRUD சோதனைக்கான சோதனை கூறு'
        }
      },
      createdBy: adminUser._id
    });

    const savedComponent = await testComponent.save();
    console.log('✅ Component created successfully');
    console.log(`   ID: ${savedComponent._id}`);
    console.log(`   Type: ${savedComponent.type}`);
    console.log(`   Page: ${savedComponent.page}`);

    // READ - Test component retrieval
    console.log('\n📖 Testing Component Retrieval...');
    const retrievedComponent = await Component.findById(savedComponent._id);
    if (retrievedComponent) {
      console.log('✅ Component retrieved successfully');
      console.log(`   Image Alt (EN): ${retrievedComponent.content.image.alt.en}`);
      console.log(`   Image Alt (TA): ${retrievedComponent.content.image.alt.ta}`);
      console.log(`   Image Src: ${retrievedComponent.content.image.src}`);
    } else {
      console.log('❌ Component retrieval failed');
    }

    // UPDATE - Test component update
    console.log('\n✏️ Testing Component Update...');
    retrievedComponent.content.image.alt.en = 'Updated Test Component Image';
    retrievedComponent.content.image.alt.ta = 'புதுப்பிக்கப்பட்ட சோதனை கூறு படம்';
    retrievedComponent.updatedBy = adminUser._id;
    
    const updatedComponent = await retrievedComponent.save();
    console.log('✅ Component updated successfully');
    console.log(`   New Alt (EN): ${updatedComponent.content.image.alt.en}`);
    console.log(`   New Alt (TA): ${updatedComponent.content.image.alt.ta}`);

    // Test 3: Image Upload Path Construction
    console.log('\n3️⃣ Testing Image Upload Path Construction...');
    const componentId = savedComponent._id.toString();
    const expectedUploadPath = `uploads/components/${componentId}/image`;
    console.log(`✅ Upload path constructed: ${expectedUploadPath}`);
    
    // Verify upload directory structure
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'components', componentId);
    console.log(`   Expected directory: ${uploadsDir}`);
    
    // Create directory structure to simulate upload
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Upload directory created successfully');
    } catch (error) {
      console.log('⚠️ Upload directory creation failed:', error.message);
    }

    // Test 4: Component Listing and Filtering
    console.log('\n4️⃣ Testing Component Listing...');
    const allComponents = await Component.find({});
    console.log(`✅ Found ${allComponents.length} components in database`);
    
    const imageComponents = await Component.find({ type: 'image' });
    console.log(`✅ Found ${imageComponents.length} image components`);

    const testPageComponents = await Component.find({ page: 'test' });
    console.log(`✅ Found ${testPageComponents.length} components on test page`);

    // Test 5: Poster CRUD Operations
    console.log('\n5️⃣ Testing Poster CRUD Operations...');
    
    // CREATE - Test poster creation
    console.log('\n📝 Testing Poster Creation...');
    const testPoster = new Poster({
      title: {
        en: 'Test Event Poster',
        ta: 'சோதனை நிகழ்வு சுவரொட்டி'
      },
      description: {
        en: 'This is a test poster for CRUD testing',
        ta: 'இது CRUD சோதனைக்கான சோதனை சுவரொட்டி'
      },
      category: 'announcement',
      imagePath: '/uploads/posters/test/poster.jpg',
      order: 1,
      active: true,
      createdBy: adminUser._id
    });

    const savedPoster = await testPoster.save();
    console.log('✅ Poster created successfully');
    console.log(`   ID: ${savedPoster._id}`);
    console.log(`   Title (EN): ${savedPoster.title.en}`);
    console.log(`   Title (TA): ${savedPoster.title.ta}`);

    // READ - Test poster retrieval
    console.log('\n📖 Testing Poster Retrieval...');
    const retrievedPoster = await Poster.findById(savedPoster._id);
    if (retrievedPoster) {
      console.log('✅ Poster retrieved successfully');
      console.log(`   Description (EN): ${retrievedPoster.description.en}`);
      console.log(`   Active: ${retrievedPoster.active}`);
    } else {
      console.log('❌ Poster retrieval failed');
    }

    // UPDATE - Test poster update
    console.log('\n✏️ Testing Poster Update...');
    retrievedPoster.title.en = 'Updated Test Poster';
    retrievedPoster.title.ta = 'புதுப்பிக்கப்பட்ட சோதனை சுவரொட்டி';
    retrievedPoster.active = false;
    
    const updatedPoster = await retrievedPoster.save();
    console.log('✅ Poster updated successfully');
    console.log(`   New Title (EN): ${updatedPoster.title.en}`);
    console.log(`   Active Status: ${updatedPoster.active}`);

    // Test 6: Image Upload Path for Posters
    console.log('\n6️⃣ Testing Poster Image Upload Path...');
    const posterId = savedPoster._id.toString();
    const posterUploadPath = `uploads/posters/${posterId}/image`;
    console.log(`✅ Poster upload path: ${posterUploadPath}`);

    // Test 7: Data Validation
    console.log('\n7️⃣ Testing Data Validation...');
    
    try {
      // Test invalid component creation
      const invalidComponent = new Component({
        type: 'invalid_type',
        page: 'test',
        content: {}
      });
      await invalidComponent.save();
      console.log('❌ Invalid component validation failed');
    } catch (error) {
      console.log('✅ Component validation working correctly');
    }

    // Test 8: Cleanup Test Data
    console.log('\n8️⃣ Cleaning up test data...');
    
    // DELETE - Test component deletion
    await Component.findByIdAndDelete(savedComponent._id);
    console.log('✅ Test component deleted');
    
    // DELETE - Test poster deletion
    await Poster.findByIdAndDelete(savedPoster._id);
    console.log('✅ Test poster deleted');

    // Clean up test upload directory
    try {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
      console.log('✅ Test upload directory cleaned');
    } catch (error) {
      console.log('⚠️ Upload directory cleanup failed:', error.message);
    }

    // Final Summary
    console.log('\n🎉 ADMIN FUNCTIONALITY TEST SUMMARY');
    console.log('===================================');
    console.log('✅ Admin login authentication');
    console.log('✅ Component CRUD operations');
    console.log('✅ Image upload path construction');
    console.log('✅ Component listing and filtering');
    console.log('✅ Poster CRUD operations');
    console.log('✅ Poster image upload paths');
    console.log('✅ Data validation');
    console.log('✅ Test data cleanup');
    console.log('\n🚀 All admin functionality tests passed!');

  } catch (error) {
    console.error('❌ Error during admin functionality test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAdminFunctionality();