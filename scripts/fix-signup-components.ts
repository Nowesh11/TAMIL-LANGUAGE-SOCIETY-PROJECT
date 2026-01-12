import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function fixSignupComponents() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Find all components with page 'sign' and update to 'signup'
    const signComponents = await Component.find({ page: 'sign' });
    console.log(`🔍 Found ${signComponents.length} components with page 'sign'`);

    let updatedCount = 0;
    for (const component of signComponents) {
      component.page = 'signup';
      
      // Update slug if it contains 'sign'
      if (component.slug && component.slug.includes('sign-')) {
        component.slug = component.slug.replace('sign-', 'signup-');
      }
      
      await component.save();
      updatedCount++;
      console.log(`✅ Updated ${component.type} component from 'sign' to 'signup'`);
    }

    console.log(`\n🔄 Updated ${updatedCount} components from 'sign' to 'signup'`);

    // Verify the changes
    const signupComponents = await Component.find({ page: 'signup' });
    const remainingSignComponents = await Component.find({ page: 'sign' });
    
    console.log(`\n📊 Verification:`);
    console.log(`- Components with page 'signup': ${signupComponents.length}`);
    console.log(`- Components with page 'sign': ${remainingSignComponents.length}`);

    if (signupComponents.length > 0) {
      console.log(`\n📋 Signup page components:`);
      signupComponents.forEach(comp => {
        console.log(`  - ${comp.type} (slug: ${comp.slug})`);
      });
    }

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error fixing signup components:', error);
    process.exit(1);
  }
}

fixSignupComponents();