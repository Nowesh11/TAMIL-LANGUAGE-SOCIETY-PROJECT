import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface for bilingual text
export interface IBilingualText {
  en: string;
  ta: string;
}

// TypeScript interface for Team document
export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: IBilingualText;
  role: string;
  slug: string;
  bio: IBilingualText;
  email: string;
  phone?: string;
  orderNum: number;
  isActive: boolean;
  imagePath?: string;

  department?: string;
  joinedDate?: Date;
  achievements?: string[];
  specializations?: string[];
  languages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Bilingual text schema
const BilingualTextSchema = new Schema<IBilingualText>({
  en: {
    type: String,
    required: [true, 'English text is required'],
    trim: true
  },
  ta: {
    type: String,
    required: [true, 'Tamil text is required'],
    trim: true
  }
}, { _id: false });



// Team schema definition
const TeamSchema = new Schema<ITeam>({
  name: {
    type: BilingualTextSchema,
    required: [true, 'Name is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    trim: true,
    maxlength: [100, 'Role cannot exceed 100 characters'],
    enum: {
      values: [
        'President',
        'Vice President',
        'Secretary',
        'Treasurer',
        'Executive Committee',
        'Chief Auditor',
        'Auditor'
      ],
      message: 'Please select a valid role'
    }
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[a-z0-9-]+$/.test(v);
      },
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
    }
  },
  bio: {
    type: BilingualTextSchema,
    required: [true, 'Bio is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        // Allow Malaysian phone numbers (01x-xxxxxxx, +60x-xxxxxxx) and international formats
        return /^(\+?6?0?1[0-9]{8,9}|[\+]?[1-9][\d]{7,15})$/.test(v);
      },
      message: 'Please enter a valid phone number'
    }
  },
  orderNum: {
    type: Number,
    required: [true, 'Order number is required'],
    min: [1, 'Order number must be at least 1'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v) && v >= 1;
      },
      message: 'Order number must be a positive integer'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  imagePath: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // Optional field
        return /^\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image path must be a valid file path with image extension'
    }
  },

  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters'],
    enum: {
      values: [
        'High Committee',
        'Media and Public Relations Committee Member',
        'Sports and Leadership Committee Member',
        'Education and Intellectual Committee Member',
        'Arts & Culture Committee Member',
        'Social Welfare & Voluntary Committee Member',
        'Language and Literature Committee Member',
        'Auditor'
      ],
      message: 'Please select a valid department'
    }
  },
  joinedDate: {
    type: Date,
    validate: {
      validator: function(v: Date) {
        if (!v) return true; // Optional field
        return v <= new Date();
      },
      message: 'Joined date cannot be in the future'
    }
  },
  achievements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Achievement cannot exceed 200 characters']
  }],
  specializations: [{
    type: String,
    trim: true,
    maxlength: [100, 'Specialization cannot exceed 100 characters']
  }],
  languages: [{
    type: String,
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
TeamSchema.index({ slug: 1 }, { unique: true });
TeamSchema.index({ email: 1 }, { unique: true });
TeamSchema.index({ orderNum: 1, isActive: 1 });
TeamSchema.index({ role: 1, isActive: 1 });
TeamSchema.index({ department: 1 });
TeamSchema.index({ isActive: 1, orderNum: 1 });

// Compound indexes
TeamSchema.index({ isActive: 1, role: 1, orderNum: 1 });

// Text index for search functionality
TeamSchema.index({ 
  'name.en': 'text', 
  'name.ta': 'text', 
  'bio.en': 'text', 
  'bio.ta': 'text',
  role: 'text',
  department: 'text',
  specializations: 'text'
});

// Virtual for full name in English
TeamSchema.virtual('fullNameEn').get(function(this: ITeam) {
  return this.name.en;
});

// Virtual for full name in Tamil
TeamSchema.virtual('fullNameTa').get(function(this: ITeam) {
  return this.name.ta;
});

// Virtual for profile URL
TeamSchema.virtual('profileUrl').get(function(this: ITeam) {
  return `/team/${this.slug}`;
});

// Virtual for years of service
TeamSchema.virtual('yearsOfService').get(function(this: ITeam) {
  if (!this.joinedDate) return null;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.joinedDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
});

// Virtual for social media count


// Virtual for role hierarchy (for sorting)
TeamSchema.virtual('roleHierarchy').get(function(this: ITeam) {
  const hierarchy: { [key: string]: number } = {
    'President': 1,
    'Vice President': 2,
    'Secretary': 3,
    'Treasurer': 4,
    'Director': 5,
    'Assistant Director': 6,
    'Manager': 7,
    'Coordinator': 8,
    'Committee Member': 9,
    'Advisor': 10
  };
  return hierarchy[this.role] || 99;
});

// Static method to get active team members
TeamSchema.statics.getActiveMembers = function(sortBy: string = 'orderNum') {
  const sortOptions: Record<string, number> = {};
  
  if (sortBy === 'hierarchy') {
    // Custom sorting by role hierarchy then order number
    return this.aggregate([
      { $match: { isActive: true } },
      {
        $addFields: {
          roleHierarchy: {
            $switch: {
              branches: [
                { case: { $eq: ['$role', 'President'] }, then: 1 },
                { case: { $eq: ['$role', 'Vice President'] }, then: 2 },
                { case: { $eq: ['$role', 'Secretary'] }, then: 3 },
                { case: { $eq: ['$role', 'Treasurer'] }, then: 4 },
                { case: { $eq: ['$role', 'Director'] }, then: 5 },
                { case: { $eq: ['$role', 'Assistant Director'] }, then: 6 },
                { case: { $eq: ['$role', 'Manager'] }, then: 7 },
                { case: { $eq: ['$role', 'Coordinator'] }, then: 8 },
                { case: { $eq: ['$role', 'Committee Member'] }, then: 9 },
                { case: { $eq: ['$role', 'Advisor'] }, then: 10 }
              ],
              default: 99
            }
          }
        }
      },
      { $sort: { roleHierarchy: 1, orderNum: 1 } }
    ]);
  } else {
    sortOptions[sortBy] = 1;
    return this.find({ isActive: true }).sort(sortOptions);
  }
};

// Static method to get team members by role
TeamSchema.statics.getByRole = function(role: string, isActive: boolean = true) {
  const query: Record<string, unknown> = { role };
  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }
  
  return this.find(query).sort({ orderNum: 1 });
};

// Static method to get team members by department
TeamSchema.statics.getByDepartment = function(department: string, isActive: boolean = true) {
  const query: Record<string, unknown> = { department };
  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }
  
  return this.find(query).sort({ orderNum: 1 });
};

