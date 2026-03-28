import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

/**
 * Ensures that a directory exists, creating it if necessary.
 */
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Validates file type and size.
 */
export function validateFile(file: File) {
  const allowedMimeTypes = [
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', // quicktime is .mov
    'application/pdf'
  ];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: images, mp4, mov, pdf.`);
  }

  if (file.size > maxFileSize) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 50MB.`);
  }
}

/**
 * Saves a file to uploads/{collection}/{id}/
 */
export async function saveFile(file: File, collection: string, id: string) {
  validateFile(file);

  const folderPath = path.join(UPLOADS_ROOT, collection, id);
  await ensureDir(folderPath);

  const fileExtension = path.extname(file.name);
  const fileName = `${uuidv4()}${fileExtension}`;
  const filePath = path.join(folderPath, fileName);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Return the relative path for database storage
  return `uploads/${collection}/${id}/${fileName}`;
}

/**
 * Deletes a file from disk.
 */
export async function deleteFile(relativePath: string) {
  if (!relativePath) return;
  
  const absolutePath = path.join(process.cwd(), relativePath);
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    console.error(`Failed to delete file: ${absolutePath}`, error);
  }
}

/**
 * Replaces an old file with a new one.
 */
export async function replaceFile(newFile: File | null, oldPath: string | undefined, collection: string, id: string) {
  if (!newFile) return oldPath;

  // 1. Delete old file if it exists
  if (oldPath) {
    await deleteFile(oldPath);
  }

  // 2. Save new file
  return await saveFile(newFile, collection, id);
}

/**
 * Deletes the entire folder for a document: uploads/{collection}/{id}/
 */
export async function deleteFolder(collection: string, id: string) {
  const folderPath = path.join(UPLOADS_ROOT, collection, id);
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to delete folder: ${folderPath}`, error);
  }
}

/**
 * Helper to get absolute path from relative path
 */
export function getAbsolutePath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}
