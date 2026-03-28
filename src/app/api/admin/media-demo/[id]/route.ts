import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { replaceFile, deleteFolder } from '@/lib/fileManager';
import { getUserFromAccessToken } from '@/lib/auth';
import mongoose from 'mongoose';

// Ensure model is registered
const DemoModel = mongoose.models.MediaDemo || mongoose.model('MediaDemo', new mongoose.Schema({
  name: String,
  imagePath: String,
  videoPath: String,
}, { timestamps: true }));

export const runtime = 'nodejs';

/**
 * UPDATE (REPLACE FILES) Logic
 * PUT /api/admin/media-demo/[id]
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await DemoModel.findById(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const imageFile = formData.get('image') as File | null;
    const videoFile = formData.get('video') as File | null;

    if (name) doc.name = name;

    // Use replaceFile logic: deletes old file from disk if new one is provided
    if (imageFile) {
      doc.imagePath = await replaceFile(imageFile, doc.imagePath, 'media-demo', id);
    }
    if (videoFile) {
      doc.videoPath = await replaceFile(videoFile, doc.videoPath, 'media-demo', id);
    }

    await doc.save();

    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 500 });
  }
}

/**
 * DELETE (FULL CLEANUP) Logic
 * DELETE /api/admin/media-demo/[id]
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Delete from MongoDB
    const doc = await DemoModel.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 2. Delete entire folder from disk: uploads/media-demo/{id}/
    await deleteFolder('media-demo', id);

    return NextResponse.json({ success: true, message: 'Document and files deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
