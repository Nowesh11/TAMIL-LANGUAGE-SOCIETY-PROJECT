import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Helper function to ensure bilingual content structure
function ensureBilingual(content: any): any {
  if (!content || typeof content !== 'object') {
    return content;
  }

  const ensuredContent = { ...content };

  // Ensure bilingual text fields
  const bilingualFields = ['title', 'text', 'name', 'heading'];
  bilingualFields.forEach(field => {
    if (ensuredContent[field]) {
      if (typeof ensuredContent[field] === 'string') {
        ensuredContent[field] = { en: ensuredContent[field], ta: ensuredContent[field] };
      } else if (typeof ensuredContent[field] === 'object') {
        ensuredContent[field] = {
          en: ensuredContent[field].en || '',
          ta: ensuredContent[field].ta || ''
        };
      }
    }
  });

  // Ensure bilingual arrays
  if (ensuredContent.features && Array.isArray(ensuredContent.features)) {
    ensuredContent.features = ensuredContent.features.map((feature: any) => ({
      ...feature,
      title: feature.title ? (typeof feature.title === 'string' ? 
        { en: feature.title, ta: feature.title } : 
        { en: feature.title.en || '', ta: feature.title.ta || '' }) : { en: '', ta: '' },
      description: feature.description ? (typeof feature.description === 'string' ? 
        { en: feature.description, ta: feature.description } : 
        { en: feature.description.en || '', ta: feature.description.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.stats && Array.isArray(ensuredContent.stats)) {
    ensuredContent.stats = ensuredContent.stats.map((stat: any) => ({
      ...stat,
      label: stat.label ? (typeof stat.label === 'string' ? 
        { en: stat.label, ta: stat.label } : 
        { en: stat.label.en || '', ta: stat.label.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.faqs && Array.isArray(ensuredContent.faqs)) {
    ensuredContent.faqs = ensuredContent.faqs.map((faq: any) => ({
      ...faq,
      question: faq.question ? (typeof faq.question === 'string' ? 
        { en: faq.question, ta: faq.question } : 
        { en: faq.question.en || '', ta: faq.question.ta || '' }) : { en: '', ta: '' },
      answer: faq.answer ? (typeof faq.answer === 'string' ? 
        { en: faq.answer, ta: faq.answer } : 
        { en: faq.answer.en || '', ta: faq.answer.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.links && Array.isArray(ensuredContent.links)) {
    ensuredContent.links = ensuredContent.links.map((link: any) => ({
      ...link,
      text: link.text ? (typeof link.text === 'string' ? 
        { en: link.text, ta: link.text } : 
        { en: link.text.en || '', ta: link.text.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.testimonials && Array.isArray(ensuredContent.testimonials)) {
    ensuredContent.testimonials = ensuredContent.testimonials.map((testimonial: any) => ({
      ...testimonial,
      name: testimonial.name ? (typeof testimonial.name === 'string' ? 
        { en: testimonial.name, ta: testimonial.name } : 
        { en: testimonial.name.en || '', ta: testimonial.name.ta || '' }) : { en: '', ta: '' },
      text: testimonial.text ? (typeof testimonial.text === 'string' ? 
        { en: testimonial.text, ta: testimonial.text } : 
        { en: testimonial.text.en || '', ta: testimonial.text.ta || '' }) : { en: '', ta: '' },
      position: testimonial.position ? (typeof testimonial.position === 'string' ? 
        { en: testimonial.position, ta: testimonial.position } : 
        { en: testimonial.position.en || '', ta: testimonial.position.ta || '' }) : { en: '', ta: '' }
    }));
  }

  return ensuredContent;
}

async function fixComponentContent() {
  try {
    console.log('🔄 Connecting to database...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
    await mongoose.connect(mongoUri);

    console.log('📊 Fetching all components...');
    const components = await Component.find({}).lean();
    console.log(`Found ${components.length} components to process`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const component of components) {
      try {
        console.log(`Processing component ${component._id} (${component.type} - ${component.page})`);
        
        // Check if content needs fixing
        const originalContent = JSON.stringify(component.content);
        const fixedContent = ensureBilingual(component.content);
        const fixedContentString = JSON.stringify(fixedContent);

        if (originalContent !== fixedContentString) {
          console.log(`  ✅ Updating content structure for component ${component._id}`);
          
          await Component.findByIdAndUpdate(
            component._id,
            { 
              content: fixedContent,
              updatedAt: new Date()
            },
            { runValidators: true }
          );
          
          updatedCount++;
        } else {
          console.log(`  ⏭️  Component ${component._id} already has correct structure`);
        }
      } catch (error) {
        console.error(`❌ Error processing component ${component._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`Total components processed: ${components.length}`);
    console.log(`Components updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  fixComponentContent()
    .then(() => {
      console.log('🎉 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default fixComponentContent;