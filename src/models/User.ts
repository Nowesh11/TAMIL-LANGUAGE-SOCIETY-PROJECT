import mongoose, { Schema, Document, Types } from 'mongoose';

// TypeScript interface for bilingual text
export interface BilingualText {
  en: string;
  ta: string;
}

// TypeScript interface for User document
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: BilingualText;
  role: 'admin' | 'user';
  purchases: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// User schema definition
const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    ta: {
      type: String,
      required: [true, 'Tamil name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    }
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: 'Role must be either admin or user'
    },
    default: 'user'
  },
  purchases: [{
    type: Schema.Types.ObjectId,
    ref: 'Purchase'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for user's full name in English
UserSchema.virtual('fullNameEn').get(function() {
  return this.name.en;
});

// Virtual for user's full name in Tamil
UserSchema.virtual('fullNameTa').get(function() {
  return this.name.ta;
});

// Pre-save middleware to ensure email uniqueness
UserSchema.pre('save', async function(next) {
  if (this.isModified('email')) {
    const existingUser = await mongoose.model('User').findOne({ 
      email: this.email, 
      _id: { $ne: this._id } 
    });
    if (existingUser) {
      throw new Error('Email already exists');
    }
  }
  next();
});

// Export the model
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;