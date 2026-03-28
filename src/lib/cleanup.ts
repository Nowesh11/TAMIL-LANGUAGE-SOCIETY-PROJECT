import fs from 'fs/promises';
import path from 'path';
import dbConnect from './mongodb';
import mongoose from 'mongoose';

// Map upload folder names to their corresponding Mongoose models
// The folder name in uploads/{collectionName} must match these keys
const collectionModelMap: Record<string, string> = {
  'books': 'Book',
  'team': 'Team',
  'posters': 'Poster',
  'components': 'Component',
  'project-items': 'ProjectItem',
  'projectitems': 'ProjectItem',
  'ebooks': 'EBook',
  'recruitment': 'RecruitmentResponse',
  'recruitment-forms': 'RecruitmentForm',
  'payment-qr': 'PaymentSettings',
  'purchases': 'Purchase'
};

/**
 * Scan uploads/ folder and remove orphan folders (folders whose ID is not in DB)
 */
export async function cleanupOrphanUploads() {
  await dbConnect();
  const uploadsRoot = path.join(process.cwd(), 'uploads');
  
  try {
    const collections = await fs.readdir(uploadsRoot);
    
    for (const collectionName of collections) {
      const modelName = collectionModelMap[collectionName];
      if (!modelName) {
        console.warn(`⚠️ No model mapping for collection folder: ${collectionName}`);
        continue;
      }
      
      const model = mongoose.models[modelName];
      if (!model) {
        console.error(`❌ Model not found for: ${modelName}`);
        continue;
      }
      
      const collectionPath = path.join(uploadsRoot, collectionName);
      const documentFolders = await fs.readdir(collectionPath);
      
      for (const docId of documentFolders) {
        // Skip if docId is not a valid MongoDB ID (optional check)
        if (!mongoose.Types.ObjectId.isValid(docId)) {
          console.warn(`⚠️ Invalid ID folder skipped: ${collectionName}/${docId}`);
          continue;
        }
        
        const folderPath = path.join(collectionPath, docId);
        const exists = await model.exists({ _id: docId });
        
        if (!exists) {
          console.log(`🧹 Removing orphan folder: ${collectionName}/${docId}`);
          await fs.rm(folderPath, { recursive: true, force: true });
        }
      }
    }
    
    return { success: true, message: 'Orphan uploads cleanup completed.' };
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
