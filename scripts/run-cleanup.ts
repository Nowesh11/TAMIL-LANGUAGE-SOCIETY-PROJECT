import { cleanupOrphanUploads } from '../src/lib/cleanup';
import dbConnect from '../src/lib/mongodb';
import mongoose from 'mongoose';

// Register all models for cleanup
import '../src/models/Book';
import '../src/models/Component';
import '../src/models/EBook';
import '../src/models/PaymentSettings';
import '../src/models/Poster';
import '../src/models/ProjectItem';
import '../src/models/Purchase';
import '../src/models/RecruitmentResponse';
import '../src/models/RecruitmentForm';
import '../src/models/Team';
import '../src/models/User';
import '../src/models/ActivityLog';
import '../src/models/ChatMessage';
import '../src/models/Notification';
import '../src/models/NotificationTemplate';
import '../src/models/PasswordResetToken';
import '../src/models/RefreshToken';

async function main() {
  console.log('🚀 Starting Orphan Uploads Cleanup...');
  try {
    await dbConnect();
    const result = await cleanupOrphanUploads();
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ Cleanup failed: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error during script execution:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🏁 Script finished.');
    process.exit(0);
  }
}

main();
