import mongoose from 'mongoose';
import Component from '../src/models/Component';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function analyzeComponents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔍 DETAILED COMPONENT ANALYSIS\n');
    console.log('=' .repeat(60));

    // Get all components grouped by page
    const componentsByPage = await Component.aggregate([
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 },
          components: {
            $push: {
              type: '$type',
              componentId: '$componentId',
              isActive: '$isActive',
              createdAt: '$createdAt'
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📋 COMPONENTS BY PAGE:\n');
    
    let totalComponents = 0;
    let duplicateCount = 0;
    
    for (const page of componentsByPage) {
      console.log(`\n📄 ${page._id.toUpperCase()} PAGE (${page.count} components):`);
      console.log('-'.repeat(40));
      
      // Group by type to find duplicates
      const typeGroups: { [key: string]: any[] } = {};
      page.components.forEach((comp: any) => {
        if (!typeGroups[comp.type]) {
          typeGroups[comp.type] = [];
        }
        typeGroups[comp.type].push(comp);
      });
      
      // Check each type for duplicates
      Object.entries(typeGroups).forEach(([type, components]) => {
        if (components.length > 1) {
          console.log(`   ⚠️  ${type}: ${components.length} instances (POTENTIAL DUPLICATE)`);
          components.forEach((comp, index) => {
            console.log(`      ${index + 1}. ID: ${comp.componentId}, Active: ${comp.isActive}, Created: ${new Date(comp.createdAt).toLocaleDateString()}`);
          });
          duplicateCount += components.length - 1; // Count extras as duplicates
        } else {
          console.log(`   ✅ ${type}: 1 instance`);
        }
      });
      
      totalComponents += page.count;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Components: ${totalComponents}`);
    console.log(`   Potential Duplicates: ${duplicateCount}`);
    
    if (duplicateCount > 0) {
      console.log(`\n⚠️  Found ${duplicateCount} potential duplicate components!`);
      console.log('   Consider running cleanup to remove duplicates.');
    } else {
      console.log('\n✅ No duplicate components found!');
    }

    // Check for inactive components
    const inactiveComponents = await Component.find({ isActive: false });
    if (inactiveComponents.length > 0) {
      console.log(`\n🔄 Found ${inactiveComponents.length} inactive components:`);
      inactiveComponents.forEach(comp => {
        console.log(`   - ${comp.page}/${comp.type} (${comp.componentId})`);
      });
    }

    // Check for components without proper componentId
    const componentsWithoutId = await Component.find({
      $or: [
        { componentId: { $exists: false } },
        { componentId: null },
        { componentId: '' }
      ]
    });
    
    if (componentsWithoutId.length > 0) {
      console.log(`\n🆔 Found ${componentsWithoutId.length} components without proper componentId:`);
      componentsWithoutId.forEach(comp => {
        console.log(`   - ${comp.page}/${comp.type} (ID: ${comp._id})`);
      });
    }

    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

analyzeComponents();