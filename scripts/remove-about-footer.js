const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const componentSchema = new mongoose.Schema({}, { strict: false });
const Component = mongoose.model('Component', componentSchema);

async function removeAboutFooter() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Remove the duplicate footer component
    const result = await Component.deleteMany({ 
      page: 'about', 
      type: 'footer'
    });
    
    console.log('Removed', result.deletedCount, 'footer component(s) from about page');
    
    // Verify remaining components
    const aboutComponents = await Component.find({ page: 'about' }).sort({ order: 1 });
    console.log('Remaining about components:', aboutComponents.length);
    aboutComponents.forEach(comp => {
      console.log('Order:', comp.order, 'Type:', comp.type, 'Slug:', comp.slug || 'no-slug');
    });
    
    await mongoose.connection.close();
    console.log('Operation completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeAboutFooter();