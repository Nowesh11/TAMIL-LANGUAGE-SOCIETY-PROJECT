import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Book from '../../../models/Book';
import { getUserFromAccessToken } from '../../../lib/auth';
import { NotificationService } from '../../../lib/notificationService';

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
      sort === 'featured' ? { featured: -1, createdAt: -1 } :
      sort === 'oldest' ? { createdAt: 1 } :
      { createdAt: -1 };

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort(sortBy as unknown as Record<string, 1 | -1>)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const items = books.map((b: any) => ({
      _id: b._id,
      title: b.title,
      author: b.author,
      description: b.description,
      price: b.price,
      stock: b.stock,
      coverPath: b.coverPath,
      isbn: b.isbn,
      category: b.category,
      publishedYear: b.publishedYear,
      language: b.language,
      featured: b.featured,
      active: b.active,
      isAvailable: b.stock > 0 && b.active === true,
    }));

    return NextResponse.json({ success: true, total, page, limit, items });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch books';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}