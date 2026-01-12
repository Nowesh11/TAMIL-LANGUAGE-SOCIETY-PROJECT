import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '../../../../lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Save the file using FileHandler in recruitment-forms directory
    const savedFile = await FileHandler.saveImage(file, 'uploads/recruitment-forms');

    return NextResponse.json({
      success: true,
      url: savedFile.url,
      filename: savedFile.fileName
    });

  } catch (error) {
    console.error('Recruitment form image upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}