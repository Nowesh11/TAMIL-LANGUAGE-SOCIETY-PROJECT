import { NextRequest, NextResponse } from 'next/server';
import { uploadTeamMemberPhoto } from '@/lib/fileHandler';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const memberId = formData.get('memberId') as string;

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

    if (memberId) {
      // Use existing member ID for proper folder structure
      const result = await uploadTeamMemberPhoto(file, memberId);
      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'Failed to upload team member image');
      }
      imagePath = result.filePath;
    } else {
      // Generate a temporary ID for new team members
      const tempId = new ObjectId().toString();
      const result = await uploadTeamMemberPhoto(file, tempId);
      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'Failed to upload team member image');
      }
      imagePath = result.filePath;
    }

    return NextResponse.json({
      success: true,
      imagePath,
      message: 'Team member image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading team member image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload team member image' },
      { status: 500 }
    );
  }
}