import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function tryRead(p: string) {
  try {
    if (fs.existsSync(p)) return fs.readFileSync(p)
    return null
  } catch { return null }
}

function guessMime(ext: string) {
  const e = ext.toLowerCase()
  return e === '.svg' ? 'image/svg+xml'
    : e === '.png' ? 'image/png'
    : e === '.gif' ? 'image/gif'
    : e === '.webp' ? 'image/webp'
    : e === '.jpg' || e === '.jpeg' ? 'image/jpeg'
    : 'application/octet-stream'
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  let p = url.searchParams.get('p') || ''
  if (!p) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  p = p.replace(/^https?:\/\/[^/]+/, '').replace(/^\/+/, '')
  if (!p.toLowerCase().startsWith('uploads/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  const base = path.join(process.cwd(), p)
  let buf = tryRead(base)
  let resolved = base
  if (!buf) {
    const rootNoExt = base
    const ext = path.extname(rootNoExt)
    const candidates = ext ? [''] : ['', '.jpg', '.jpeg', '.png', '.webp', '.svg']
    for (const c of candidates) {
      const cp = c ? `${rootNoExt}${c}` : rootNoExt
      buf = tryRead(cp)
      if (buf) { resolved = cp; break }
    }
    // Fallback to sibling project directory if not found under current cwd
    if (!buf) {
      const altBase = path.join(process.cwd(), '..', 'TAMIL-LANGUAGE-SOCIETY-PROJECT', p)
      buf = tryRead(altBase)
      resolved = altBase
      if (!buf) {
        const altNoExt = altBase
        for (const c of candidates) {
          const cp = c ? `${altNoExt}${c}` : altNoExt
          buf = tryRead(cp)
          if (buf) { resolved = cp; break }
        }
      }
    }
  }
  if (!buf) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const mime = guessMime(path.extname(resolved))
  return new NextResponse(buf, { status: 200, headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' } })
}
