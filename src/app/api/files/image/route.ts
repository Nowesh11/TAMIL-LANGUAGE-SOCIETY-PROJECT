import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
// Serve images directly from a path param. Use /api/files/image?path=/uploads/<category>/<filename>

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storedPath = String(searchParams.get('path') || '');
    if (!storedPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    let filePath: string;
    const cleaned = storedPath.replace(/^[/\\]+/, '');
    filePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.join(process.cwd(), storedPath.startsWith('/') ? path.join('public', cleaned) : cleaned);

    let data: Buffer;
    try {
      data = await fs.readFile(filePath);
    } catch (e) {
      // Try public fallback for relative paths
      if (!path.isAbsolute(storedPath)) {
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

    const ext = path.extname(filePath).toLowerCase();
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
