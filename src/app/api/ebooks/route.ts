import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import EBook from '../../../models/EBook';
import EBookRating from '../../../models/EBookRating';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const sort = (searchParams.get('sort') || 'latest').toLowerCase();
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || '12')));

    const filter: any = { active: true };
    if (q) {
      filter.$or = [
        { 'title.en': { $regex: q, $options: 'i' } },
        { 'title.ta': { $regex: q, $options: 'i' } },
        { 'author.en': { $regex: q, $options: 'i' } },
        { 'author.ta': { $regex: q, $options: 'i' } },
        { 'description.en': { $regex: q, $options: 'i' } },
        { 'description.ta': { $regex: q, $options: 'i' } },
        { isbn: { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'all') filter.category = category;
    if (language && language !== 'all') filter.language = language;

    const sortBy =
      sort === 'popular' ? { downloadCount: -1, createdAt: -1 } :
      sort === 'oldest' ? { createdAt: 1 } :
      { featured: -1, createdAt: -1 };

    const total = await EBook.countDocuments(filter);
    const ebooks = await EBook.find(filter)
      .sort(sortBy as unknown as Record<string, 1 | -1>)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const ids = ebooks.map((b) => b._id);
    const ratings = await EBookRating.aggregate([
      { $match: { ebookId: { $in: ids } } },
      { $group: { _id: '$ebookId', count: { $sum: 1 }, avg: { $avg: '$rating' } } },
    ]);
    const ratingMap = new Map<string, { count: number; avg: number }>();
    ratings.forEach((r) => ratingMap.set(String(r._id), { count: r.count, avg: r.avg }));

    const items = ebooks.map((b) => ({
      _id: String(b._id),
      title: b.title,
      author: b.author,
      description: b.description,
      fileFormat: b.fileFormat,
      category: b.category || null,
      language: b.language,
      featured: !!b.featured,
      downloadCount: b.downloadCount || 0,
      coverPath: b.coverPath || null,
      filePath: b.filePath,
      rating: ratingMap.get(String(b._id)) || { count: 0, avg: 0 },
    }));

    return NextResponse.json({ success: true, total, page, limit, data: items });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch ebooks';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}