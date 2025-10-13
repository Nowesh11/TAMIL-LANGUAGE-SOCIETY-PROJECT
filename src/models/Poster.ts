import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for Poster document
export interface IPoster extends Document {
  _id: Types.ObjectId;
  title: BilingualText;
  description: BilingualText;
  imagePath: string;
  order: number;
  active: boolean;
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

// Indexes for better performance
PosterSchema.index({ active: 1, order: 1 });
PosterSchema.index({ createdBy: 1 });
PosterSchema.index({ createdAt: -1 });

// Compound index for active posters ordered by display order

// Virtual to populate creator information
PosterSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get active posters in order
PosterSchema.statics.getActivePosters = function() {
  return this.find({ active: true })
    .sort({ order: 1, createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Export the model
const Poster = mongoose.models.Poster || mongoose.model<IPoster>('Poster', PosterSchema);
export default Poster;