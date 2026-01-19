import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import EBook from '@/models/EBook'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function read(p: string) {
  try {
    if (fs.existsSync(p)) return fs.readFileSync(p)
    return null
  } catch { return null }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect()
  const ebook = await EBook.findById(params.id).lean()
  if (!ebook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const rel = String(ebook.filePath || '')
  if (!rel) return NextResponse.json({ error: 'No file' }, { status: 404 })
  let relPath = rel
  if (rel.includes('/api/files/serve')) {
    try {
      const base = typeof process !== 'undefined' ? `http://localhost` : 'http://localhost'
      const u = new URL(rel, base)
      const p = u.searchParams.get('path') || ''
      if (p) relPath = p
    } catch {}
  }
  const normalizedRel = relPath.replace(/^https?:\/\/[^/]+/, '')
  const isUploads = normalizedRel.replace(/^\/+/, '').toLowerCase().startsWith('uploads/')
  const baseFull = path.isAbsolute(normalizedRel)
    ? normalizedRel
    : path.join(process.cwd(), isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel)
  let resolvedPath = ''
  let buf: Buffer | null = null
  const tryPaths = [baseFull, `${baseFull}.pdf`, `${baseFull}.epub`, `${baseFull}.mobi`, `${baseFull}.txt`,
    // sibling project fallback
    path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel),
    path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', `${isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel}.pdf`),
    path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', `${isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel}.epub`),
    path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', `${isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel}.mobi`),
    path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', `${isUploads ? normalizedRel.replace(/^\/+/, '') : normalizedRel}.txt`)
  ]
  for (const p of tryPaths) {
    const b = read(p)
    if (b) { buf = b; resolvedPath = p; break }
  }
  if (!buf) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  const ext = path.extname(resolvedPath || baseFull) || '.pdf'
  const mime =
    ext === '.pdf' ? 'application/pdf' :
    ext === '.epub' ? 'application/epub+zip' :
    ext === '.mobi' ? 'application/x-mobipocket-ebook' :
    ext === '.txt' ? 'text/plain' :
    'application/octet-stream'
  const safeTitle = (ebook.title?.en || 'ebook').replace(/[^\w\s.-]/g, '')
  const name = `${safeTitle}${ext}`
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${name}"`
    }
  })
}
