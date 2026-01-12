import { NextRequest, NextResponse } from 'next/server';
import { uploadProjectImage } from '@/lib/fileHandler';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const projectId = formData.get('projectId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 5MB' },
        { status: 400 }
      );
    }

    let imagePath: string | undefined;
    let imageUrl: string | undefined;

    if (projectId) {
      const result = await uploadProjectImage(file, projectId);
      imagePath = result.filePath;
      imageUrl = result.url;
    } else {
      const tempId = new ObjectId().toString();
      const result = await uploadProjectImage(file, tempId);
      imagePath = result.filePath;
      imageUrl = result.url;
    }

    return NextResponse.json({
      success: true,
      imagePath,
      imageUrl,
      message: 'Project image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading project image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload project image' },
      { status: 500 }
    );
  }
}