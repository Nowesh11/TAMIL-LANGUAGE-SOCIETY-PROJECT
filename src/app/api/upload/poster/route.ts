import { NextRequest, NextResponse } from 'next/server';
import { FileHandler, uploadPosterImage } from '@/lib/fileHandler';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const posterId = formData.get('posterId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Image size must be less than 5MB' },
        { status: 400 }
      );
    }

    let imagePath: string;

    if (posterId) {
      // Use existing poster ID for proper folder structure
      const result = await uploadPosterImage(file, posterId);
      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'Failed to upload image');
      }
      imagePath = result.filePath;
    } else {
      // Generate a temporary ID for new posters
      const tempId = new ObjectId().toString();
      const result = await uploadPosterImage(file, tempId);
      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'Failed to upload image');
      }
      imagePath = result.filePath;
    }

    return NextResponse.json({
      success: true,
      imagePath,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading poster image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}