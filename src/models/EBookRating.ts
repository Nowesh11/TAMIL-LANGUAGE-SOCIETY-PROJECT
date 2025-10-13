import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEBookRating extends Document {
  ebookId: Types.ObjectId;
  rating: number; // 1-5
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EBookRatingSchema = new Schema<IEBookRating>({
  ebookId: { type: Schema.Types.ObjectId, ref: 'EBook', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
}, { timestamps: true });

EBookRatingSchema.index({ ebookId: 1, createdBy: 1 }, { unique: true, sparse: true });

const EBookRating = mongoose.models.EBookRating || mongoose.model<IEBookRating>('EBookRating', EBookRatingSchema);
export default EBookRating;