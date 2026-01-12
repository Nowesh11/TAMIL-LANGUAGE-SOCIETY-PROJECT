import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookRating extends Document {
  bookId: Types.ObjectId;
  rating: number; // 1-5
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookRatingSchema = new Schema<IBookRating>({
  bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true, sparse: true },
}, { timestamps: true });

BookRatingSchema.index({ bookId: 1, createdBy: 1 }, { unique: true, sparse: true });

const BookRating = mongoose.models.BookRating || mongoose.model<IBookRating>('BookRating', BookRatingSchema);
export default BookRating;