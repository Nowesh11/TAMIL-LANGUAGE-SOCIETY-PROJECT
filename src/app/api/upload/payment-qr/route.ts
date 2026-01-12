import { NextRequest, NextResponse } from 'next/server';
import { FileHandler } from '@/lib/fileHandler';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const paymentMethod = formData.get('paymentMethod') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!paymentMethod || paymentMethod !== 'fpx') {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Use FileHandler to save the QR code image
    // Structure: uploads/payment-qr/fpx/qr_code_timestamp
    const result = await FileHandler.saveImage(
      file,
      'payment-qr',
      paymentMethod,
      `qr_code_${Date.now()}`
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url,
      message: 'Payment QR code uploaded successfully'
    });

  } catch (error) {
    console.error('Payment QR upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}