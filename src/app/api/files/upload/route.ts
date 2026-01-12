import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '@/lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const subCategory = formData.get('subCategory') as string | undefined;
    const customFileName = formData.get('customFileName') as string | undefined;
    const fileType = formData.get('fileType') as string; // 'image' | 'document' | 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    let result;

    // Handle different file types with appropriate validation
    switch (fileType) {
      case 'image':
        result = await FileHandler.saveImage(file, category, subCategory, customFileName);
        break;
      case 'document':
        result = await FileHandler.saveDocument(file, category, subCategory, customFileName);
        break;
      default:
        result = await FileHandler.saveFile(file, category, subCategory, {}, customFileName);
        break;
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    const deleted = FileHandler.deleteFile(filePath);

    if (deleted) {
      return NextResponse.json({ success: true, message: 'File deleted successfully' });
    } else {
      return NextResponse.json({ error: 'File not found or could not be deleted' }, { status: 404 });
    }

  } catch (error) {
    console.error('File deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}