import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interfaces for form fields
export interface IFormFieldOption {
  en: string;
  ta: string;
  value: string;
}

export interface IFormField {
  id: string;
  label: BilingualText;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number' | 'date' | 'tel' | 'url';
  options?: IFormFieldOption[];
  required: boolean;
  order: number;
  placeholder?: BilingualText;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
}

// TypeScript interface for RecruitmentForm document
export interface IRecruitmentForm extends Document {
  _id: Types.ObjectId;
  title: BilingualText;
  description?: BilingualText;
  role: 'crew' | 'participants' | 'volunteer';
  projectItemId?: Types.ObjectId;
  fields: IFormField[];
  image?: string; // Optional recruitment form image
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  maxResponses?: number;
  currentResponses: number;
  emailNotification: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

// Form field option schema
const FormFieldOptionSchema = new Schema<IFormFieldOption>({
  en: {
    type: String,
    required: [true, 'English option text is required'],
    trim: true
  },
  ta: {
    type: String,
    required: [true, 'Tamil option text is required'],
    trim: true
  },
  value: {
    type: String,
    required: [true, 'Option value is required'],
    trim: true
  }
}, { _id: false });

// Form field schema
const FormFieldSchema = new Schema<IFormField>({
  id: {
    type: String,
    required: [true, 'Field ID is required'],
    trim: true
  },
  label: {
    en: {
      type: String,
      required: [true, 'English label is required'],
      trim: true,
      maxlength: [200, 'Label cannot exceed 200 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil label is required'],
      trim: true,
      maxlength: [200, 'Label cannot exceed 200 characters']
    }
  },
  type: {
    type: String,
    required: [true, 'Field type is required'],
    enum: {
      values: ['text', 'email', 'textarea', 'select', 'checkbox', 'radio', 'file', 'number', 'date', 'tel', 'phone', 'url', 'time', 'scale', 'grid_radio', 'grid_checkbox'],
      message: 'Invalid field type'
    }
  },
  options: [FormFieldOptionSchema],
  required: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    required: [true, 'Field order is required'],
    min: [0, 'Order must be non-negative']
  },
  placeholder: {
    en: {
      type: String,
      trim: true,
      maxlength: [100, 'Placeholder cannot exceed 100 characters']
    },
    ta: {
      type: String,
      trim: true,
      maxlength: [100, 'Placeholder cannot exceed 100 characters']
    }
  },
  validation: {
    minLength: {
      type: Number,
      min: [0, 'Min length must be non-negative']
    },
    maxLength: {
      type: Number,
      min: [1, 'Max length must be positive']
    },
    pattern: {
      type: String,
      trim: true
    },
    min: {
      type: Number
    },
    max: {
      type: Number
    }
  }
}, { _id: false });

// RecruitmentForm schema definition
const RecruitmentFormSchema = new Schema<IRecruitmentForm>({
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
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    ta: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    }
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['crew', 'participants', 'volunteer'],
      message: 'Role must be crew, participants, or volunteer'
    }
  },
  projectItemId: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectItem',
    default: undefined
  },
  fields: {
    type: [FormFieldSchema],
    required: [true, 'Form fields are required'],
    validate: {
      validator: function(fields: IFormField[]) {
        return fields && fields.length > 0;
      },
      message: 'At least one form field is required'
    }
  },
  image: {
    type: String,
    trim: true,
    maxlength: [500, 'Image path cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
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
  maxResponses: {
    type: Number,
    min: [1, 'Max responses must be at least 1'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return Number.isInteger(v) && v > 0;
      },
      message: 'Max responses must be a positive integer'
    }
  },
  currentResponses: {
    type: Number,
    default: 0,
    min: [0, 'Current responses cannot be negative']
  },
  emailNotification: {
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
RecruitmentFormSchema.index({ isActive: 1, role: 1 });
RecruitmentFormSchema.index({ startDate: 1, endDate: 1 });
RecruitmentFormSchema.index({ createdBy: 1 });
RecruitmentFormSchema.index({ 'title.en': 'text', 'title.ta': 'text' });
RecruitmentFormSchema.index({ projectItemId: 1 });

// Virtual for form status
RecruitmentFormSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (!this.isActive) return 'inactive';
  if (this.maxResponses && this.currentResponses >= this.maxResponses) return 'full';
  if (this.endDate && now > this.endDate) return 'expired';
  if (this.startDate && now < this.startDate) return 'upcoming';
  
  return 'open';
});

// Virtual for availability
RecruitmentFormSchema.virtual('isAvailable').get(function() {
  return this.status === 'open';
});

// Virtual to populate creator information
RecruitmentFormSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Static method to get active forms by role
RecruitmentFormSchema.statics.getActiveByRole = function(role: string) {
  return this.find({ role, isActive: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get available forms (open for responses)
RecruitmentFormSchema.statics.getAvailableForms = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $exists: false } },
          { startDate: { $lte: now } }
        ]
      },
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } }
        ]
      }
    ]
  })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Method to increment response count
RecruitmentFormSchema.methods.incrementResponses = function() {
  this.currentResponses += 1;
  return this.save();
};

// Method to check if form accepts more responses
RecruitmentFormSchema.methods.canAcceptResponses = function() {
  const now = new Date();
  
  if (!this.isActive) return false;
  if (this.maxResponses && this.currentResponses >= this.maxResponses) return false;
  if (this.endDate && now > this.endDate) return false;
  if (this.startDate && now < this.startDate) return false;
  
  return true;
};

// Pre-save middleware to validate field IDs are unique
RecruitmentFormSchema.pre('save', function(next) {
  const fieldIds = this.fields.map(field => field.id);
  const uniqueIds = new Set(fieldIds);
  
  if (fieldIds.length !== uniqueIds.size) {
    return next(new Error('Field IDs must be unique within a form'));
  }
  
  next();
});

// Export the model
const RecruitmentForm = mongoose.models.RecruitmentForm || mongoose.model<IRecruitmentForm>('RecruitmentForm', RecruitmentFormSchema);
export default RecruitmentForm;