import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

function listFilesSorted(dir: string) {
  if (!fs.existsSync(dir)) return []
  const items = fs.readdirSync(dir)
    .map(name => {
      const full = path.join(dir, name)
      try {
        const stat = fs.statSync(full)
        return stat.isFile() ? { name, full, mtime: stat.mtimeMs } : null
      } catch { return null }
    })
    .filter(Boolean) as { name: string; full: string; mtime: number }[]
  items.sort((a, b) => b.mtime - a.mtime)
  return items
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const type = (url.searchParams.get('type') || '').toLowerCase() // navbar | footer | gallery | hero | image
  if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })
  const base = path.join(process.cwd(), 'uploads', 'components', type)
  const files = listFilesSorted(base)
  const data = files.map(f => {
    const rel = path.relative(process.cwd(), f.full).replace(/\\/g, '/')
    return {
      name: f.name,
      path: rel,
      url: `/api/files/serve?path=${encodeURIComponent(rel)}`,
      mtime: f.mtime
    }
  })
  return NextResponse.json({ success: true, files: data })
}
