import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '../../../lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'buynow', 'checkout', 'recruitment'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['buynow', 'checkout', 'recruitment'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Use FileHandler for consistent validation and saving
    // This enforces 5MB limit and allowed image/pdf types automatically
    const result = await FileHandler.saveFile(
      file, 
      'receipts', 
      type, 
      {
        maxSize: 5 * 1024 * 1024, // 5MB explicit limit
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}