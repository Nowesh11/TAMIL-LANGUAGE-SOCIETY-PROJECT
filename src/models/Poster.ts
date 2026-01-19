import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for Poster document
export interface IPoster extends Document {
  _id: Types.ObjectId;
  title: BilingualText;
  description: BilingualText;
  category: string;
  imagePath: string;
  order: number;
  isActive: boolean;
  isFeatured: boolean;
  eventDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Poster schema definition
const PosterSchema = new Schema<IPoster>({
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
  description: {
    en: {
      type: String,
      required: [true, 'English description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    }
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['event', 'announcement', 'cultural', 'educational', 'sports', 'social', 'promotional', 'news'],
      message: 'Invalid category'
    }
  },
  imagePath: {
    type: String,
    required: [true, 'Image path is required'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: [0, 'Order must be a positive number'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  eventDate: {
    type: Date,
    default: null
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
PosterSchema.index({ isActive: 1, order: 1 });
PosterSchema.index({ isFeatured: 1 });
PosterSchema.index({ category: 1 });
PosterSchema.index({ createdBy: 1 });
PosterSchema.index({ createdAt: -1 });
PosterSchema.index({ eventDate: -1 });

// Compound indexes
PosterSchema.index({ isActive: 1, isFeatured: 1, order: 1 });
PosterSchema.index({ category: 1, isActive: 1 });

// Virtual to populate creator information
PosterSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get active posters in order
PosterSchema.statics.getActivePosters = function() {
  return this.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get featured posters
PosterSchema.statics.getFeaturedPosters = function() {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ order: 1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Import notification triggers
import { NotificationTriggers } from '../lib/notificationTriggers';
import { FileHandler } from '../lib/fileHandler';

// Post-save middleware for create/update notifications
PosterSchema.post('save', async function(doc, next) {
  try {
    if (this.isNew) {
      // Poster created
      await NotificationTriggers.onPosterChange('created', doc, doc.createdBy);
    } else {
      // Poster updated
      await NotificationTriggers.onPosterChange('updated', doc, doc.createdBy);
    }
  } catch (error) {
    console.error('Error creating poster notification:', error);
  }
  next();
});

// Post-remove middleware for delete notifications
PosterSchema.post('findOneAndDelete', async function(doc) {
  try {
    if (doc) {
      await NotificationTriggers.onPosterChange('deleted', doc, doc.createdBy);
      const dir = `uploads/posters/${String(doc._id)}`;
      FileHandler.deleteDirectory(dir);
    }
  } catch (error) {
    console.error('Error creating poster deletion notification:', error);
  }
});

// Export the model
const Poster = mongoose.models.Poster || mongoose.model<IPoster>('Poster', PosterSchema);
export default Poster;
