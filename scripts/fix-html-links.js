const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Component schema
const componentSchema = new mongoose.Schema({
  type: String,
  page: String,
  slug: String,
  order: Number,
  content: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true }
});

const Component = mongoose.model('Component', componentSchema);

const linkMapping = {
  '/views/index.html': '/',
  '/views/about.html': '/about',
  '/views/projects.html': '/projects',
  '/views/ebooks.html': '/ebooks',
  '/views/books.html': '/books',
  '/views/contact.html': '/contacts',
  '/views/notifications.html': '/notifications',
  '/views/login.html': '/login',
  '/views/signup.html': '/signup',
  '/views/donate.html': '/donate',
  'index.html': '/',
  'about.html': '/about',
  'projects.html': '/projects',
  'ebooks.html': '/ebooks',
  'books.html': '/books',
  'contact.html': '/contacts',
  'notifications.html': '/notifications',
  'login.html': '/login',
  'signup.html': '/signup',
  'donate.html': '/donate'
};

async function fixAllLinks() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const components = await Component.find({});
    console.log(`📋 Found ${components.length} components to check`);
    
    let updatedCount = 0;
    
    for (const component of components) {
      let hasChanges = false;
      const componentStr = JSON.stringify(component.content);
      
      // Check if component has HTML links
      const hasHtmlLinks = Object.keys(linkMapping).some(htmlLink => 
        componentStr.includes(htmlLink)
      );
      
      if (hasHtmlLinks) {
        console.log(`🔧 Updating component: ${component.slug} (page: ${component.page})`);
        
        // Update the content by replacing HTML links
        let contentStr = JSON.stringify(component.content);
        
        Object.entries(linkMapping).forEach(([htmlLink, pageLink]) => {
          if (contentStr.includes(htmlLink)) {
            const regex = new RegExp(htmlLink.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            contentStr = contentStr.replace(regex, pageLink);
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          component.content = JSON.parse(contentStr);
          await component.save();
          updatedCount++;
          console.log(`  ✅ Updated links in ${component.slug}`);
        }
      }
    }
    
    console.log(`\n🎉 Updated ${updatedCount} components with corrected links`);
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllLinks();