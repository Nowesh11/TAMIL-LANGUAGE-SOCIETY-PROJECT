import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import dbConnect from '../../../../lib/mongodb';
import Poster from '../../../../models/Poster';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await dbConnect();
    const poster = await Poster.findById(id);
    if (!poster) return NextResponse.json({ error: 'Poster not found' }, { status: 404 });
    const storedPath = poster.imagePath as string;
    if (!storedPath) return NextResponse.json({ error: 'Image path missing' }, { status: 404 });

    // Normalize stored path: prefer uploads-relative path
    let imgPath: string;
    const cleanedStored = storedPath.replace(/^[/\\]+/, '');
    if (path.isAbsolute(storedPath)) {
      imgPath = storedPath;
    } else if (storedPath.startsWith('/')) {
      // public-relative
      imgPath = path.join(process.cwd(), 'public', cleanedStored);
    } else {
      // uploads or project-relative
      imgPath = path.join(process.cwd(), cleanedStored);
    }

    const debug = searchParams.get('debug') === '1';
    if (debug) {
      return NextResponse.json({ storedPath, resolvedPath: imgPath });
    }

    let data: Buffer | null = null;
    try {
      data = await fs.readFile(imgPath);
    } catch (e) {
      // Try public folder fallback
      if (!path.isAbsolute(storedPath)) {
        const publicPath = path.join(process.cwd(), 'public', cleanedStored);
        try {
          data = await fs.readFile(publicPath);
          imgPath = publicPath;
        } catch {}
      }
      // If still not found and storedPath is a URL, proxy fetch
      if (!data && /^https?:\/\//i.test(storedPath)) {
        try {
          const resp = await fetch(storedPath);
          if (resp.ok) {
            const arrayBuf = await resp.arrayBuffer();
            data = Buffer.from(arrayBuf);
            // Infer mime from URL extension
            const urlExt = path.extname(new URL(storedPath).pathname).toLowerCase();
            if (urlExt) {
              imgPath = `remote${urlExt}`;
            }
          }
        } catch {}
      }
      if (!data) {
        return NextResponse.json({ error: 'Image not found', resolvedPath: imgPath }, { status: 404 });
      }
    }

    let ext = path.extname(imgPath).toLowerCase();
    if (!ext) {
      const header = data.subarray(0, 12);
      // PNG
      if (header.length >= 4 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) ext = '.png';
      // GIF
      else if (header.length >= 6 && header.toString('ascii', 0, 6).startsWith('GIF')) ext = '.gif';
      // JPEG
      else if (header.length >= 2 && header[0] === 0xFF && header[1] === 0xD8) ext = '.jpg';
      // WEBP
      else if (header.length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP') ext = '.webp';
      else {
        const textStart = data.subarray(0, Math.min(256, data.length)).toString('utf8').trim().toLowerCase();
        if (textStart.startsWith('<svg')) ext = '.svg';
      }
    }
    const mime = ext === '.svg' ? 'image/svg+xml'
      : ext === '.png' ? 'image/png'
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : 'image/jpeg';

    const body = new Uint8Array(data);
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to serve image';
    return NextResponse.json({ error }, { status: 500 });
  }
}