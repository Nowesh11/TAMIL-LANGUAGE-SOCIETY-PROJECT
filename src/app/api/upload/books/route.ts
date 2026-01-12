import { NextRequest, NextResponse } from 'next/server'
import { uploadBookCover } from '@/lib/fileHandler'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bookIdRaw = formData.get('bookId') as string | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 })
    }

    const bookId = bookIdRaw && bookIdRaw.trim().length > 0 ? bookIdRaw : new ObjectId().toString()

    const result = await uploadBookCover(file, bookId)
    if (!result.success || !result.filePath) {
      return NextResponse.json({ success: false, error: result.error || 'Upload failed' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      bookId,
      filePath: result.filePath,
      fileName: result.fileName,
      url: result.url
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

