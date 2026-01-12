import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import { getUserFromAccessToken } from '../../../../../lib/auth';
import Book from '../../../../../models/Book';
import BookRating from '../../../../../models/BookRating';
import { NotificationService } from '../../../../../lib/notificationService';
import { ActivityLogger } from '../../../../../lib/activityLogger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    // Get authenticated user
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookId } = await context.params;
    const body = await req.json();
    const rating = Number(body?.rating);

    // Validate input
    if (!bookId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid bookId or rating' }, { status: 400 });
    }

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return NextResponse.json({ success: false, error: 'Book not found' }, { status: 404 });
    }

    // Update or create rating
    await BookRating.findOneAndUpdate(
      { bookId, createdBy: user._id },
      { bookId, createdBy: user._id, rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Log book rating activity
    await ActivityLogger.log({
      userId: user._id,
      userType: 'user',
      entityType: 'book',
      entityId: bookId,
      action: 'submitted',
      description: `Rated book "${book.title?.en || book.title}" with ${rating} stars`
    });

    // Calculate new average rating and total ratings
    const agg = await BookRating.aggregate([
      { $match: { bookId: book._id } },
      { $group: { _id: '$bookId', totalRatings: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
    ]);
    const stats = agg[0] || { totalRatings: 0, averageRating: 0 };

    // Send notification for book rating
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Thank You for Your Rating!',
          ta: 'உங்கள் மதிப்பீட்டிற்கு நன்றி!'
        },
        message: {
          en: `You rated "${book.title?.en || book.title}" ${rating} stars. Your feedback helps other readers discover great books.`,
          ta: `நீங்கள் "${book.title?.ta || book.title}" க்கு ${rating} நட்சத்திரங்கள் வழங்கியுள்ளீர்கள். உங்கள் கருத்து மற்ற வாசகர்களுக்கு சிறந்த புத்தகங்களைக் கண்டறிய உதவுகிறது.`
        },
        type: 'success',
        priority: 'low',
        userRef: user._id,
        actionUrl: `/books/${book._id}`,
        sendEmail: false,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to send rating notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        averageRating: stats.averageRating, 
        totalRatings: stats.totalRatings,
        reviewCount: stats.totalRatings
      } 
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to submit rating';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}