import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '@/lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fieldId = formData.get('fieldId') as string;
    const responseId = formData.get('responseId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!fieldId) {
      return NextResponse.json({ error: 'Field ID is required' }, { status: 400 });
    }

    // Use FileHandler to save the file with proper organization
    // Structure: uploads/recruitment/{responseId}/{fieldId}/filename
    const result = await FileHandler.saveFile(
      file,
      'recruitment',
      responseId ? `${responseId}/${fieldId}` : fieldId,
      {
        maxSize: 10 * 1024 * 1024, // 10MB max for recruitment files
        allowedTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx']
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url,
      message: 'Recruitment file uploaded successfully'
    });

  } catch (error) {
    console.error('Recruitment file upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}