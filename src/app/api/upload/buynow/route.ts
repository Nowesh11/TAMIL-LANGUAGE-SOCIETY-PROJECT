import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '@/lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const userId = formData.get('userId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Use FileHandler to save the file with proper organization
    // Structure: uploads/purchases/buynow/{userId}/{orderId}/receipt
    const subCategory = orderId ? `${userId || 'anonymous'}/${orderId}` : `${userId || 'anonymous'}/temp`;
    
    const result = await FileHandler.saveFile(
      file,
      'purchases',
      `buynow/${subCategory}`,
      {
        maxSize: 5 * 1024 * 1024, // 5MB max for receipt files
        allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf']
      },
      `receipt_${Date.now()}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url,
      message: 'Purchase receipt uploaded successfully'
    });

  } catch (error) {
    console.error('BuyNow file upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}