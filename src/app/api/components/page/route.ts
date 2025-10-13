import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Component from '../../../../models/Component';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const page = (searchParams.get('page') || 'home').toLowerCase();
    const bureau = (searchParams.get('bureau') || '').toLowerCase() || undefined;
    const debug = searchParams.get('debug') === '1';
    if (debug) {
      return NextResponse.json({ success: true, page, bureau });
    }
    const baseQuery: Record<string, unknown> = { page, isActive: true };
    if (bureau) baseQuery.bureau = bureau;
    const raw = await Component.find(baseQuery)
      .sort({ order: 1 })
      .lean();

    const components = raw.map((doc: Record<string, unknown>) => ({
      ...doc,
      _id: String(doc._id),
      createdBy: doc.createdBy ? String(doc.createdBy) : undefined,
      updatedBy: doc.updatedBy ? String(doc.updatedBy) : undefined,
    }));
    return NextResponse.json({ success: true, components });
  } catch (e: unknown) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    console.error('GET /api/components/page error:', error.message, error.stack);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch components', stack: error.stack }, { status: 500 });
  }
}