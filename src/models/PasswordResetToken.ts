import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPasswordResetToken extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  token: string; // random string
  verificationCode?: string; // 6-digit code for user-friendly reset
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true },
  verificationCode: { type: String, required: false }, // Optional 6-digit code
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

PasswordResetTokenSchema.index({ user: 1, used: 1, expiresAt: -1 });
PasswordResetTokenSchema.index({ verificationCode: 1 }); // Index for verification code lookup

const PasswordResetToken = mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);
export default PasswordResetToken;