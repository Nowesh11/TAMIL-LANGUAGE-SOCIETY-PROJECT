const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanupAboutComponents() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('components');
    
    // Find all about page components
    const aboutComponents = await collection.find({ page: 'about' }).toArray();
    console.log(`\nFound ${aboutComponents.length} components for about page:`);
    
    aboutComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug || 'N/A'}, Active: ${comp.isActive}, Order: ${comp.order}`);
    });
    
    // Define the components we want to keep
    const allowedTypes = [
      'navbar', 'hero', 'mission', 'vision', 'gallery', 'text', 'timeline', 'stats', 'cta', 'footer'
    ];
    
    // Define specific slugs we want to keep for text components
    const allowedTextSlugs = [
      'our-history-gallery', 'gallery-text', 'join-our-mission'
    ];
    
    // Find components to remove
    const componentsToRemove = aboutComponents.filter(comp => {
      // Always keep navbar and footer
      if (comp.type === 'navbar' || comp.type === 'footer') return false;
      
      // Keep allowed types
      if (allowedTypes.includes(comp.type)) {
        // For text components, check if slug is allowed
        if (comp.type === 'text') {
          return !allowedTextSlugs.includes(comp.slug);
        }
        return false; // Keep this component
      }
      
      return true; // Remove this component
    });
    
    console.log(`\n🗑️  Components to remove (${componentsToRemove.length}):`);
    componentsToRemove.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug || 'N/A'}`);
    });
    
    if (componentsToRemove.length > 0) {
      const componentIds = componentsToRemove.map(comp => comp._id);
      const result = await collection.deleteMany({ _id: { $in: componentIds } });
      console.log(`\n✅ Removed ${result.deletedCount} components from about page`);
    } else {
      console.log('\n✅ No components need to be removed');
    }
    
    // Check for duplicates across all pages
    console.log('\n🔍 Checking for duplicate components across all pages...');
    
    const allComponents = await collection.find({}).toArray();
    const duplicateGroups = {};
    
    allComponents.forEach(comp => {
      const key = `${comp.type}-${comp.page}-${comp.slug || 'no-slug'}`;
      if (!duplicateGroups[key]) {
        duplicateGroups[key] = [];
      }
      duplicateGroups[key].push(comp);
    });
    
    const duplicates = Object.values(duplicateGroups).filter(group => group.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate groups:`);
      
      for (const group of duplicates) {
        console.log(`\nDuplicate: ${group[0].type} on ${group[0].page} (${group.length} instances)`);
        
        // Keep the first one (usually the oldest), remove the rest
        const toRemove = group.slice(1);
        const removeIds = toRemove.map(comp => comp._id);
        
        if (removeIds.length > 0) {
          const result = await collection.deleteMany({ _id: { $in: removeIds } });
          console.log(`  ✅ Removed ${result.deletedCount} duplicate components`);
        }
      }
    } else {
      console.log('✅ No duplicate components found');
    }
    
    // Final check - show remaining about page components
    const finalAboutComponents = await collection.find({ page: 'about' }).sort({ order: 1 }).toArray();
    console.log(`\n📋 Final about page components (${finalAboutComponents.length}):`);
    finalAboutComponents.forEach((comp, index) => {
      console.log(`${index + 1}. Type: ${comp.type}, Slug: ${comp.slug || 'N/A'}, Order: ${comp.order}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Database connection closed');
  }
}

cleanupAboutComponents();