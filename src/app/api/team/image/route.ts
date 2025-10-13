import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import dbConnect from '../../../../lib/mongodb';
import Team from '../../../../models/Team';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    if (!id && !slug) return NextResponse.json({ error: 'Missing id or slug' }, { status: 400 });

    await dbConnect();
    const member = id ? await Team.findById(id) : await Team.findOne({ slug });
    if (!member) return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    const storedPath = String(member.imagePath || '');
    if (!storedPath) return NextResponse.json({ error: 'Image path missing' }, { status: 404 });

    let imgPath: string;
    const cleaned = storedPath.replace(/^[/\\]+/, '');
    if (path.isAbsolute(storedPath)) {
      imgPath = storedPath;
    } else if (storedPath.startsWith('/')) {
      imgPath = path.join(process.cwd(), 'public', cleaned);
    } else {
      imgPath = path.join(process.cwd(), cleaned);
    }

    let data: Buffer | null = null;
    try {
      data = await fs.readFile(imgPath);
    } catch {
      if (!path.isAbsolute(storedPath)) {
        const publicPath = path.join(process.cwd(), 'public', cleaned);
        try {
          data = await fs.readFile(publicPath);
          imgPath = publicPath;
        } catch {}
      }
    }

    if (!data) return NextResponse.json({ error: 'File not found', resolvedPath: imgPath }, { status: 404 });

    const ext = path.extname(imgPath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : ext === '.png' ? 'image/png'
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : 'application/octet-stream';

    const body = new Uint8Array(data);
    return new NextResponse(body, { headers: { 'Content-Type': mime } });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch team image';
    return NextResponse.json({ error }, { status: 500 });
  }
}