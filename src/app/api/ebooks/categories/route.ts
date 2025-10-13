import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import EBook from '../../../../models/EBook';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    await dbConnect();
    const agg = await EBook.aggregate([
      { $match: { active: true, category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    const categories = agg.map((c) => ({ name: c._id, count: c.count }));
    return NextResponse.json({ success: true, categories });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch categories';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}