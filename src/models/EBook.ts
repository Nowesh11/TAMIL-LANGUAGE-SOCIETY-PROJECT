import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for EBook document
export interface IEBook extends Document {
  _id: Types.ObjectId;
  title: BilingualText;
  author: BilingualText;
  description: BilingualText;
  filePath: string;
  coverPath: string;
  fileSize?: number; // in bytes
  fileFormat: 'pdf' | 'epub' | 'mobi' | 'txt';
  isbn?: string;
  category?: string;
  publishedYear?: number;
  pages?: number;
  language: 'tamil' | 'english' | 'bilingual';
  featured: boolean;
  active: boolean;
  downloadCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// EBook schema definition
const EBookSchema = new Schema<IEBook>({
  title: {
    en: {
      type: String,
      required: [true, 'English title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    }
  },
  author: {
    en: {
      type: String,
      required: [true, 'English author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil author name is required'],
      trim: true,
      maxlength: [100, 'Author name cannot exceed 100 characters']
    }
  },
  description: {
    en: {
      type: String,
      required: [true, 'English description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    }
  },
  filePath: {
    type: String,
    required: [true, 'File path is required'],
    trim: true
  },
  coverPath: {
    type: String,
    required: [true, 'Cover image path is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    min: [0, 'File size must be positive'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return v >= 0 && Number.isInteger(v);
      },
      message: 'File size must be a positive integer'
    }
  },
  fileFormat: {
    type: String,
    required: [true, 'File format is required'],
    enum: {
      values: ['pdf', 'epub', 'mobi', 'txt'],
      message: 'File format must be pdf, epub, mobi, or txt'
    },
    lowercase: true
  },
  isbn: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/.test(v);
      },
      message: 'Please enter a valid ISBN'
    }
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be valid'],
    max: [new Date().getFullYear(), 'Published year cannot be in the future']
  },
  pages: {
    type: Number,
    min: [1, 'Pages must be at least 1']
  },
  language: {
    type: String,
    enum: {
      values: ['tamil', 'english', 'bilingual'],
      message: 'Language must be tamil, english, or bilingual'
    },
    default: 'tamil'
  },
  featured: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
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

// Indexes for performance optimization
EBookSchema.index({ active: 1, featured: -1, createdAt: -1 });
// Text index without language specification to avoid conflicts
EBookSchema.index({ 
  'title.en': 'text', 
  'title.ta': 'text', 
  'author.en': 'text', 
  'author.ta': 'text' 
});
EBookSchema.index({ category: 1, active: 1 });
EBookSchema.index({ language: 1, active: 1 });
EBookSchema.index({ fileFormat: 1, active: 1 });
EBookSchema.index({ downloadCount: -1 });
EBookSchema.index({ createdBy: 1 });

// Virtual for file size in human readable format
EBookSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual to populate creator information
EBookSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get available ebooks
EBookSchema.statics.getAvailableEBooks = function() {
  return this.find({ active: true })
    .sort({ featured: -1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get featured ebooks
EBookSchema.statics.getFeaturedEBooks = function() {
  return this.find({ active: true, featured: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get popular ebooks (by download count)
EBookSchema.statics.getPopularEBooks = function(limit: number = 10) {
  return this.find({ active: true })
    .sort({ downloadCount: -1, createdAt: -1 })
    .limit(limit)
    .populate('createdBy', 'name email');
};

// Method to increment download count
EBookSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

// Import notification triggers
import { NotificationTriggers } from '../lib/notificationTriggers';

// Post-save middleware for create/update notifications
EBookSchema.post('save', async function(doc, next) {
  try {
    if (this.isNew) {
      // EBook created
      await NotificationTriggers.onEBookChange('created', doc, doc.createdBy);
    } else {
      // EBook updated
      await NotificationTriggers.onEBookChange('updated', doc, doc.createdBy);
    }
  } catch (error) {
    console.error('Error creating ebook notification:', error);
  }
  next();
});

// Post-remove middleware for delete notifications
EBookSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      await NotificationTriggers.onEBookChange('deleted', doc, doc.createdBy);
    }
  } catch (error) {
    console.error('Error creating ebook deletion notification:', error);
  }
});

// Export the model
const EBook = mongoose.models.EBook || mongoose.model<IEBook>('EBook', EBookSchema);
export default EBook;