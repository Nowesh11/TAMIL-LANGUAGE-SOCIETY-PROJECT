import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'

async function tryRead(p: string) {
  try { return await fs.readFile(p) } catch { return null }
}

function multiDecode(input: string) {
  let out = input
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(out)
      if (decoded === out) break
      out = decoded
    } catch { break }
  }
  return out
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const storedPath = String(url.searchParams.get('path') || '')
  if (!storedPath) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  const cleanedRaw = storedPath.replace(/^[/\\]+/, '')
  const cleaned = multiDecode(cleanedRaw).replace(/\\/g, '/')

  let filePath = path.isAbsolute(storedPath)
    ? storedPath
    : path.join(process.cwd(), cleaned.startsWith('/') ? path.join('public', cleaned.replace(/^[/]+/, '')) : cleaned)

  let data: Buffer | null = await tryRead(filePath)
  const baseExt = path.extname(filePath)
  if (!data && !baseExt) {
    const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf']
    for (const ext of candidates) {
      const candidatePath = `${filePath}${ext}`
      data = await tryRead(candidatePath)
      if (data) { filePath = candidatePath; break }
    }
  }
  if (!data && !path.isAbsolute(storedPath)) {
    const publicPath = path.join(process.cwd(), 'public', cleaned)
    data = await tryRead(publicPath)
    if (!data && !path.extname(publicPath)) {
      const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf']
      for (const ext of candidates) {
        const candidatePath = `${publicPath}${ext}`
        data = await tryRead(candidatePath)
        if (data) { filePath = candidatePath; break }
      }
    }
    if (!data && cleaned.toLowerCase().startsWith('uploads/')) {
      const altPath = path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', cleaned)
      data = await tryRead(altPath)
      if (!data && !path.extname(altPath)) {
        const candidates = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.pdf']
        for (const ext of candidates) {
          const candidatePath = `${altPath}${ext}`
          data = await tryRead(candidatePath)
          if (data) { filePath = candidatePath; break }
        }
      }
      if (!path.extname(filePath)) filePath = altPath
    }
  }
  if (!data) return NextResponse.json({ error: 'File not found', resolvedPath: filePath }, { status: 404 })

  const ext = path.extname(filePath).toLowerCase()
  const mime = ext === '.svg' ? 'image/svg+xml'
    : ext === '.png' ? 'image/png'
    : ext === '.gif' ? 'image/gif'
    : ext === '.webp' ? 'image/webp'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.pdf' ? 'application/pdf'
    : 'application/octet-stream'

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
