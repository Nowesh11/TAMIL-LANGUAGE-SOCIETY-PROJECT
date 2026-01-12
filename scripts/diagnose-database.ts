import dbConnect from '../src/lib/mongodb';
import Component from '../src/models/Component';
import Team from '../src/models/Team';
import Poster from '../src/models/Poster';

async function diagnoseDatabaseIssues() {
  try {
    console.log('🔍 Connecting to database...');
    await dbConnect();
    console.log('✅ Database connected successfully');

    // Check Components
    console.log('\n📦 COMPONENTS ANALYSIS:');
    const componentCount = await Component.countDocuments();
    console.log(`Total components: ${componentCount}`);
    
    if (componentCount > 0) {
      const components = await Component.find({}).limit(5).lean();
      console.log('Sample components:');
      components.forEach((comp: any) => {
        console.log(`  - ID: ${comp._id}, Type: ${comp.type}, Page: ${comp.page}, Active: ${comp.isActive}`);
      });
      
      const componentsByPage = await Component.aggregate([
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('Components by page:');
      componentsByPage.forEach((page: any) => {
        console.log(`  - ${page._id}: ${page.count} components`);
      });
    }

    // Check Team Members
    console.log('\n👥 TEAM MEMBERS ANALYSIS:');
    const teamCount = await Team.countDocuments();
    console.log(`Total team members: ${teamCount}`);
    
    if (teamCount > 0) {
      const teamMembers = await Team.find({}).limit(10).lean();
      console.log('Team members:');
      teamMembers.forEach((member: any) => {
        console.log(`  - ID: ${member._id}, Name: ${member.name?.en || 'No name'}, Active: ${member.isActive}, ImagePath: ${member.imagePath || 'No image'}`);
      });
      
      const membersWithImages = await Team.countDocuments({ imagePath: { $exists: true, $ne: null, $ne: '' } });
      console.log(`Members with images: ${membersWithImages}/${teamCount}`);
    }

    // Check Posters
    console.log('\n🖼️ POSTERS ANALYSIS:');
    const posterCount = await Poster.countDocuments();
    console.log(`Total posters: ${posterCount}`);
    
    if (posterCount > 0) {
      const posters = await Poster.find({}).limit(5).lean();
      console.log('Sample posters:');
      posters.forEach((poster: any) => {
        console.log(`  - ID: ${poster._id}, Title: ${poster.title?.en || 'No title'}, Active: ${poster.isActive}, ImagePath: ${poster.imagePath || 'No image'}`);
      });
    }

    // Check for specific problematic IDs
    console.log('\n🔍 CHECKING PROBLEMATIC IDS:');
    const problematicIds = ['68f8f40d5656a1697a135596', '68f8f40d5656a1697a135598'];
    
    for (const id of problematicIds) {
      try {
        const teamMember = await Team.findById(id);
        if (teamMember) {
          console.log(`✅ Found team member ${id}: ${teamMember.name?.en || 'No name'}`);
          console.log(`   Image path: ${teamMember.imagePath || 'No image path'}`);
        } else {
          console.log(`❌ Team member ${id} not found in database`);
        }
      } catch (error) {
        console.log(`❌ Error checking team member ${id}:`, error);
      }
    }

    // Check API endpoints functionality
    console.log('\n🔗 API ENDPOINT CHECKS:');
    
    // Test admin endpoints
    const adminComponentsCount = await Component.countDocuments();
    const adminTeamCount = await Team.countDocuments();
    const adminPostersCount = await Poster.countDocuments();
    
    console.log(`Admin API data availability:`);
    console.log(`  - Components: ${adminComponentsCount} records`);
    console.log(`  - Team: ${adminTeamCount} records`);
    console.log(`  - Posters: ${adminPostersCount} records`);

    console.log('\n✅ Database diagnosis completed');
    
  } catch (error) {
    console.error('❌ Database diagnosis failed:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseDatabaseIssues();