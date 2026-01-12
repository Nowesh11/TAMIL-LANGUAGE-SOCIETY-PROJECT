import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import EBook from '../../../../../models/EBook';
import EBookRating from '../../../../../models/EBookRating';
import { getUserFromAccessToken } from '../../../../../lib/auth';
import { NotificationService } from '../../../../../lib/notificationService';
import { ActivityLogger } from '../../../../../lib/activityLogger';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const { id: ebookId } = await context.params;
    const body = await req.json();
    const rating = Number(body?.rating);
    if (!ebookId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Invalid ebookId or rating' }, { status: 400 });
    }
    const ebook = await EBook.findById(ebookId);
    if (!ebook) return NextResponse.json({ success: false, error: 'EBook not found' }, { status: 404 });

    await EBookRating.findOneAndUpdate(
      { ebookId, createdBy: user._id },
      { ebookId, createdBy: user._id, rating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Log ebook rating activity
    await ActivityLogger.log({
      userId: user._id,
      userType: 'user',
      entityType: 'ebook',
      entityId: ebookId,
      action: 'submitted',
      description: `Rated ebook "${ebook.title?.en || ebook.title}" with ${rating} stars`
    });

    const agg = await EBookRating.aggregate([
      { $match: { ebookId: ebook._id } },
      { $group: { _id: '$ebookId', totalRatings: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
    ]);
    const stats = agg[0] || { totalRatings: 0, averageRating: 0 };

    // Send notification for ebook rating
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Thank You for Your Rating!',
          ta: 'உங்கள் மதிப்பீட்டிற்கு நன்றி!'
        },
        message: {
          en: `You rated "${ebook.title?.en || ebook.title}" ${rating} stars. Your feedback helps other readers discover great content.`,
          ta: `நீங்கள் "${ebook.title?.ta || ebook.title}" க்கு ${rating} நட்சத்திரங்கள் வழங்கியுள்ளீர்கள். உங்கள் கருத்து மற்ற வாசகர்களுக்கு சிறந்த உள்ளடக்கத்தைக் கண்டறிய உதவுகிறது.`
        },
        type: 'success',
        priority: 'low',
        userRef: user._id,
        actionUrl: `/ebooks/${ebook._id}`,
        sendEmail: false,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to send rating notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    return NextResponse.json({ success: true, data: { averageRating: stats.averageRating, totalRatings: stats.totalRatings } });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to submit rating';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}