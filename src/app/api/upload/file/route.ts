import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import FileRecord from '../../../../models/FileRecord';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return NextResponse.json({ error: 'Admin user not found. Seed users first.' }, { status: 400 });

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
    const provisional = new FileRecord({
      path: '',
      filename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: buffer.length,
      category,
      description,
      tags,
      isPublic,
      createdBy: admin._id
    });

    const baseDir = path.join(process.cwd(), 'uploads', category, String(provisional._id));
    await fs.mkdir(baseDir, { recursive: true });
    const destPath = path.join(baseDir, 'file');
    await fs.writeFile(destPath, buffer);

    provisional.path = path.join('uploads', category, String(provisional._id), 'file');
    const record = await provisional.save();

    const url = `/api/files/get?id=${record._id}`;
    return NextResponse.json({ success: true, url, record });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to upload file';
    return NextResponse.json({ error }, { status: 500 });
  }
}