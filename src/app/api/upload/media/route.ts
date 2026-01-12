import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '../../../../lib/fileHandler';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = String(formData.get('category') || 'uploads');
    const subCategory = formData.get('subCategory') ? String(formData.get('subCategory')) : undefined;
    const customFileName = formData.get('customFileName') ? String(formData.get('customFileName')) : undefined;

    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    let result;
    if (file.type.startsWith('image/')) {
      result = await FileHandler.saveImage(file, category, subCategory, customFileName);
    } else if (file.type.startsWith('video/')) {
      result = await FileHandler.saveVideo(file, category, subCategory, customFileName);
    } else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) {
      result = await FileHandler.saveDocument(file, category, subCategory, customFileName);
    } else {
      result = await FileHandler.saveFile(file, category, subCategory, {}, customFileName);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Upload failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to upload media';
    return NextResponse.json({ error }, { status: 500 });
  }
}
