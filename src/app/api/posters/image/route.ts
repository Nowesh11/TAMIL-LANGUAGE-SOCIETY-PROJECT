import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function tryRead(p: string) {
  try {
    if (fs.existsSync(p)) return fs.readFileSync(p)
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const base = path.join(process.cwd(), 'uploads', 'posters', id)
  const root = path.join(base, 'image')
  const candidates = ['', '.jpg', '.jpeg', '.png', '.webp', '.svg']
  for (const ext of candidates) {
    const p = ext ? `${root}${ext}` : root
    const buf = tryRead(p)
    if (buf) {
      const e = path.extname(p).toLowerCase()
      const mime =
        e === '.svg' ? 'image/svg+xml' :
        e === '.png' ? 'image/png' :
        e === '.gif' ? 'image/gif' :
        e === '.webp' ? 'image/webp' :
        e === '.jpg' || e === '.jpeg' ? 'image/jpeg' :
        'application/octet-stream'
      return new NextResponse(buf, {
        status: 200,
        headers: { 'Content-Type': mime, 'Cache-Control': 'no-store' }
      })
    }
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
