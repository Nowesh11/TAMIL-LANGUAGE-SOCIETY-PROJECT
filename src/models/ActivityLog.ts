import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  userType: 'admin' | 'user';
  entityType: 'book' | 'ebook' | 'component' | 'team' | 'poster' | 'purchase' | 'user' | 'recruitment' | 'chat';
  entityId?: Types.ObjectId;
  action: 'created' | 'updated' | 'deleted' | 'purchased' | 'downloaded' | 'registered' | 'login' | 'logout';
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userType: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'User type must be either admin or user'
    },
    required: [true, 'User type is required']
  },
  entityType: {
    type: String,
    enum: {
      values: ['book', 'ebook', 'component', 'team', 'poster', 'purchase', 'user', 'recruitment', 'chat', 'project', 'notification'],
      message: 'Invalid entity type'
    },
    required: [true, 'Entity type is required']
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  action: {
    type: String,
    enum: {
      values: ['created', 'updated', 'deleted', 'purchased', 'downloaded', 'registered', 'login', 'logout', 'viewed', 'uploaded', 'submitted'],
      message: 'Invalid action type'
    },
    required: [true, 'Action is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ userType: 1, createdAt: -1 });
ActivityLogSchema.index({ entityType: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

// Virtual for formatted timestamp
ActivityLogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Static method to log activity
ActivityLogSchema.statics.logActivity = async function(
  userId: Types.ObjectId,
  userType: 'admin' | 'user',
  entityType: string,
  action: string,
  description: string,
  entityId?: Types.ObjectId,
  metadata?: Record<string, any>
) {
  try {
    const activityLog = new this({
      userId,
      userType,
      entityType,
      entityId,
      action,
      description,
      metadata: metadata || {}
    });
    
    await activityLog.save();
    return activityLog;
  } catch (error) {
    console.error('Failed to log activity:', error);
    throw error;
  }
};

// Export the model
const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
export default ActivityLog;