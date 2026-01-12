#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

// Import required models
import User from '../src/models/User';
import Component from '../src/models/Component';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection function
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

// Reset only components collection
async function resetComponentsCollection() {
  console.log('🗑️ Resetting components collection...');
  await Component.deleteMany({});
  console.log('✅ Components collection reset successfully!');
}

// Get admin user for createdBy field
async function getAdminUser() {
  console.log('👤 Getting admin user...');
  let adminUser = await User.findOne({ role: 'admin' });
  
  if (!adminUser) {
    console.log('Creating admin user...');
    adminUser = await User.create({
      name: { en: 'Admin User', ta: 'நிர்வாக பயனர்' },
      email: 'admin@tamilsociety.org',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      isVerified: true
    });
  }
  
  console.log(`✅ Admin user found/created: ${adminUser.email}`);
  return adminUser._id;
}

// Utility function to create component
async function upsertComponent(componentData: any, adminId: any) {
  const component = await Component.create({
    ...componentData,
    createdBy: adminId,
    updatedBy: adminId
  });
  return component;
}

// Seed Home page components
async function seedHomeComponents(adminId: any) {
  console.log('🏠 Seeding Home page components...');
  
  const homeComponents = [
    {
      type: 'navbar',
      page: 'home',
      slug: 'home-navbar',
      order: 1,
      isActive: true,
      content: {
        en: {
          logo: 'Tamil Language Society',
          menuItems: [
            { label: 'Home', href: '/', active: true },
            { label: 'About', href: '/about' },
            { label: 'Projects', href: '/projects' },
            { label: 'E-Books', href: '/ebooks' },
            { label: 'Books', href: '/books' },
            { label: 'Contact', href: '/contact' }
          ]
        },
        ta: {
          logo: 'தமிழ் மொழி சங்கம்',
          menuItems: [
            { label: 'முகப்பு', href: '/', active: true },
            { label: 'எங்களைப் பற்றி', href: '/about' },
            { label: 'திட்டங்கள்', href: '/projects' },
            { label: 'மின்னூல்கள்', href: '/ebooks' },
            { label: 'புத்தகங்கள்', href: '/books' },
            { label: 'தொடர்பு', href: '/contact' }
          ]
        }
      }
    }
  ];

  for (const componentData of homeComponents) {
    await upsertComponent(componentData, adminId);
  }

  console.log(`✅ Seeded ${homeComponents.length} Home page components`);
}

// Main execution function
async function main() {
  try {
    console.log('🚀 Starting components-only reset and seed process...');
    
    // Connect to database
    await connectDB();
    
    // Reset only components collection
    await resetComponentsCollection();
    
    // Get admin user
    const adminId = await getAdminUser();
    
    // Seed all page components
    await seedHomeComponents(adminId);
    
    console.log('✅ Components-only reset and seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during components reset and seed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
main();