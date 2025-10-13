import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import dbConnect from '../../../../lib/mongodb';
import FileRecord from '../../../../models/FileRecord';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await dbConnect();
    const record = await FileRecord.findById(id);
    if (!record) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    const storedPath = String(record.path || '');
    if (!storedPath) return NextResponse.json({ error: 'Path missing' }, { status: 404 });

    let filePath: string;
    if (storedPath.startsWith('/')) {
      const cleaned = storedPath.replace(/^[/\\]+/, '');
      filePath = path.join(process.cwd(), 'public', cleaned);
    } else if (path.isAbsolute(storedPath)) {
      filePath = storedPath;
    } else {
      const cleaned = storedPath.replace(/^[/\\]+/, '');
      filePath = path.join(process.cwd(), cleaned);
    }

    let data: Buffer;
    try {
      data = await fs.readFile(filePath);
    } catch (e) {
      // Try public fallback for relative paths
      if (!path.isAbsolute(storedPath)) {
        const cleaned = storedPath.replace(/^[/\\]+/, '');
        const publicPath = path.join(process.cwd(), 'public', cleaned);
        try {
          data = await fs.readFile(publicPath);
          filePath = publicPath;
        } catch {
          return NextResponse.json({ error: 'File not found', resolvedPath: filePath }, { status: 404 });
        }
      } else {
        return NextResponse.json({ error: 'File not found', resolvedPath: filePath }, { status: 404 });
      }
    }

    const ext = path.extname(record.filename || filePath).toLowerCase();
    const mime = ext === '.svg' ? 'image/svg+xml'
      : ext === '.png' ? 'image/png'
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : 'application/octet-stream';

    const body = new Uint8Array(data);
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to serve file';
    return NextResponse.json({ error }, { status: 500 });
  }
}