// Static method to search team members
TeamSchema.statics.searchMembers = function(searchTerm: string, isActive: boolean = true) {
  const query: Record<string, unknown> = {
    $text: { $search: searchTerm }
  };
  
  if (typeof isActive === 'boolean') {
    query.isActive = isActive;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, orderNum: 1 });
};

// Static method to get leadership team
TeamSchema.statics.getLeadership = function() {
  const leadershipRoles = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Director'];
  
  return this.find({ 
    role: { $in: leadershipRoles }, 
    isActive: true 
  }).sort({ orderNum: 1 });
};

// Static method to get team statistics
TeamSchema.statics.getTeamStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalMembers: { $sum: 1 },
        activeMembers: { $sum: { $cond: ['$isActive', 1, 0] } },
        inactiveMembers: { $sum: { $cond: ['$isActive', 0, 1] } }
      }
    },
    {
      $lookup: {
        from: 'teams',
        pipeline: [
          { $group: { _id: '$role', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        as: 'roleDistribution'
      }
    },
    {
      $lookup: {
        from: 'teams',
        pipeline: [
          { $group: { _id: '$department', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ],
        as: 'departmentDistribution'
      }
    }
  ]);
};

// Instance method to toggle active status
TeamSchema.methods.toggleActiveStatus = function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Instance method to update order number
TeamSchema.methods.updateOrder = function(newOrder: number) {
  this.orderNum = newOrder;
  return this.save();
};

// Instance method to add achievement
TeamSchema.methods.addAchievement = function(achievement: string) {
  if (!this.achievements) this.achievements = [];
  this.achievements.push(achievement);
  return this.save();
};

// Instance method to add specialization
TeamSchema.methods.addSpecialization = function(specialization: string) {
  if (!this.specializations) this.specializations = [];
  if (!this.specializations.includes(specialization)) {
    this.specializations.push(specialization);
  }
  return this.save();
};

// Pre-save middleware to generate slug from English name
TeamSchema.pre('save', function(this: ITeam, next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name.en
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

// Pre-save middleware to ensure unique order number
TeamSchema.pre('save', async function(next) {
  if (this.isModified('orderNum')) {
    const existingMember = await (this.constructor as mongoose.Model<ITeam>).findOne({
      orderNum: this.orderNum,
      _id: { $ne: this._id }
    });
    
    if (existingMember) {
      return next(new Error(`Order number ${this.orderNum} is already taken`));
    }
  }
  next();
});

// Pre-save middleware to set default languages
TeamSchema.pre('save', function(this: ITeam, next) {
  if (!this.languages || this.languages.length === 0) {
    this.languages = ['Tamil', 'English'];
  }
  next();
});

// Export the model
const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);
export default Team;