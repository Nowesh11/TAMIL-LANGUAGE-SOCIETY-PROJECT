import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Component from '../../../../models/Component';
import FileRecord from '../../../../models/FileRecord';

export const runtime = 'nodejs';

export async function POST() {
  try {
    await dbConnect();
    const latestLogo = await FileRecord.findOne({ category: 'image', tags: { $in: ['logo'] } }).sort({ createdAt: -1 });
    if (!latestLogo) return NextResponse.json({ error: 'No logo uploaded' }, { status: 404 });

    const imageUrl = `/api/files/image?id=${latestLogo._id}`;

    const targets = await Component.find({ type: { $in: ['navbar', 'footer'] } });
    for (const comp of targets) {
      const content = comp.content as Record<string, unknown> || {};
      if (!content.logo) content.logo = {} as Record<string, unknown>;
      const logo = content.logo as Record<string, unknown>;
      if (!logo.image) logo.image = {} as Record<string, unknown>;
      const image = logo.image as Record<string, unknown>;
      image.src = imageUrl;
      image.alt = image.alt || { en: 'Tamil Language Society', ta: 'தமிழ் மொழி சங்கம்' };
      comp.content = content;
      await comp.save();
    }

    return NextResponse.json({ success: true, imageUrl, updatedCount: targets.length });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to update logo';
    return NextResponse.json({ error }, { status: 500 });
  }
}