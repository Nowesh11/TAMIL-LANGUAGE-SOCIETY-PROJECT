import { NextRequest, NextResponse } from 'next/server'
import { uploadEbookCover, uploadEbookFile } from '@/lib/fileHandler'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const ebookIdRaw = formData.get('ebookId') as string | null
    const uploadType = (formData.get('type') as string | null) || 'file'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    const ebookId = ebookIdRaw && ebookIdRaw.trim().length > 0 ? ebookIdRaw : new ObjectId().toString()

    if (uploadType === 'cover') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, error: 'Cover must be an image' }, { status: 400 })
      }
      const result = await uploadEbookCover(file, ebookId)
      if (!result.success || !result.filePath) {
        return NextResponse.json({ success: false, error: result.error || 'Upload failed' }, { status: 400 })
      }
      return NextResponse.json({ success: true, ebookId, kind: 'cover', filePath: result.filePath, fileName: result.fileName, url: result.url })
    }

    if (uploadType === 'file') {
      const result = await uploadEbookFile(file, ebookId)
      if (!result.success || !result.filePath) {
        return NextResponse.json({ success: false, error: result.error || 'Upload failed' }, { status: 400 })
      }
      return NextResponse.json({ success: true, ebookId, kind: 'file', filePath: result.filePath, fileName: result.fileName, url: result.url })
    }

    return NextResponse.json({ success: false, error: 'Invalid upload type' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

