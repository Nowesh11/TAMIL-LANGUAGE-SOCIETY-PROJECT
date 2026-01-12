import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function fixAllLinks() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Define link mappings from old HTML to new Next.js routes
    const linkMappings = {
      '/views/projects.html': '/projects',
      '/views/books.html': '/books',
      '/views/ebooks.html': '/ebooks',
      '/views/about.html': '/about',
      '/views/contacts.html': '/contacts',
      '/views/notifications.html': '/notifications',
      '/views/login.html': '/login',
      '/views/signup.html': '/signup',
      '/views/sign.html': '/signup',
      '/views/home.html': '/',
      '/views/index.html': '/',
      '/home.html': '/',
      '/index.html': '/'
    };

    // Get all components
    const components = await Component.find({});
    let updatedCount = 0;

    for (const component of components) {
      let hasChanges = false;
      const contentStr = JSON.stringify(component.content);
      let updatedContentStr = contentStr;

      // Replace all old links with new ones
      Object.entries(linkMappings).forEach(([oldLink, newLink]) => {
        if (updatedContentStr.includes(oldLink)) {
          updatedContentStr = updatedContentStr.replace(new RegExp(oldLink, 'g'), newLink);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        component.content = JSON.parse(updatedContentStr);
        await component.save();
        updatedCount++;
        console.log(`✅ Updated links in ${component.page}/${component.type} component`);
      }
    }

    console.log(`\n🔄 Updated ${updatedCount} components with correct links`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error fixing links:', error);
    process.exit(1);
  }
}

fixAllLinks();