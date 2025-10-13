import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import EBook from '../../../../models/EBook';
import EBookRating from '../../../../models/EBookRating';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    await dbConnect();
    const [counts, downloads, ratings, languagesAgg, recentReadersAgg] = await Promise.all([
      EBook.countDocuments({ active: true }),
      EBook.aggregate([{ $match: { active: true } }, { $group: { _id: null, totalDownloads: { $sum: '$downloadCount' } } }]),
      EBookRating.aggregate([{ $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }]),
      EBook.aggregate([
        { $match: { active: true } },
        { $group: { _id: '$language' } }
      ]),
      EBookRating.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180) } } },
        { $group: { _id: '$createdBy' } }
      ])
    ]);

    const totalEbooks = counts || 0;
    const totalDownloads = downloads[0]?.totalDownloads || 0;
    const ratingCount = ratings[0]?.count || 0;
    const ratingAverage = ratings[0]?.avg || 0;
    const languagesCount = Array.isArray(languagesAgg) ? languagesAgg.length : 0;
    const activeReaders = Array.isArray(recentReadersAgg) ? recentReadersAgg.filter((r) => r._id).length : 0;

    return NextResponse.json({ success: true, totalEbooks, totalDownloads, ratingCount, ratingAverage, languagesCount, activeReaders });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch stats';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}