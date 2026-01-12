const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/tamil-language-society';

async function addPosterComponent() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  console.log('🎯 Adding PosterSlider component to home page...\n');
  
  // Check if poster component already exists
  const existing = await db.collection('components').findOne({
    page: 'home',
    slug: 'home-poster-slider'
  });

  if (existing) {
    console.log('⏭️  PosterSlider component already exists for home page');
    await client.close();
    return;
  }

  // Add PosterSlider component
  const posterComponent = {
    type: 'poster',
    page: 'home',
    slug: 'home-poster-slider',
    order: 10, // Place it after navbar, seo, hero
    isActive: true,
    content: {
      title: { en: 'Latest Updates', ta: 'சமீபத்திய புதுப்பிப்புகள்' },
      description: { en: 'Stay updated with our latest announcements and events', ta: 'எங்கள் சமீபத்திய அறிவிப்புகள் மற்றும் நிகழ்வுகளுடன் புதுப்பித்த நிலையில் இருங்கள்' },
      autoplay: true,
      interval: 5000,
      showDots: true,
      showArrows: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection('components').insertOne(posterComponent);
  console.log('✅ Added PosterSlider component for home page');

  console.log('\n🎉 PosterSlider component added successfully!');
  await client.close();
}

addPosterComponent().catch(console.error);