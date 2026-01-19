import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import EBook from '@/models/EBook'
import EBookRating from '@/models/EBookRating'
import { getUserFromAccessToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromAccessToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await dbConnect()
  const ebook = await EBook.findById(params.id)
  if (!ebook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const value = Math.max(1, Math.min(5, Number(body.rating || 5)))
  await EBookRating.updateOne(
    { ebookId: ebook._id, createdBy: user._id },
    { $set: { ebookId: ebook._id, createdBy: user._id, rating: value } },
    { upsert: true }
  )
  return NextResponse.json({ ok: true })
}
