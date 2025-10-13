import mongoose, { Schema, Document, Types } from 'mongoose';
import { BilingualText } from './User';

// TypeScript interface for Notification document
export interface INotification extends Document {
  _id: Types.ObjectId;
  userRef?: Types.ObjectId; // null for public notifications
  title: BilingualText;
  message: BilingualText;
  type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startAt: Date;
  endAt?: Date;
  sendEmail: boolean;
  emailSent: boolean;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  actionText?: BilingualText;
  imageUrl?: string;
  targetAudience: 'all' | 'members' | 'admins' | 'specific';
  tags: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Notification schema definition
const NotificationSchema = new Schema<INotification>({
  userRef: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means public notification
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
  message: {
    en: {
      type: String,
      required: [true, 'English message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    }
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['info', 'warning', 'success', 'error', 'announcement'],
      message: 'Type must be info, warning, success, error, or announcement'
    },
    default: 'info'
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium'
  },
  startAt: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        if (!(v instanceof Date) || isNaN(v.getTime())) return false;
        return v > this.startAt;
      },
      message: 'End date must be a valid date and after start date'
    }
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: 'Read at must be a valid date'
    }
  },
  actionUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$|^\/[\w\/-]*$/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  actionText: {
    en: {
      type: String,
      trim: true,
      maxlength: [50, 'Action text cannot exceed 50 characters']
    },
    ta: {
      type: String,
      trim: true,
      maxlength: [50, 'Action text cannot exceed 50 characters']
    }
  },
  imageUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$|^\/[\w\/-]*$/.test(v);
      },
      message: 'Please enter a valid image URL'
    }
  },
  targetAudience: {
    type: String,
    required: [true, 'Target audience is required'],
    enum: {
      values: ['all', 'members', 'admins', 'specific'],
      message: 'Target audience must be all, members, admins, or specific'
    },
    default: 'all'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
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
NotificationSchema.index({ userRef: 1, isRead: 1, startAt: -1 });
NotificationSchema.index({ targetAudience: 1, startAt: -1, endAt: 1 });
NotificationSchema.index({ type: 1, priority: -1 });
NotificationSchema.index({ sendEmail: 1, emailSent: 1 });
NotificationSchema.index({ tags: 1 });
NotificationSchema.index({ createdBy: 1 });
NotificationSchema.index({ startAt: 1, endAt: 1 });

// Virtual for notification status
NotificationSchema.virtual('status').get(function() {
  const now = new Date();
  
  if (this.endAt && now > this.endAt) return 'expired';
  if (now < this.startAt) return 'scheduled';
  return 'active';
});

// Virtual for notification visibility
NotificationSchema.virtual('isVisible').get(function() {
  const now = new Date();
  return now >= this.startAt && (!this.endAt || now <= this.endAt);
});

// Virtual to populate creator information
NotificationSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate user information
NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userRef',
  foreignField: '_id',
  justOne: true
});

// Static method to get active notifications for a user
NotificationSchema.statics.getActiveForUser = function(userId?: Types.ObjectId) {
  const now = new Date();
  const query: Record<string, unknown> = {
    startAt: { $lte: now },
    $and: [
      {
        $or: [
          { endAt: { $exists: false } },
          { endAt: { $gte: now } }
        ]
      }
    ]
  };
  
  if (userId) {
    (query.$and as Array<Record<string, unknown>>).push({
      $or: [
        { userRef: userId },
        { userRef: null, targetAudience: { $in: ['all', 'members'] } }
      ]
    });
  } else {
    query.userRef = null;
    query.targetAudience = 'all';
  }
  
  return this.find(query)
    .sort({ priority: -1, startAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get unread notifications for a user
NotificationSchema.statics.getUnreadForUser = function(userId: Types.ObjectId) {
  const now = new Date();
  return this.find({
    $and: [
      {
        $or: [
          { userRef: userId, isRead: false },
          { 
            userRef: null, 
            targetAudience: { $in: ['all', 'members'] },
            isRead: false 
          }
        ]
      },
      { startAt: { $lte: now } },
      {
        $or: [
          { endAt: { $exists: false } },
          { endAt: { $gte: now } }
        ]
      }
    ]
  })
    .sort({ priority: -1, startAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to get notifications by type
NotificationSchema.statics.getByType = function(type: string, userId?: Types.ObjectId) {
  const now = new Date();
  const query: Record<string, unknown> = {
    type,
    startAt: { $lte: now },
    $and: [
      {
        $or: [
          { endAt: { $exists: false } },
          { endAt: { $gte: now } }
        ]
      }
    ]
  };
  
  if (userId) {
    (query.$and as Array<Record<string, unknown>>).push({
      $or: [
        { userRef: userId },
        { userRef: null, targetAudience: { $in: ['all', 'members'] } }
      ]
    });
  } else {
    query.userRef = null;
    query.targetAudience = 'all';
  }
  
  return this.find(query)
    .sort({ priority: -1, startAt: -1 })
    .populate('createdBy', 'name email');
};

// Method to mark as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to check if notification should be sent via email
NotificationSchema.methods.shouldSendEmail = function() {
  return this.sendEmail && !this.emailSent && this.isVisible;
};

// Method to mark email as sent
NotificationSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  return this.save();
};

// Pre-save middleware to validate dates
NotificationSchema.pre('save', function(next) {
  if (this.endAt && this.endAt <= this.startAt) {
    return next(new Error('End date must be after start date'));
  }
  
  // Auto-mark as read if it's a past notification being created
  if (this.isNew && this.startAt < new Date()) {
    this.isRead = true;
    this.readAt = new Date();
  }
  
  next();
});

// Export the model
const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;