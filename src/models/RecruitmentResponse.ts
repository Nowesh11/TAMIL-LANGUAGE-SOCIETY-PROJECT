import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface for form answers (key-value pairs)
export interface IFormAnswer {
  [fieldId: string]: unknown; // Can be string, number, boolean, array, etc.
}

// TypeScript interface for RecruitmentResponse document
export interface IRecruitmentResponse extends Document {
  _id: Types.ObjectId;
  formRef: Types.ObjectId;
  projectItemRef?: Types.ObjectId;
  roleApplied: 'crew' | 'volunteer' | 'participant' | 'participants';
  answers: IFormAnswer;
  userRef?: Types.ObjectId; // Optional if anonymous submissions allowed
  applicantEmail: string;
  applicantName: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'waitlisted';
  reviewNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  submittedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

// RecruitmentResponse schema definition
const RecruitmentResponseSchema = new Schema<IRecruitmentResponse>({
  formRef: {
    type: Schema.Types.ObjectId,
    ref: 'RecruitmentForm',
    required: [true, 'Form reference is required']
  },
  projectItemRef: {
    type: Schema.Types.ObjectId,
    ref: 'ProjectItem'
  },
  roleApplied: {
    type: String,
    required: [true, 'Role applied is required'],
    enum: {
      values: ['crew', 'volunteer', 'participant', 'participants'],
      message: 'Role applied must be crew, volunteer, participant, or participants'
    }
  },
  answers: {
    type: Schema.Types.Mixed,
    required: [true, 'Answers are required'],
    validate: {
      validator: function(answers: IFormAnswer) {
        return answers && typeof answers === 'object' && Object.keys(answers).length > 0;
      },
      message: 'At least one answer is required'
    }
  },
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  applicantEmail: {
    type: String,
    required: [true, 'Applicant email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  applicantName: {
    type: String,
    required: [true, 'Applicant name is required'],
    trim: true,
    maxlength: [100, 'Applicant name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'reviewed', 'accepted', 'rejected', 'waitlisted'],
      message: 'Status must be pending, reviewed, accepted, rejected, or waitlisted'
    },
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Reviewed at must be a valid date'
    }
  },
  submittedAt: {
    type: Date,
    required: [true, 'Submitted at is required'],
    default: Date.now
  },
  ipAddress: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        // Basic IP validation (IPv4 and IPv6)
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(v) || ipv6Regex.test(v);
      },
      message: 'Please enter a valid IP address'
    }
  },
  userAgent: {
    type: String,
    trim: true,
    maxlength: [500, 'User agent cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
RecruitmentResponseSchema.index({ formRef: 1, status: 1 });
RecruitmentResponseSchema.index({ projectItemRef: 1, status: 1 });
RecruitmentResponseSchema.index({ userRef: 1 });
RecruitmentResponseSchema.index({ applicantEmail: 1 });
RecruitmentResponseSchema.index({ roleApplied: 1, status: 1 });
RecruitmentResponseSchema.index({ submittedAt: -1 });
RecruitmentResponseSchema.index({ reviewedBy: 1, reviewedAt: -1 });

// Compound index for form and applicant (to prevent duplicate submissions)
RecruitmentResponseSchema.index({ formRef: 1, applicantEmail: 1 }, { unique: true });

// Virtual to populate form information
RecruitmentResponseSchema.virtual('form', {
  ref: 'RecruitmentForm',
  localField: 'formRef',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate project information
RecruitmentResponseSchema.virtual('project', {
  ref: 'ProjectItem',
  localField: 'projectItemRef',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user information
RecruitmentResponseSchema.virtual('user', {
  ref: 'User',
  localField: 'userRef',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate reviewer information
RecruitmentResponseSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true
});

// Virtual for response age in days
RecruitmentResponseSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.submittedAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for review status
RecruitmentResponseSchema.virtual('isReviewed').get(function() {
  return this.status !== 'pending';
});

// Static method to get responses by form
RecruitmentResponseSchema.statics.getByForm = function(formId: Types.ObjectId, status?: string) {
  const query: Record<string, unknown> = { formRef: formId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ submittedAt: -1 })
    .populate('userRef', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('formRef', 'title role')
    .populate('projectItemRef', 'title type');
};

// Static method to get responses by project
RecruitmentResponseSchema.statics.getByProject = function(projectId: Types.ObjectId, status?: string) {
  const query: Record<string, unknown> = { projectItemRef: projectId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ submittedAt: -1 })
    .populate('userRef', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('formRef', 'title role')
    .populate('projectItemRef', 'title type');
};

// Static method to get pending responses
RecruitmentResponseSchema.statics.getPendingResponses = function() {
  return this.find({ status: 'pending' })
    .sort({ submittedAt: 1 }) // Oldest first for review
    .populate('userRef', 'name email')
    .populate('formRef', 'title role')
    .populate('projectItemRef', 'title type');
};

// Method to update status with review information
RecruitmentResponseSchema.methods.updateStatus = function(
  status: string, 
  reviewedBy: Types.ObjectId, 
  reviewNotes?: string
) {
  this.status = status;
  this.reviewedBy = reviewedBy;
  this.reviewedAt = new Date();
  if (reviewNotes) this.reviewNotes = reviewNotes;
  
  return this.save();
};

// Method to get specific answer by field ID
RecruitmentResponseSchema.methods.getAnswer = function(fieldId: string) {
  return this.answers[fieldId];
};

// Method to get all answers as formatted object
RecruitmentResponseSchema.methods.getFormattedAnswers = function() {
  return Object.entries(this.answers).map(([fieldId, value]) => ({
    fieldId,
    value,
    displayValue: Array.isArray(value) ? value.join(', ') : String(value)
  }));
};

// Pre-save middleware to validate answers against form fields
RecruitmentResponseSchema.pre('save', async function(next) {
  if (this.isModified('answers') || this.isNew) {
    try {
      // Populate the form to validate answers
      await this.populate('formRef');
      const form = this.formRef as { fields?: Array<{ id: string; required: boolean }> };
      
      if (form && form.fields) {
        // Check required fields
        const requiredFields = form.fields.filter((field: { id: string; required: boolean }) => field.required);
        for (const field of requiredFields) {
          if (!this.answers[field.id] || this.answers[field.id] === '') {
            return next(new Error(`Required field '${field.id}' is missing`));
          }
        }
      }
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Export the model
const RecruitmentResponse = mongoose.models.RecruitmentResponse || mongoose.model<IRecruitmentResponse>('RecruitmentResponse', RecruitmentResponseSchema);
export default RecruitmentResponse;