import mongoose from 'mongoose';
import Component from '../src/models/Component';
import dbConnect from '../src/lib/mongodb';

async function checkHeroLinks() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    const hero = await Component.findOne({page: 'home', type: 'hero'});
    
    if (hero) {
      console.log('\n🏠 Home Hero Component Content:');
      console.log(JSON.stringify(hero.content, null, 2));
    } else {
      console.log('❌ No home hero component found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error checking hero links:', error);
    process.exit(1);
  }
}

checkHeroLinks();