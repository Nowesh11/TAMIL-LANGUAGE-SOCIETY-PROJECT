import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongodb';

// Import all models
import Component from '../src/models/Component';
import User from '../src/models/User';
import Book from '../src/models/Book';
import EBook from '../src/models/EBook';
import ProjectItem from '../src/models/ProjectItem';
import Team from '../src/models/Team';
import Notification from '../src/models/Notification';
import Poster from '../src/models/Poster';
import RecruitmentForm from '../src/models/RecruitmentForm';
import ActivityLog from '../src/models/ActivityLog';
import PaymentSettings from '../src/models/PaymentSettings';

async function verifyAllData() {
  try {
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 COMPREHENSIVE DATA VERIFICATION\n');
    console.log('=' .repeat(50));

    // Check Components (should be exactly 59)
    const componentCount = await Component.countDocuments();
    console.log(`\n📦 COMPONENTS: ${componentCount}/59`);
    if (componentCount === 59) {
      console.log('✅ Perfect! Exactly 59 components as required');
    } else {
      console.log(`❌ Expected 59 components, found ${componentCount}`);
    }

    // Components by page
    const componentsByPage = await Component.aggregate([
      { $group: { _id: '$page', count: { $sum: 1 }, types: { $push: '$type' } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📋 Components by page:');
    componentsByPage.forEach(page => {
      console.log(`  ${page._id}: ${page.count} (${page.types.join(', ')})`);
    });

    // Check Users
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`\n👥 USERS: ${userCount} total (${adminCount} admins)`);
    if (userCount > 0) {
      console.log('✅ Users collection has data');
    } else {
      console.log('❌ No users found');
    }

    // Check Books
    const bookCount = await Book.countDocuments();
    console.log(`\n📚 BOOKS: ${bookCount}`);
    if (bookCount > 0) {
      console.log('✅ Books collection has data');
      const booksByCategory = await Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Categories:', booksByCategory.map(c => `${c._id} (${c.count})`).join(', '));
    } else {
      console.log('❌ No books found');
    }

    // Check Ebooks
    const ebookCount = await EBook.countDocuments();
    console.log(`\n💻 EBOOKS: ${ebookCount}`);
    if (ebookCount > 0) {
      console.log('✅ Ebooks collection has data');
      const ebooksByCategory = await EBook.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Categories:', ebooksByCategory.map(c => `${c._id} (${c.count})`).join(', '));
    } else {
      console.log('❌ No ebooks found');
    }

    // Check Project Items
    const projectCount = await ProjectItem.countDocuments();
    console.log(`\n🚀 PROJECT ITEMS: ${projectCount}`);
    if (projectCount > 0) {
      console.log('✅ Project items collection has data');
      const projectsByType = await ProjectItem.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Types:', projectsByType.map(p => `${p._id} (${p.count})`).join(', '));
    } else {
      console.log('❌ No project items found');
    }

    // Check Team Members
    const teamCount = await Team.countDocuments();
    console.log(`\n👨‍💼 TEAM MEMBERS: ${teamCount}`);
    if (teamCount > 0) {
      console.log('✅ Team members collection has data');
      const teamByRole = await Team.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Roles:', teamByRole.map(t => `${t._id} (${t.count})`).join(', '));
    } else {
      console.log('❌ No team members found');
    }

    // Check Notifications
    const notificationCount = await Notification.countDocuments();
    console.log(`\n🔔 NOTIFICATIONS: ${notificationCount}`);
    if (notificationCount > 0) {
      console.log('✅ Notifications collection has data');
      const notificationsByType = await Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Types:', notificationsByType.map(n => `${n._id} (${n.count})`).join(', '));
    } else {
      console.log('❌ No notifications found');
    }

    // Check Posters
    const posterCount = await Poster.countDocuments();
    const activePosterCount = await Poster.countDocuments({ active: true });
    console.log(`\n🖼️  POSTERS: ${posterCount} total (${activePosterCount} active)`);
    if (posterCount > 0) {
      console.log('✅ Posters collection has data');
      const postersByCategory = await Poster.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      console.log('  Categories:', postersByCategory.map(p => `${p._id} (${p.count})`).join(', '));
    } else {
      console.log('❌ No posters found');
    }

    // Check Recruitment Forms
    const recruitmentCount = await RecruitmentForm.countDocuments();
    console.log(`\n📝 RECRUITMENT FORMS: ${recruitmentCount}`);
    if (recruitmentCount > 0) {
      console.log('✅ Recruitment forms collection has data');
    } else {
      console.log('❌ No recruitment forms found');
    }

    // Check Activity Logs
    const activityLogCount = await ActivityLog.countDocuments();
    console.log(`\n📊 ACTIVITY LOGS: ${activityLogCount}`);
    if (activityLogCount > 0) {
      console.log('✅ Activity logs collection has data');
      const recentLogs = await ActivityLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
      console.log(`  Recent (24h): ${recentLogs}`);
    } else {
      console.log('❌ No activity logs found');
    }

    // Check Payment Settings
    const paymentSettingsCount = await PaymentSettings.countDocuments();
    console.log(`\n💳 PAYMENT SETTINGS: ${paymentSettingsCount}`);
    if (paymentSettingsCount > 0) {
      console.log('✅ Payment settings collection has data');
      const settings = await PaymentSettings.findOne();
      if (settings) {
        console.log(`  Currency: ${settings.currency}, Tax Rate: ${settings.taxRate}%`);
      }
    } else {
      console.log('❌ No payment settings found');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📋 SUMMARY:');
    
    const collections = [
      { name: 'Components', count: componentCount, target: 59, critical: true },
      { name: 'Users', count: userCount, target: 1, critical: true },
      { name: 'Books', count: bookCount, target: 1, critical: false },
      { name: 'Ebooks', count: ebookCount, target: 1, critical: false },
      { name: 'Project Items', count: projectCount, target: 1, critical: false },
      { name: 'Team Members', count: teamCount, target: 1, critical: false },
      { name: 'Notifications', count: notificationCount, target: 1, critical: false },
      { name: 'Posters', count: posterCount, target: 1, critical: false },
      { name: 'Recruitment Forms', count: recruitmentCount, target: 1, critical: false },
      { name: 'Activity Logs', count: activityLogCount, target: 1, critical: false },
      { name: 'Payment Settings', count: paymentSettingsCount, target: 1, critical: false }
    ];

    let allGood = true;
    collections.forEach(col => {
      const status = col.count >= col.target ? '✅' : '❌';
      const critical = col.critical ? ' (CRITICAL)' : '';
      console.log(`${status} ${col.name}: ${col.count}${critical}`);
      if (col.count < col.target && col.critical) {
        allGood = false;
      }
    });

    console.log('\n' + '=' .repeat(50));
    if (allGood) {
      console.log('🎉 ALL CRITICAL DATA SUCCESSFULLY SEEDED!');
      console.log('✅ Database is ready for production use');
    } else {
      console.log('❌ Some critical data is missing');
    }

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  }
}

verifyAllData();