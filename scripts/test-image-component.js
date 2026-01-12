import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Component from '../src/models/Component.js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function testImageComponentValidation() {
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
  
  // Test 1: Create image component with correct structure (should pass)
  console.log('\n🧪 Test 1: Creating image component with correct structure...');
  try {
    const validImageComponent = new Component({
      type: 'image',
      slug: 'test-image-valid',
      page: 'test',
      order: 1,
      createdBy: new mongoose.Types.ObjectId(),
      content: {
        image: {
          src: '/uploads/components/test/image.jpg',
          alt: {
            en: 'Test image',
            ta: 'சோதனை படம்'
          }
        },
        caption: {
          en: 'Test caption',
          ta: 'சோதனை தலைப்பு'
        },
        aspectRatio: '16:9',
        objectFit: 'cover'
      }
    });
    
    await validImageComponent.save();
    console.log('✅ Valid image component created successfully');
    
    // Clean up
    await Component.deleteOne({ slug: 'test-image-valid' });
    console.log('🧹 Cleaned up test component');
    
  } catch (error) {
    console.log('❌ Valid image component failed:', error.message);
  }
  
  // Test 2: Create image component with old structure (should fail)
  console.log('\n🧪 Test 2: Creating image component with old structure...');
  try {
    const invalidImageComponent = new Component({
      type: 'image',
      slug: 'test-image-invalid',
      page: 'test',
      order: 1,
      createdBy: new mongoose.Types.ObjectId(),
      content: {
        url: '/uploads/components/test/image.jpg', // Old structure
        alt: {
          en: 'Test image',
          ta: 'சோதনை படم்'
        }
      }
    });
    
    await invalidImageComponent.save();
    console.log('❌ Invalid image component should have failed but passed');
    
    // Clean up if it somehow passed
    await Component.deleteOne({ slug: 'test-image-invalid' });
    
  } catch (error) {
    console.log('✅ Invalid image component correctly failed:', error.message);
  }
  
  // Test 3: Create image component without image source (should fail)
  console.log('\n🧪 Test 3: Creating image component without image source...');
  try {
    const noImageComponent = new Component({
      type: 'image',
      slug: 'test-image-no-src',
      page: 'test',
      order: 1,
      createdBy: new mongoose.Types.ObjectId(),
      content: {
        image: {
          alt: {
            en: 'Test image',
            ta: 'சோதனை படம்'
          }
        }
      }
    });
    
    await noImageComponent.save();
    console.log('❌ No image source component should have failed but passed');
    
    // Clean up if it somehow passed
    await Component.deleteOne({ slug: 'test-image-no-src' });
    
  } catch (error) {
    console.log('✅ No image source component correctly failed:', error.message);
  }
  
  await mongoose.connection.close();
  console.log('\n✅ Image component validation tests completed');
}

testImageComponentValidation().catch(console.error);