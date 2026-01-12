import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function removeUnusedComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Define the actual pages that exist in the application
    const existingPages = [
      'home',
      'about', 
      'books',
      'ebooks',
      'contacts',
      'projects',
      'recruitment',
      'login',
      'signup', // Note: 'sign' should be 'signup'
      'notifications',
      'protected',
      'activities',
      'initiatives'
    ];

    // Find all components
    const allComponents = await Component.find({});
    console.log(`🔍 Found ${allComponents.length} total components`);

    // Group components by page
    const componentsByPage = allComponents.reduce((acc, component) => {
      const page = component.page;
      if (!acc[page]) {
        acc[page] = [];
      }
      acc[page].push(component);
      return acc;
    }, {} as Record<string, any[]>);

    console.log('\n📊 Components by page:');
    Object.keys(componentsByPage).forEach(page => {
      const count = componentsByPage[page].length;
      const exists = existingPages.includes(page);
      console.log(`  ${exists ? '✅' : '❌'} ${page}: ${count} components ${exists ? '' : '(UNUSED)'}`);
    });

    // Find unused pages
    const unusedPages = Object.keys(componentsByPage).filter(page => !existingPages.includes(page));
    
    if (unusedPages.length === 0) {
      console.log('\n🎉 No unused components found!');
      return;
    }

    console.log(`\n🗑️  Found ${unusedPages.length} unused pages with components:`);
    unusedPages.forEach(page => {
      console.log(`  - ${page}: ${componentsByPage[page].length} components`);
    });

    // Count total components to be removed
    const componentsToRemove = unusedPages.reduce((total, page) => total + componentsByPage[page].length, 0);
    
    console.log(`\n⚠️  About to remove ${componentsToRemove} components from ${unusedPages.length} unused pages`);
    console.log('Unused pages:', unusedPages.join(', '));

    // Remove components from unused pages
    let removedCount = 0;
    for (const page of unusedPages) {
      const result = await Component.deleteMany({ page });
      removedCount += result.deletedCount || 0;
      console.log(`🗑️  Removed ${result.deletedCount} components from page: ${page}`);
    }

    console.log(`\n✅ Successfully removed ${removedCount} unused components`);

    // Also fix any 'sign' pages to 'signup'
    const signComponents = await Component.find({ page: 'sign' });
    if (signComponents.length > 0) {
      console.log(`\n🔄 Found ${signComponents.length} components with page 'sign', updating to 'signup'...`);
      
      for (const component of signComponents) {
        component.page = 'signup';
        if (component.slug && component.slug.includes('sign-')) {
          component.slug = component.slug.replace('sign-', 'signup-');
        }
        await component.save();
      }
      
      console.log(`✅ Updated ${signComponents.length} components from 'sign' to 'signup'`);
    }

    // Final verification
    const remainingComponents = await Component.find({});
    const remainingByPage = remainingComponents.reduce((acc, component) => {
      const page = component.page;
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Final component count by page:');
    Object.keys(remainingByPage).forEach(page => {
      console.log(`  ✅ ${page}: ${remainingByPage[page]} components`);
    });

    console.log(`\n🎉 Cleanup complete! Total components remaining: ${remainingComponents.length}`);

  } catch (error) {
    console.error('❌ Error removing unused components:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

removeUnusedComponents();