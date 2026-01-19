import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { EBook, Poster } from '../src/models'

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil-language-society'
  await mongoose.connect(uri)

  const base = path.join(process.cwd(), 'uploads')
  const removed: string[] = []

  function rmDir(dir: string) {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true })
        removed.push(dir)
      }
    } catch {}
  }

  // Orphan ebook directories
  try {
    const ebooksDir = path.join(base, 'ebooks')
    if (fs.existsSync(ebooksDir)) {
      const ids = new Set<string>((await EBook.find({}, { _id: 1 }).lean()).map(d => String(d._id)))
      for (const entry of fs.readdirSync(ebooksDir)) {
        const dir = path.join(ebooksDir, entry)
        if (fs.statSync(dir).isDirectory() && !ids.has(entry)) {
          rmDir(dir)
        }
      }
    }
  } catch {}

  // Orphan poster directories
  try {
    const postersDir = path.join(base, 'posters')
    if (fs.existsSync(postersDir)) {
      const ids = new Set<string>((await Poster.find({}, { _id: 1 }).lean()).map(d => String(d._id)))
      for (const entry of fs.readdirSync(postersDir)) {
        const dir = path.join(postersDir, entry)
        if (fs.statSync(dir).isDirectory() && !ids.has(entry)) {
          rmDir(dir)
        }
      }
    }
  } catch {}

  await mongoose.disconnect()
  console.log(JSON.stringify({ removed }, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
