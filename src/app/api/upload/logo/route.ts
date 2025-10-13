import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
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
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File field is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare FileRecord first to get an ID
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `logo_${Date.now()}_${safeName}`;
    const provisional = new FileRecord({
      path: '', // will set after computing uploads path
      filename,
      originalName: file.name,
      mimeType: file.type || 'image/png',
      size: buffer.length,
      category: 'image',
      description: 'Site logo image',
      tags: ['logo', 'brand'],
      isPublic: false,
      createdBy: admin._id
    });

    // Compute uploads path using record id
    const baseDir = path.join(process.cwd(), 'uploads', 'logo', String(provisional._id));
    await fs.mkdir(baseDir, { recursive: true });
    const destPath = path.join(baseDir, 'image');
    await fs.writeFile(destPath, buffer);

    // Store relative path in DB: uploads/logo/<id>/image
    provisional.path = path.join('uploads', 'logo', String(provisional._id), 'image');
    const record = await provisional.save();

    const imageUrl = `/api/files/image?id=${record._id}`;
    return NextResponse.json({ success: true, imageUrl, record });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to upload logo';
    return NextResponse.json({ error }, { status: 500 });
  }
}
