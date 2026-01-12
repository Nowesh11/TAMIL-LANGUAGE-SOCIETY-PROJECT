import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

export interface FileUploadResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
  url?: string;
}

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export class FileHandler {
  private static baseUploadDir = path.join(process.cwd(), 'uploads');

  /**
   * Ensure upload directory exists
   */
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * File signature validation for security
   */
  private static validateFileSignature(buffer: Buffer, fileName: string): boolean {
    const fileExtension = path.extname(fileName).toLowerCase();
    
    // Common file signatures (magic numbers)
    const signatures: { [key: string]: number[][] } = {
      '.jpg': [[0xFF, 0xD8, 0xFF]],
      '.jpeg': [[0xFF, 0xD8, 0xFF]],
      '.png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
      '.gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
      '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
      '.pdf': [[0x25, 0x50, 0x44, 0x46]],
      '.mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
      '.webm': [[0x1A, 0x45, 0xDF, 0xA3]],
      '.avi': [[0x52, 0x49, 0x46, 0x46]]
    };

    const fileSignatures = signatures[fileExtension];
    if (!fileSignatures) return true; // No signature check for this type

    return fileSignatures.some(signature => {
      if (buffer.length < signature.length) return false;
      return signature.every((byte, index) => buffer[index] === byte);
    });
  }

  /**
   * Enhanced file validation with security checks
   */
  private static async validateFile(file: File, options: FileValidationOptions = {}): Promise<{ valid: boolean; error?: string }> {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
    }

    // Check for empty files
    if (file.size === 0) {
      return { valid: false, error: 'Empty files are not allowed' };
    }

    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} is not allowed` };
    }

    // Check file extension
    const fileExtension = path.extname(file.name).toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(fileExtension)) {
      return { valid: false, error: `File extension ${fileExtension} is not allowed` };
    }

    // Security checks for file name
    const fileName = file.name;
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return { valid: false, error: 'Invalid file name' };
    }

    // Check for suspicious file names
    const suspiciousPatterns = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
    if (suspiciousPatterns.some(pattern => fileName.toLowerCase().includes(pattern))) {
      return { valid: false, error: 'File type not allowed for security reasons' };
    }

    // Validate file signature for supported types
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      if (!this.validateFileSignature(buffer, fileName)) {
        return { valid: false, error: 'File signature does not match extension' };
      }
    } catch (error) {
      return { valid: false, error: 'Unable to validate file content' };
    }

    return { valid: true };
  }

  /**
   * Generate unique filename
   */
  private static generateUniqueFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${prefix ? prefix + '_' : ''}${baseName}_${timestamp}_${random}${extension}`;
  }

  /**
   * Save file to specific directory
   */
  public static async saveFile(
    file: File,
    category: string,
    subCategory?: string,
    options: FileValidationOptions = {},
    customFileName?: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = await this.validateFile(file, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create directory structure
      const categoryDir = path.join(this.baseUploadDir, category);
      const targetDir = subCategory ? path.join(categoryDir, subCategory) : categoryDir;
      this.ensureDirectoryExists(targetDir);

      // Generate filename
      let fileName = customFileName || this.generateUniqueFileName(file.name);
      
      // If customFileName is provided and doesn't have an extension, append the original file's extension
      if (customFileName && !path.extname(customFileName)) {
        const ext = path.extname(file.name);
        fileName = `${customFileName}${ext}`;
      }

      const filePath = path.join(targetDir, fileName);

      // Convert file to buffer and save
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      // Generate relative path for database storage
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
      
      // Generate URL for API access
      const url = `/api/files/serve?path=${encodeURIComponent(relativePath)}`;

      return {
        success: true,
        filePath: relativePath,
        fileName,
        url
      };
    } catch (error) {
      console.error('File save error:', error);
      return { success: false, error: 'Failed to save file' };
    }
  }

  /**
   * Save image with specific optimizations
   */
  public static async saveImage(
    file: File,
    category: string,
    subCategory?: string,
    customFileName?: string
  ): Promise<FileUploadResult> {
    const imageOptions: FileValidationOptions = {
      maxSize: 5 * 1024 * 1024, // 5MB for images
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    };

    return this.saveFile(file, category, subCategory, imageOptions, customFileName);
  }

  /**
   * Save document files
   */
  public static async saveDocument(
    file: File,
    category: string,
    subCategory?: string,
    customFileName?: string
  ): Promise<FileUploadResult> {
    const documentOptions: FileValidationOptions = {
      maxSize: 20 * 1024 * 1024, // 20MB for documents
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions: ['.pdf', '.doc', '.docx']
    };

    return this.saveFile(file, category, subCategory, documentOptions, customFileName);
  }

  /**
   * Save video files
   */
  public static async saveVideo(
    file: File,
    category: string,
    subCategory?: string,
    customFileName?: string
  ): Promise<FileUploadResult> {
    const videoOptions: FileValidationOptions = {
      maxSize: 100 * 1024 * 1024, // 100MB for videos
      allowedTypes: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/quicktime'
      ],
      allowedExtensions: ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.qt']
    };

    return this.saveFile(file, category, subCategory, videoOptions, customFileName);
  }

  /**
   * Save media files (images or videos) with automatic type detection
   */
  public static async saveMedia(
    file: File,
    category: string,
    subCategory?: string,
    customFileName?: string
  ): Promise<FileUploadResult> {
    // Detect media type based on file MIME type
    if (file.type.startsWith('image/')) {
      return this.saveImage(file, category, subCategory, customFileName);
    } else if (file.type.startsWith('video/')) {
      return this.saveVideo(file, category, subCategory, customFileName);
    } else {
      return { success: false, error: 'Unsupported media type. Only images and videos are allowed.' };
    }
  }

  /**
   * Delete file
   */
  public static deleteFile(relativePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * Delete directory and all its contents
   */
  public static deleteDirectory(relativePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Directory deletion error:', error);
      return false;
    }
  }

  /**
   * Get file info
   */
  public static getFileInfo(relativePath: string): { exists: boolean; size?: number; mtime?: Date } {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return {
          exists: true,
          size: stats.size,
          mtime: stats.mtime
        };
      }
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  /**
   * Get file content for serving
   */
  public static async getFile(relativePath: string): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; error?: string }> {
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(fullPath)) {
        return { success: false, error: 'File not found' };
      }
      
      const buffer = fs.readFileSync(fullPath);
      
      // Determine mime type
      const ext = path.extname(fullPath).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.ogg': 'video/ogg',
        '.avi': 'video/x-msvideo',
        '.mov': 'video/quicktime',
        '.wmv': 'video/x-ms-wmv'
      };
      
      return { success: true, buffer, mimeType: mimeTypes[ext] || 'application/octet-stream' };
    } catch (error) {
      console.error('File read error:', error);
      return { success: false, error: 'Failed to read file' };
    }
  }
  /**
   * List files in directory
   */
  public static listFiles(category: string, subCategory?: string): string[] {
    try {
      const targetDir = subCategory 
        ? path.join(this.baseUploadDir, category, subCategory)
        : path.join(this.baseUploadDir, category);
      
      if (!fs.existsSync(targetDir)) {
        return [];
      }

      return fs.readdirSync(targetDir).filter(file => {
        const filePath = path.join(targetDir, file);
        return fs.statSync(filePath).isFile();
      });
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }

  /**
   * Clean up old files (older than specified days)
   */
  public static cleanupOldFiles(category: string, daysOld: number = 30): number {
    try {
      const categoryDir = path.join(this.baseUploadDir, category);
      if (!fs.existsSync(categoryDir)) {
        return 0;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      
      const processDirectory = (dirPath: string) => {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            processDirectory(itemPath);
          } else if (stats.mtime < cutoffDate) {
            fs.unlinkSync(itemPath);
            deletedCount++;
          }
        }
      };

      processDirectory(categoryDir);
      return deletedCount;
    } catch (error) {
      console.error('Cleanup error:', error);
      return 0;
    }
  }
}

