import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import BookRating from '../../../../models/BookRating';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid book ID'
      }, { status: 400 });
    }
    
    // Find the book
    const book = await Book.findById(id).lean();
    
    if (!book || !(book as any).active) {
      return NextResponse.json({
        success: false,
        error: 'Book not found'
      }, { status: 404 });
    }
    
    // Get rating information
    const ratings = await BookRating.aggregate([
      { $match: { bookId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }
    ]);
    
    const ratingInfo = ratings[0] || { count: 0, avg: 0 };
    
    // Format the response
    const bookData = {
      _id: String((book as any)._id),
      title: (book as any).title,
      author: (book as any).author,
      description: (book as any).description,
      price: (book as any).price,
      stock: (book as any).stock,
      coverPath: (book as any).coverPath,
      isbn: (book as any).isbn,
      category: (book as any).category,
      publishedYear: (book as any).publishedYear,
      language: (book as any).language,
      featured: (book as any).featured,
      active: (book as any).active,
      isAvailable: (book as any).stock > 0 && (book as any).active === true,
      rating: {
        count: ratingInfo.count,
        average: ratingInfo.avg || 0
      },
      createdAt: (book as any).createdAt,
      updatedAt: (book as any).updatedAt
    };
    
    return NextResponse.json({
      success: true,
      book: bookData
    });
  } catch (error) {
    console.error('GET /api/books/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch book details'
    }, { status: 500 });
  }
}