import mongoose, { Schema, Document, Types, Model } from 'mongoose';

// Interface for static methods
interface IChatMessageModel extends Model<IChatMessage> {
  generateConversationId(userId1: Types.ObjectId, userId2: Types.ObjectId): string;
  getConversation(userId1: Types.ObjectId, userId2: Types.ObjectId, limit?: number, skip?: number): Promise<IChatMessage[]>;
  getUnreadMessages(userId: Types.ObjectId): Promise<IChatMessage[]>;
  getUserConversations(userId: Types.ObjectId): Promise<unknown[]>;
  searchMessages(userId: Types.ObjectId, searchTerm: string, otherUserId?: Types.ObjectId): Promise<IChatMessage[]>;
  markAsDelivered(recipientId: Types.ObjectId, senderId: Types.ObjectId): Promise<unknown>;
}

// TypeScript interface for ChatMessage document
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  isRead: boolean;
  readAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  replyTo?: Types.ObjectId; // Reference to another message for replies
  reactions?: {
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }[];
  editHistory?: {
    previousMessage: string;
    editedAt: Date;
  }[];
  isEdited: boolean;
  conversationId: string; // Computed field for grouping messages
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Reaction schema
const ReactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true,
    trim: true,
    maxlength: [10, 'Emoji cannot exceed 10 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Edit history schema
const EditHistorySchema = new Schema({
  previousMessage: {
    type: String,
    required: true,
    trim: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// ChatMessage schema definition
const ChatMessageSchema = new Schema<IChatMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    required: [true, 'Message type is required'],
    enum: {
      values: ['text', 'image', 'file', 'audio', 'video'],
      message: 'Message type must be text, image, file, audio, or video'
    },
    default: 'text'
  },
  filePath: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\/.*/.test(v);
      },
      message: 'File path must be a valid path starting with /'
    }
  },
  fileName: {
    type: String,
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  fileSize: {
    type: Number,
    min: [0, 'File size must be non-negative'],
    validate: {
      validator: function(v: number) {
        if (v === undefined || v === null) return true; // Optional field
        return Number.isInteger(v) && v >= 0;
      },
      message: 'File size must be a non-negative integer'
    }
  },
  mimeType: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^[a-z]+\/[a-z0-9][a-z0-9\-\+]*$/i.test(v);
      },
      message: 'Please enter a valid MIME type'
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage'
  },
  reactions: [ReactionSchema],
  editHistory: [EditHistorySchema],
  isEdited: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
ChatMessageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });
ChatMessageSchema.index({ conversationId: 1, timestamp: -1 });
ChatMessageSchema.index({ senderId: 1, timestamp: -1 });
ChatMessageSchema.index({ recipientId: 1, timestamp: -1 });
ChatMessageSchema.index({ isRead: 1, recipientId: 1 });
ChatMessageSchema.index({ isDeleted: 1 });
ChatMessageSchema.index({ messageType: 1 });
ChatMessageSchema.index({ replyTo: 1 });

// Compound indexes
ChatMessageSchema.index({ conversationId: 1, isDeleted: 1, timestamp: -1 });
ChatMessageSchema.index({ recipientId: 1, isRead: 1, timestamp: -1 });

// Text index for message search
ChatMessageSchema.index({ message: 'text' });

// Virtual to populate sender information
ChatMessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate recipient information
ChatMessageSchema.virtual('recipient', {
  ref: 'User',
  localField: 'recipientId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate replied message
ChatMessageSchema.virtual('repliedMessage', {
  ref: 'ChatMessage',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true
});

// Virtual for message age
ChatMessageSchema.virtual('messageAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.timestamp.getTime());
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.ceil(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.ceil(diffHours / 24);
  return `${diffDays}d`;
});

// Virtual for file size formatted
ChatMessageSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return null;
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for reaction count
ChatMessageSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for unique reaction emojis
ChatMessageSchema.virtual('uniqueReactions').get(function() {
  if (!this.reactions || this.reactions.length === 0) return [];
  
  const reactionMap = new Map();
  this.reactions.forEach(reaction => {
    if (reactionMap.has(reaction.emoji)) {
      reactionMap.get(reaction.emoji).count++;
      reactionMap.get(reaction.emoji).users.push(reaction.userId);
    } else {
      reactionMap.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        users: [reaction.userId]
      });
    }
  });
  
  return Array.from(reactionMap.values());
});

