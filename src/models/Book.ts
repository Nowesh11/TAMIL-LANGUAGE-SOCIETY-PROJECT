import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for Book document
export interface IBook extends Document {
  _id: Types.ObjectId;
  title: BilingualText;
  author: BilingualText;
  description: BilingualText;
  price: number;
  stock: number;
  coverPath: string;
  isbn?: string;
  category?: string;
  publishedYear?: number;
  pages?: number;
  language: 'tamil' | 'english' | 'bilingual';
  featured: boolean;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Book schema definition
const BookSchema = new Schema<IBook>({
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number'],
    validate: {
      validator: function(v: number) {
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Price must be a valid positive number'
    }
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock must be a non-negative number'],
    default: 0
  },
  coverPath: {
    type: String,
    required: [true, 'Cover image path is required'],
    trim: true
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
BookSchema.index({ active: 1, featured: -1, createdAt: -1 });
// Text index without language specification to avoid conflicts
BookSchema.index({ 
  'title.en': 'text', 
  'title.ta': 'text', 
  'author.en': 'text', 
  'author.ta': 'text' 
});
BookSchema.index({ category: 1, active: 1 });
BookSchema.index({ language: 1, active: 1 });
BookSchema.index({ stock: 1, active: 1 });
BookSchema.index({ price: 1 });
BookSchema.index({ createdBy: 1 });

// Virtual for availability status
BookSchema.virtual('isAvailable').get(function() {
  return this.active && this.stock > 0;
});

// Virtual to populate creator information
BookSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get available books
BookSchema.statics.getAvailableBooks = function() {
  return this.find({ active: true, stock: { $gt: 0 } })
    .sort({ featured: -1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get featured books
BookSchema.statics.getFeaturedBooks = function() {
  return this.find({ active: true, featured: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Method to check if book is in stock
BookSchema.methods.isInStock = function(quantity: number = 1) {
  return this.active && this.stock >= quantity;
};

// Method to reduce stock
BookSchema.methods.reduceStock = function(quantity: number) {
  if (this.stock >= quantity) {
    this.stock -= quantity;
    return this.save();
  }
  throw new Error('Insufficient stock');
};

// Import notification triggers
import { NotificationTriggers } from '../lib/notificationTriggers';

// Post-save middleware for create/update notifications
BookSchema.post('save', async function(doc, next) {
  try {
    if (this.isNew) {
      // Book created
      await NotificationTriggers.onBookChange('created', doc, doc.createdBy);
    } else {
      // Book updated
      await NotificationTriggers.onBookChange('updated', doc, doc.createdBy);
    }
  } catch (error) {
    console.error('Error creating book notification:', error);
  }
  next();
});

// Post-remove middleware for delete notifications
BookSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      await NotificationTriggers.onBookChange('deleted', doc, doc.createdBy);
    }
  } catch (error) {
    console.error('Error creating book deletion notification:', error);
  }
});

// Export the model
const Book = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
export default Book;