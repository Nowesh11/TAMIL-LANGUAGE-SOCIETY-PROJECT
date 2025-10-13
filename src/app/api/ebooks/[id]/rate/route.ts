import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import EBook from '../../../../../models/EBook';
import EBookRating from '../../../../../models/EBookRating';
import { getUserFromAccessToken } from '../../../../../lib/auth';

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

    const agg = await EBookRating.aggregate([
      { $match: { ebookId: ebook._id } },
      { $group: { _id: '$ebookId', totalRatings: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
    ]);
    const stats = agg[0] || { totalRatings: 0, averageRating: 0 };
    return NextResponse.json({ success: true, data: { averageRating: stats.averageRating, totalRatings: stats.totalRatings } });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to submit rating';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}