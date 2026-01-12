
import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
      console.log('Admin found:', admin._id, admin.email);
    } else {
      console.log('Admin NOT found!');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
  }
}

verifyAdmin();
