import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Optional: connect if future validation is needed
    // await dbConnect();

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const category = String(formData.get('category') || 'file');
    const tagsRaw = formData.get('tags');
    const tags = Array.isArray(tagsRaw) ? tagsRaw.map(String) : (typeof tagsRaw === 'string' ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []);
    const description = String(formData.get('description') || 'Uploaded file');
    const isPublic = String(formData.get('isPublic') || 'false') === 'true';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File field is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${category}_${Date.now()}_${safeName}`;
    const baseDir = path.join(process.cwd(), 'public', 'uploads', category);
    await fs.mkdir(baseDir, { recursive: true });
    const destPath = path.join(baseDir, filename);
    await fs.writeFile(destPath, buffer);

    const url = `/uploads/${category}/${filename}`;
    return NextResponse.json({ success: true, url });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to upload file';
    return NextResponse.json({ error }, { status: 500 });
  }
}
