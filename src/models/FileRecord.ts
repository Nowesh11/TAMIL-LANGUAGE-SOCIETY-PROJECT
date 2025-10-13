import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface for FileRecord document
export interface IFileRecord extends Document {
  _id: Types.ObjectId;
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // in bytes
  category: 'image' | 'document' | 'video' | 'audio' | 'ebook' | 'other';
  description?: string;
  tags: string[];
  isPublic: boolean;
  downloadCount: number;
  checksum?: string; // For file integrity
  metadata?: {
    width?: number;
    height?: number;
    duration?: number; // for video/audio
    pages?: number; // for documents
    [key: string]: unknown;
  };
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// FileRecord schema definition
const FileRecordSchema = new Schema<IFileRecord>({
  path: {
    type: String,
    required: [true, 'File path is required'],
    trim: true,
    unique: true
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
    maxlength: [255, 'Original filename cannot exceed 255 characters']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        // Basic MIME type validation
        return /^[a-z]+\/[a-z0-9][a-z0-9\-\+]*$/i.test(v);
      },
      message: 'Please enter a valid MIME type'
    }
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size must be non-negative'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v) && v >= 0;
      },
      message: 'File size must be a non-negative integer'
    }
  },
  category: {
    type: String,
    required: [true, 'File category is required'],
    enum: {
      values: ['image', 'document', 'video', 'audio', 'ebook', 'other'],
      message: 'Category must be image, document, video, audio, ebook, or other'
    },
    default: 'other'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  checksum: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        // Basic hash validation (MD5, SHA1, SHA256)
        return /^[a-f0-9]{32}$|^[a-f0-9]{40}$|^[a-f0-9]{64}$/i.test(v);
      },
      message: 'Checksum must be a valid hash (MD5, SHA1, or SHA256)'
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
FileRecordSchema.index({ path: 1 }, { unique: true });
FileRecordSchema.index({ filename: 1 });
FileRecordSchema.index({ mimeType: 1, category: 1 });
FileRecordSchema.index({ category: 1, isPublic: 1 });
FileRecordSchema.index({ tags: 1 });
FileRecordSchema.index({ createdBy: 1 });
FileRecordSchema.index({ downloadCount: -1 });
FileRecordSchema.index({ size: 1 });
FileRecordSchema.index({ createdAt: -1 });

// Text index for search functionality
FileRecordSchema.index({ 
  filename: 'text', 
  originalName: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Virtual for file size in human readable format
FileRecordSchema.virtual('sizeFormatted').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (this.size === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(this.size) / Math.log(1024));
  return Math.round(this.size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for file extension
FileRecordSchema.virtual('extension').get(function() {
  const parts = this.filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() : '';
});

// Virtual for file URL (assuming a base URL)
FileRecordSchema.virtual('url').get(function() {
  // This would typically be constructed based on your file serving setup
  return `/files/${this.filename}`;
});

// Virtual to populate creator information
FileRecordSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get files by category
FileRecordSchema.statics.getByCategory = function(category: string, isPublic?: boolean) {
  const query: Record<string, unknown> = { category };
  if (typeof isPublic === 'boolean') {
    query.isPublic = isPublic;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get public files
FileRecordSchema.statics.getPublicFiles = function(category?: string) {
  const query: Record<string, unknown> = { isPublic: true };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ downloadCount: -1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get files by user
FileRecordSchema.statics.getByUser = function(userId: Types.ObjectId, category?: string) {
  const query: Record<string, unknown> = { createdBy: userId };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to search files
FileRecordSchema.statics.searchFiles = function(searchTerm: string, category?: string, isPublic?: boolean) {
  const query: Record<string, unknown> = {
    $text: { $search: searchTerm }
  };
  
  if (category) query.category = category;
  if (typeof isPublic === 'boolean') query.isPublic = isPublic;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get popular files (by download count)
FileRecordSchema.statics.getPopularFiles = function(limit: number = 10, category?: string) {
  const query: Record<string, unknown> = { isPublic: true };
  if (category) query.category = category;
  
  return this.find(query)
    .sort({ downloadCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Method to increment download count
FileRecordSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Method to check if file is an image
FileRecordSchema.methods.isImage = function() {
  return this.category === 'image' || this.mimeType.startsWith('image/');
};

// Method to check if file is a document
FileRecordSchema.methods.isDocument = function() {
  return this.category === 'document' || 
         this.mimeType.includes('pdf') || 
         this.mimeType.includes('document') ||
         this.mimeType.includes('text');
};

// Method to check if file is a video
FileRecordSchema.methods.isVideo = function() {
  return this.category === 'video' || this.mimeType.startsWith('video/');
};

// Method to check if file is audio
FileRecordSchema.methods.isAudio = function() {
  return this.category === 'audio' || this.mimeType.startsWith('audio/');
};

// Pre-save middleware to auto-detect category from MIME type
FileRecordSchema.pre('save', function(next) {
  if (this.isModified('mimeType') && this.category === 'other') {
    if (this.mimeType.startsWith('image/')) {
      this.category = 'image';
    } else if (this.mimeType.startsWith('video/')) {
      this.category = 'video';
    } else if (this.mimeType.startsWith('audio/')) {
      this.category = 'audio';
    } else if (this.mimeType.includes('pdf') || 
               this.mimeType.includes('document') || 
               this.mimeType.includes('text')) {
      this.category = 'document';
    }
  }
  next();
});

// Pre-remove middleware to handle file cleanup
FileRecordSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  // Here you could add logic to delete the actual file from storage
  // For example, if using local storage or cloud storage
  console.log(`File record deleted: ${this.path}`);
  next();
});

// Export the model
const FileRecord = mongoose.models.FileRecord || mongoose.model<IFileRecord>('FileRecord', FileRecordSchema);
export default FileRecord;