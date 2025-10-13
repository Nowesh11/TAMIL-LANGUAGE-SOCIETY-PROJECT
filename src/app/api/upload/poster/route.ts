import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import dbConnect from '../../../../lib/mongodb';
import Poster from '../../../../models/Poster';
import User from '../../../../models/User';

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
    const titleEn = String(formData.get('titleEn') || 'Poster');
    const titleTa = String(formData.get('titleTa') || 'போஸ்டர்');
    const descEn = String(formData.get('descEn') || '');
    const descTa = String(formData.get('descTa') || '');
    const order = Number(formData.get('order') || 0);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File field is required' }, { status: 400 });
    }

    // Create poster record first
    const poster = await Poster.create({
      title: { en: titleEn, ta: titleTa },
      description: { en: descEn, ta: descTa },
      imagePath: '',
      order,
      active: true,
      createdBy: admin._id,
    });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension from original name/content type or sniff bytes
    const originalName = (file as File).name || 'image';
    let ext = path.extname(originalName).toLowerCase();
    const type = (file as File).type || '';
    const header = buffer.subarray(0, 12);
    const sniffExt = () => {
      // PNG signature: 89 50 4E 47
      if (header.length >= 4 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) return '.png';
      // GIF signature: GIF87a or GIF89a
      if (header.length >= 6 && header.toString('ascii', 0, 6).startsWith('GIF')) return '.gif';
      // JPEG signature: FF D8
      if (header.length >= 2 && header[0] === 0xFF && header[1] === 0xD8) return '.jpg';
      // WEBP: RIFF....WEBP
      if (header.length >= 12 && header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WEBP') return '.webp';
      // SVG: starts with '<svg' (text)
      const textStart = buffer.subarray(0, Math.min(256, buffer.length)).toString('utf8').trim().toLowerCase();
      if (textStart.startsWith('<svg')) return '.svg';
      return '';
    };
    if (!ext) {
      ext = type === 'image/png' ? '.png'
        : type === 'image/jpeg' ? '.jpg'
        : type === 'image/webp' ? '.webp'
        : type === 'image/svg+xml' ? '.svg'
        : type === 'image/gif' ? '.gif'
        : sniffExt();
    }

    const baseDir = path.join(process.cwd(), 'uploads', 'posters', String(poster._id));
    await fs.mkdir(baseDir, { recursive: true });
    const filename = `image${ext || ''}`;
    const destPath = path.join(baseDir, filename);
    await fs.writeFile(destPath, buffer);

    // Store relative path in DB for portability (with extension when known)
    poster.imagePath = path.join('uploads', 'posters', String(poster._id), filename);
    await poster.save();

    return NextResponse.json({ success: true, poster: { id: poster._id, imageUrl: `/api/posters/image?id=${poster._id}` } });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to upload poster';
    return NextResponse.json({ error }, { status: 500 });
  }
}