// Utility functions for common upload scenarios
export const uploadUserAvatar = (file: File, userId: string) => 
  FileHandler.saveImage(file, 'users', 'avatars', `avatar_${userId}`);

export const uploadPosterImage = (file: File, posterId: string) => 
  FileHandler.saveImage(file, 'posters', posterId, 'image');

export const uploadTeamMemberPhoto = (file: File, memberId: string) => 
  FileHandler.saveImage(file, 'team', memberId, 'photo');

export const uploadBookCover = (file: File, bookId: string) => 
  FileHandler.saveImage(file, 'books', bookId, 'cover');

export const uploadEbookCover = (file: File, ebookId: string) => 
  FileHandler.saveImage(file, 'ebooks', ebookId, 'cover');

export const uploadEbookFile = (file: File, ebookId: string) => 
  FileHandler.saveDocument(file, 'ebooks', ebookId, 'file');

export const uploadProjectImage = (file: File, projectId: string) => 
  FileHandler.saveImage(file, 'projectitems', `${projectId}/images`, 'image');

export const uploadLogo = (file: File, type: 'navbar' | 'footer') => 
  FileHandler.saveImage(file, 'components', `logos/${type}`, 'logo');

// Component media upload utilities
export const uploadComponentImage = (file: File, componentType: string, componentId: string, fieldName?: string) => 
  FileHandler.saveImage(file, 'components', `${componentType}/${componentId}${fieldName ? `/${fieldName}` : ''}`, fieldName);

export const uploadComponentVideo = (file: File, componentType: string, componentId: string, fieldName?: string) => 
  FileHandler.saveVideo(file, 'components', `${componentType}/${componentId}${fieldName ? `/${fieldName}` : ''}`, fieldName);

export const uploadComponentMedia = (file: File, componentType: string, componentId: string, fieldName?: string) => 
  FileHandler.saveMedia(file, 'components', `${componentType}/${componentId}${fieldName ? `/${fieldName}` : ''}`, fieldName);

export const uploadHeroBackground = (file: File, componentId: string) => 
  FileHandler.saveImage(file, 'components', `hero/${componentId}/backgrounds`, 'background');

export const uploadGalleryImage = (file: File, componentId: string, imageIndex?: number) => 
  FileHandler.saveImage(file, 'components', `gallery/${componentId}/images`, imageIndex ? `image_${imageIndex}` : undefined);

export const uploadVideoComponent = (file: File, componentId: string) => 
  FileHandler.saveVideo(file, 'components', `video/${componentId}`, 'video');

export const uploadBannerImage = (file: File, componentId: string) => 
  FileHandler.saveImage(file, 'components', `banner/${componentId}`, 'banner');

export const uploadTestimonialAvatar = (file: File, componentId: string, testimonialIndex: number) => 
  FileHandler.saveImage(file, 'components', `testimonials/${componentId}/avatars`, `avatar_${testimonialIndex}`);