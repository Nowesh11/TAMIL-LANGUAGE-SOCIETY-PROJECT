import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import Poster from '../../../models/Poster';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const posters = await Poster.find({ isActive: true }).sort({ order: 1 });
    const result = posters.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      order: p.order,
      isActive: p.isActive,
      imagePath: p.imagePath,
      imageUrl: `/api/posters/image?id=${p._id}&t=${new Date(p.updatedAt).getTime()}`,
    }));
    return NextResponse.json({ posters: result });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch posters';
    return NextResponse.json({ error }, { status: 500 });
  }
}