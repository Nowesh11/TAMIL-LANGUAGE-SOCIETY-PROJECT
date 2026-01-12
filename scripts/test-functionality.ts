import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testFunctionality() {
  try {
    await dbConnect();
    console.log('✅ Database connection successful');

    // Test component retrieval
    const components = await Component.find({}).limit(5);
    console.log(`✅ Component retrieval successful: Found ${components.length} components`);

    // Test component count by page
    const componentsByPage = await Component.aggregate([
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Components by page:');
    componentsByPage.forEach(item => {
      console.log(`  ${item._id}: ${item.count} components`);
    });

    // Test component types
    const componentsByType = await Component.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n🔧 Components by type:');
    componentsByType.forEach(item => {
      console.log(`  ${item._id}: ${item.count} components`);
    });

    // Test active/inactive components
    const activeComponents = await Component.countDocuments({ isActive: true });
    const inactiveComponents = await Component.countDocuments({ isActive: false });
    
    console.log(`\n📈 Component status:`);
    console.log(`  Active: ${activeComponents} components`);
    console.log(`  Inactive: ${inactiveComponents} components`);

    console.log('\n🎉 All functionality tests passed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

testFunctionality();