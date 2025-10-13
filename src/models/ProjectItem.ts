import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for ProjectItem document
export interface IProjectItem extends Document {
  _id: Types.ObjectId;
  type: 'project' | 'activity' | 'initiative';
  bureau?: 'sports_leadership' | 'education_intellectual' | 'arts_culture' | 'social_welfare_voluntary' | 'language_literature';
  title: BilingualText;
  shortDesc: BilingualText;
  fullDesc: BilingualText;
  images: string[];
  heroImagePath?: string;
  goals: BilingualText;
  achievement: BilingualText;
  directorName: BilingualText;
  recruitmentFormId?: Types.ObjectId;
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on-hold';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  location?: BilingualText;
  participants?: number;
  featured: boolean;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// ProjectItem schema definition
const ProjectItemSchema = new Schema<IProjectItem>({
  type: {
    type: String,
    required: [true, 'Project type is required'],
    enum: {
      values: ['project', 'activity', 'initiative'],
      message: 'Type must be project, activity, or initiative'
    }
  },
  bureau: {
    type: String,
    enum: {
      values: ['sports_leadership', 'education_intellectual', 'arts_culture', 'social_welfare_voluntary', 'language_literature'],
      message: 'Invalid bureau'
    },
    default: undefined
  },
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
  shortDesc: {
    en: {
      type: String,
      required: [true, 'English short description is required'],
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil short description is required'],
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters']
    }
  },
  fullDesc: {
    en: {
      type: String,
      required: [true, 'English full description is required'],
      trim: true,
      maxlength: [5000, 'Full description cannot exceed 5000 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil full description is required'],
      trim: true,
      maxlength: [5000, 'Full description cannot exceed 5000 characters']
    }
  },
  images: [{
    type: String,
    trim: true
  }],
  heroImagePath: {
    type: String,
    trim: true,
    default: undefined
  },
  goals: {
    en: {
      type: String,
      required: [true, 'English goals are required'],
      trim: true,
      maxlength: [2000, 'Goals cannot exceed 2000 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil goals are required'],
      trim: true,
      maxlength: [2000, 'Goals cannot exceed 2000 characters']
    }
  },
  achievement: {
    en: {
      type: String,
      trim: true,
      maxlength: [2000, 'Achievement cannot exceed 2000 characters']
    },
    ta: {
      type: String,
      trim: true,
      maxlength: [2000, 'Achievement cannot exceed 2000 characters']
    }
  },
  directorName: {
    en: {
      type: String,
      required: [true, 'English director name is required'],
      trim: true,
      maxlength: [100, 'Director name cannot exceed 100 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil director name is required'],
      trim: true,
      maxlength: [100, 'Director name cannot exceed 100 characters']
    }
  },
  recruitmentFormId: {
    type: Schema.Types.ObjectId,
    ref: 'RecruitmentForm'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['planning', 'active', 'completed', 'cancelled', 'on-hold'],
      message: 'Status must be planning, active, completed, cancelled, or on-hold'
    },
    default: 'planning'
  },
  startDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Start date must be a valid date'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        if (!(v instanceof Date) || isNaN(v.getTime())) return false;
        // If both start and end dates exist, end should be after start
        if (this.startDate && v <= this.startDate) return false;
        return true;
      },
      message: 'End date must be a valid date and after start date'
    }
  },
  budget: {
    type: Number,
    min: [0, 'Budget must be a positive number'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Budget must be a valid positive number'
    }
  },
  location: {
    en: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    ta: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    }
  },
  participants: {
    type: Number,
    min: [0, 'Participants count must be non-negative'],
    default: 0
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

// Indexes for better performance
ProjectItemSchema.index({ type: 1, active: 1, featured: -1 });
ProjectItemSchema.index({ status: 1, active: 1 });
ProjectItemSchema.index({ bureau: 1 });
ProjectItemSchema.index({ 'title.en': 'text', 'title.ta': 'text', 'shortDesc.en': 'text', 'shortDesc.ta': 'text' });
ProjectItemSchema.index({ startDate: 1, endDate: 1 });
ProjectItemSchema.index({ createdBy: 1 });
ProjectItemSchema.index({ recruitmentFormId: 1 });

// Virtual for duration in days
ProjectItemSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return null;
  const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for project progress status
ProjectItemSchema.virtual('progressStatus').get(function() {
  const now = new Date();
  if (!this.startDate) return 'not-started';
  if (this.status === 'completed') return 'completed';
  if (this.status === 'cancelled') return 'cancelled';
  if (this.status === 'on-hold') return 'on-hold';
  if (now < this.startDate) return 'upcoming';
  if (this.endDate && now > this.endDate) return 'overdue';
  return 'in-progress';
});

// Virtual to populate creator information
ProjectItemSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate recruitment form
ProjectItemSchema.virtual('recruitmentForm', {
  ref: 'RecruitmentForm',
  localField: 'recruitmentFormId',
  foreignField: '_id',
  justOne: true
});

// Static method to get active projects by type
ProjectItemSchema.statics.getActiveByType = function(type: string) {
  return this.find({ type, active: true })
    .sort({ featured: -1, createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('recruitmentFormId');
};

// Static method to get featured projects
ProjectItemSchema.statics.getFeatured = function() {
  return this.find({ active: true, featured: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('recruitmentFormId');
};

// Static method to get projects by status
ProjectItemSchema.statics.getByStatus = function(status: string) {
  return this.find({ status, active: true })
    .sort({ startDate: -1, createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('recruitmentFormId');
};

// Method to check if recruitment is open
ProjectItemSchema.methods.isRecruitmentOpen = function() {
  return this.recruitmentFormId && this.status === 'active';
};

// Export the model
const ProjectItem = mongoose.models.ProjectItem || mongoose.model<IProjectItem>('ProjectItem', ProjectItemSchema);
export default ProjectItem;