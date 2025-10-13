#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import Component from '../src/models/Component';

async function connect() {
  dotenv.config({ path: path.join(process.cwd(), '.env.local') });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tamil-language-society';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

async function removeNonHomeGlobal() {
  // Remove navbar/footer for pages other than 'home'
  const res = await Component.deleteMany({ type: { $in: ['navbar', 'footer'] }, page: { $ne: 'home' } });
  console.log(`🧹 Removed non-home navbar/footer: ${res.deletedCount}`);
}

async function dedupeByTypePageBureau() {
  // Find groups with duplicates where type+page(+bureau) matches
  const dupGroups = await Component.aggregate([
    {
      $group: {
        _id: { type: '$type', page: '$page', bureau: '$bureau' },
        count: { $sum: 1 },
        ids: { $push: '$_id' },
        latestId: { $max: '$_id' } // Use ObjectId ordering to keep latest
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  let totalRemoved = 0;
  for (const g of dupGroups) {
    const keepId = g.latestId;
    const removeIds = (g.ids as mongoose.Types.ObjectId[]).filter((id) => id.toString() !== keepId.toString());
    if (removeIds.length > 0) {
      const r = await Component.deleteMany({ _id: { $in: removeIds } });
      totalRemoved += r.deletedCount || 0;
      console.log(`🧹 Duplicates pruned for ${g._id.type}/${g._id.page}${g._id.bureau ? '/' + g._id.bureau : ''}: removed ${r.deletedCount}`);
    }
  }
  console.log(`✅ Deduplication complete. Total removed: ${totalRemoved}`);
}

async function main() {
  await connect();
  await removeNonHomeGlobal();
  await dedupeByTypePageBureau();
  await mongoose.connection.close();
  console.log('✅ Cleanup completed and connection closed');
}

main().catch(async (err) => {
  console.error('❌ Cleanup failed:', err);
  await mongoose.connection.close();
  process.exit(1);
});