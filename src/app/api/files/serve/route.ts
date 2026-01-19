import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storedPath = String(searchParams.get('path') || '');
    if (!storedPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

    // Decode up to twice to handle double-encoded inputs like "uploads%252Fcomponents..."
    function multiDecode(input: string) {
      let out = input;
      for (let i = 0; i < 2; i++) {
        try {
          const decoded = decodeURIComponent(out);
          if (decoded === out) break;
          out = decoded;
        } catch {
          break;
        }
      }
      return out;
    }

    const cleanedRaw = storedPath.replace(/^[/\\]+/, '');
    const cleaned = multiDecode(cleanedRaw).replace(/\\/g, '/');
    let filePath = path.isAbsolute(storedPath)
      ? storedPath
      : path.join(process.cwd(), cleaned.startsWith('/') ? path.join('public', cleaned.replace(/^[/]+/, '')) : cleaned);

    let data: Buffer | null = null;
    async function tryRead(p: string) {
      try {
        return await fs.readFile(p);
      } catch {
        return null;
      }
    }
    // Try direct read, with extension fallbacks when no extension provided
    const baseExt = path.extname(filePath);
    data = await tryRead(filePath);
    if (!data && !baseExt) {
      const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'];
      for (const ext of candidates) {
        const candidatePath = `${filePath}${ext}`;
        data = await tryRead(candidatePath);
        if (data) {
          filePath = candidatePath;
          break;
        }
      }
    }
    if (!data) {
      if (!path.isAbsolute(storedPath)) {
        const publicPath = path.join(process.cwd(), 'public', cleaned);
        data = await tryRead(publicPath);
        if (!data && !path.extname(publicPath)) {
          const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'];
          for (const ext of candidates) {
            const candidatePath = `${publicPath}${ext}`;
            data = await tryRead(candidatePath);
            if (data) {
              filePath = candidatePath;
              break;
            }
          }
        }
        if (data) {
          filePath = path.extname(filePath) ? filePath : publicPath;
        }
        // Fallback: if path starts with uploads/ but not found under current cwd, try sibling project dir
        if (!data && cleaned.toLowerCase().startsWith('uploads/')) {
          const altPath = path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', cleaned);
          data = await tryRead(altPath);
          if (!data && !path.extname(altPath)) {
            const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf'];
            for (const ext of candidates) {
              const candidatePath = `${altPath}${ext}`;
              data = await tryRead(candidatePath);
              if (data) {
                filePath = candidatePath;
                break;
              }
            }
          }
          if (data) {
            filePath = path.extname(filePath) ? filePath : altPath;
          }
        }
      }
      if (!data && /^https?:\/\//i.test(storedPath)) {
        try {
          const resp = await fetch(storedPath);
          if (resp.ok) {
            const arrayBuf = await resp.arrayBuffer();
            data = Buffer.from(arrayBuf);
          }
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
      : ext === '.pdf' ? 'application/pdf'
      : ext === '.mp4' ? 'video/mp4'
      : ext === '.webm' ? 'video/webm'
      : 'application/octet-stream';

    const body = new Uint8Array(data);
    return new NextResponse(body, {
      status: 200,
      headers: { 
        'Content-Type': mime, 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to serve file';
    return NextResponse.json({ error }, { status: 500 });
  }
}
