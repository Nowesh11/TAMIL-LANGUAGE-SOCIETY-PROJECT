import { NextRequest, NextResponse } from 'next/server';
import Component from '../../../../models/Component';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const baseDir = path.join(process.cwd(), 'uploads', 'components', 'logos');
    let latestPath: string | null = null;
    let latestTime = 0;
    const typeDirs = ['navbar', 'footer'];
    for (const type of typeDirs) {
      const dir = path.join(baseDir, type);
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir).map(name => path.join(dir, name));
      for (const filePath of files) {
        const stat = fs.statSync(filePath);
        if (stat.isFile() && stat.mtimeMs > latestTime) {
          latestTime = stat.mtimeMs;
          latestPath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        }
      }
    }
    if (!latestPath) return NextResponse.json({ error: 'No logo uploaded' }, { status: 404 });
    const imageUrl = `/api/files/image?path=${encodeURIComponent(latestPath)}`;

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
