import { NextRequest, NextResponse } from 'next/server';
import { uploadLogo } from '@/lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'navbar' or 'footer'

    if (!file || !type) {
      return NextResponse.json({ error: 'File and type are required' }, { status: 400 });
    }

    if (type !== 'navbar' && type !== 'footer') {
      return NextResponse.json({ error: 'Type must be navbar or footer' }, { status: 400 });
    }

    // Use the new file handler
    const result = await uploadLogo(file, type as 'navbar' | 'footer');

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const imageUrl = `/api/files/image?path=${encodeURIComponent(String(result.filePath))}`;

    return NextResponse.json({ 
      success: true, 
      filePath: result.filePath,
      imageUrl,
      fileName: result.fileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