// Static method to get conversation between two users
ChatMessageSchema.statics.getConversation = function(
  userId1: Types.ObjectId, 
  userId2: Types.ObjectId, 
  limit: number = 50, 
  skip: number = 0
) {
  const conversationId = (this as IChatMessageModel).generateConversationId(userId1, userId2);
  
  return this.find({
    conversationId,
    isDeleted: false
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email')
    .populate('replyTo', 'message senderId timestamp');
};

// Static method to get unread messages for a user
ChatMessageSchema.statics.getUnreadMessages = function(userId: Types.ObjectId) {
  return this.find({
    recipientId: userId,
    isRead: false,
    isDeleted: false
  })
    .sort({ timestamp: -1 })
    .populate('senderId', 'name email');
};

// Static method to get user conversations (list of people they've chatted with)
ChatMessageSchema.statics.getUserConversations = function(userId: Types.ObjectId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipientId', userId] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        otherUserId: {
          $first: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$recipientId',
              '$senderId'
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'otherUserId',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $sort: { 'lastMessage.timestamp': -1 }
    }
  ]);
};

// Static method to search messages
ChatMessageSchema.statics.searchMessages = function(
  userId: Types.ObjectId, 
  searchTerm: string, 
  otherUserId?: Types.ObjectId
) {
  const query: Record<string, unknown> = {
    $text: { $search: searchTerm },
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    isDeleted: false
  };
  
  if (otherUserId) {
    query.$or = [
      { senderId: userId, recipientId: otherUserId },
      { senderId: otherUserId, recipientId: userId }
    ];
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, timestamp: -1 })
    .populate('senderId', 'name email')
    .populate('recipientId', 'name email');
};

// Static method to generate conversation ID
ChatMessageSchema.statics.generateConversationId = function(userId1: Types.ObjectId, userId2: Types.ObjectId) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Static method to mark messages as delivered
ChatMessageSchema.statics.markAsDelivered = function(recipientId: Types.ObjectId, senderId: Types.ObjectId) {
  return this.updateMany(
    {
      senderId,
      recipientId,
      isDelivered: false
    },
    {
      $set: {
        isDelivered: true,
        deliveredAt: new Date()
      }
    }
  );
};

// Instance method to mark as read
ChatMessageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to add reaction
ChatMessageSchema.methods.addReaction = function(userId: Types.ObjectId, emoji: string) {
  if (!this.reactions) this.reactions = [];
  
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter((r: { userId: Types.ObjectId }) => !r.userId.equals(userId));
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
ChatMessageSchema.methods.removeReaction = function(userId: Types.ObjectId) {
  if (!this.reactions) return this.save();
  
  this.reactions = this.reactions.filter((r: { userId: Types.ObjectId }) => !r.userId.equals(userId));
  return this.save();
};

// Instance method to edit message
ChatMessageSchema.methods.editMessage = function(newMessage: string) {
  if (!this.editHistory) this.editHistory = [];
  
  // Save current message to history
  this.editHistory.push({
    previousMessage: this.message,
    editedAt: new Date()
  });
  
  this.message = newMessage;
  this.isEdited = true;
  
  return this.save();
};

// Instance method to soft delete message
ChatMessageSchema.methods.softDelete = function(deletedBy: Types.ObjectId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Pre-save middleware to generate conversation ID
ChatMessageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = (this.constructor as IChatMessageModel).generateConversationId(this.senderId, this.recipientId);
  }
  next();
});

// Pre-save middleware to validate file fields
ChatMessageSchema.pre('save', function(next) {
  if (this.messageType !== 'text') {
    if (!this.filePath) {
      return next(new Error('File path is required for non-text messages'));
    }
    if (!this.fileName) {
      return next(new Error('File name is required for non-text messages'));
    }
  }
  next();
});

// Pre-save middleware to prevent self-messaging
ChatMessageSchema.pre('save', function(next) {
  if (this.senderId.equals(this.recipientId)) {
    return next(new Error('Cannot send message to yourself'));
  }
  next();
});

// Pre-save middleware to set delivered status for new messages
ChatMessageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }
  next();
});

// Export the model
const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage, IChatMessageModel>('ChatMessage', ChatMessageSchema);
export default ChatMessage;