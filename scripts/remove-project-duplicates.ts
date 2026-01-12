import mongoose from 'mongoose';
import Component from '../src/models/Component';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';

async function removeProjectDuplicates() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 REMOVING DUPLICATE PROJECTS HERO COMPONENTS\n');

    // Find all projects hero components
    const projectsHeroComponents = await Component.find({
      page: 'projects',
      type: 'hero'
    }).sort({ createdAt: 1 }); // Sort by creation date, keep the oldest

    console.log(`Found ${projectsHeroComponents.length} projects hero components`);

    if (projectsHeroComponents.length > 1) {
      // Keep the first one (oldest), remove the rest
      const toKeep = projectsHeroComponents[0];
      const toRemove = projectsHeroComponents.slice(1);

      console.log(`\n✅ Keeping: ${toKeep.componentId} (Created: ${toKeep.createdAt})`);
      console.log(`🗑️  Removing ${toRemove.length} duplicates:`);

      for (const component of toRemove) {
        console.log(`   - ${component.componentId} (Created: ${component.createdAt})`);
        await Component.findByIdAndDelete(component._id);
      }

      console.log(`\n✅ Successfully removed ${toRemove.length} duplicate projects hero components`);
    } else {
      console.log('✅ No duplicate projects hero components found');
    }

    // Also check for any other potential duplicates across all pages
    console.log('\n🔍 Checking for other duplicates...');
    
    const allDuplicates = await Component.aggregate([
      {
        $group: {
          _id: { page: '$page', type: '$type' },
          count: { $sum: 1 },
          components: { $push: { id: '$_id', componentId: '$componentId', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (allDuplicates.length > 0) {
      console.log(`\n⚠️  Found ${allDuplicates.length} other duplicate groups:`);
      for (const duplicate of allDuplicates) {
        console.log(`   ${duplicate._id.page}/${duplicate._id.type}: ${duplicate.count} instances`);
        
        // Remove all but the oldest for each duplicate group
        const sortedComponents = duplicate.components.sort((a: any, b: any) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        const toRemoveIds = sortedComponents.slice(1).map((comp: any) => comp.id);
        
        if (toRemoveIds.length > 0) {
          await Component.deleteMany({ _id: { $in: toRemoveIds } });
          console.log(`     ✅ Removed ${toRemoveIds.length} duplicates`);
        }
      }
    } else {
      console.log('✅ No other duplicates found');
    }

    // Final count
    const finalCount = await Component.countDocuments();
    console.log(`\n📊 Final component count: ${finalCount}`);

    console.log('\n🎉 Cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

removeProjectDuplicates();