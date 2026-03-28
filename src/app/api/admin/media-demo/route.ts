import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { saveFile, deleteFolder } from '@/lib/fileManager';
import { getUserFromAccessToken } from '@/lib/auth';
import mongoose from 'mongoose';

// Simple schema for demo
const DemoSchema = new mongoose.Schema({
  name: String,
  imagePath: String,
  videoPath: String,
}, { timestamps: true });

const DemoModel = mongoose.models.MediaDemo || mongoose.model('MediaDemo', DemoSchema);

export const runtime = 'nodejs';

/**
 * CREATE (UPLOAD) Logic
 * POST /api/admin/media-demo
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;
    const videoFile = formData.get('video') as File | null;

    // 1. Create document first to get the ID
    const doc = new DemoModel({ name });
    const id = doc._id.toString();

    // 2. Save files using the document ID in the folder path: uploads/media-demo/{id}/
    if (imageFile) {
      doc.imagePath = await saveFile(imageFile, 'media-demo', id);
    }
    if (videoFile) {
      doc.videoPath = await saveFile(videoFile, 'media-demo', id);
    }

    await doc.save();

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('Create error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Upload failed' }, { status: 500 });
  }
}

/**
 * GET all
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const data = await DemoModel.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
