import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const p = searchParams.get('p');
    if (!p) return NextResponse.json({ error: 'Missing p' }, { status: 400 });

    // Prevent path traversal; only allow under uploads/
    const decoded = decodeURIComponent(p).replace(/^[/\\]+/, '');
    if (!decoded.toLowerCase().startsWith('uploads/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    let filePath = path.join(process.cwd(), decoded);
    let data: Buffer | null = null;
    try {
      data = await fs.readFile(filePath);
    } catch (e) {
      // Try common extensions if not provided
      const tryExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      for (const ext of tryExts) {
        const alt = filePath + ext;
        try {
          data = await fs.readFile(alt);
          filePath = alt;
          break;
        } catch {}
      }
      if (!data) return NextResponse.json({ error: 'File not found', resolvedPath: filePath }, { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.svg' ? 'image/svg+xml'
      : ext === '.png' ? 'image/png'
      : ext === '.gif' ? 'image/gif'
      : ext === '.webp' ? 'image/webp'
      : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
      : 'application/octet-stream';

    const body = new Uint8Array(data);
    return new NextResponse(body, { status: 200, headers: { 'Content-Type': mime } });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to serve upload image';
    return NextResponse.json({ error }, { status: 500 });
  }
}