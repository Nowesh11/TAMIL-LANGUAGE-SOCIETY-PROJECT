import { NextRequest } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import EBook from '../../../../../models/EBook';
import { getUserFromAccessToken } from '../../../../../lib/auth';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { NotificationService } from '../../../../../lib/notificationService';
import { ActivityLogger } from '../../../../../lib/activityLogger';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const ebook = await EBook.findById(id);
    if (!ebook || !ebook.active) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    ebook.downloadCount = (ebook.downloadCount || 0) + 1;
    await ebook.save();

    const relPath = ebook.filePath;
    if (!relPath) return NextResponse.json({ success: false, error: 'File path missing' }, { status: 404 });

    // Resolve against a safe base directory: uploads or content ebooks
    const baseCandidates = [
      path.join(process.cwd(), 'tamil-language-society', 'uploads'),
      path.join(process.cwd(), 'content ebooks'),
      path.join(process.cwd(), 'tamil-language-society', 'public'),
    ];
    let filePath: string | null = null;
    for (const base of baseCandidates) {
      const candidate = path.resolve(base, relPath);
      if (candidate.startsWith(base) && fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    // Log ebook download activity
    await ActivityLogger.logEbookDownload(user._id, ebook._id, ebook.title?.en || 'Unknown Ebook');

    // Send notification for ebook download
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Ebook Downloaded Successfully!',
          ta: 'மின்னூல் வெற்றிகரமாக பதிவிறக்கம் செய்யப்பட்டது!'
        },
        message: {
          en: `You downloaded "${ebook.title?.en || ebook.title}". Enjoy reading!`,
          ta: `நீங்கள் "${ebook.title?.ta || ebook.title?.en || 'மின்னூல்'}" பதிவிறக்கம் செய்துள்ளீர்கள். வாசிக்க மகிழுங்கள்!`
        },
        type: 'success',
        priority: 'low',
        userRef: user._id,
        actionUrl: `/ebooks/${ebook._id}`,
        sendEmail: true,
        tags: ['ebook', 'download'],
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to send download notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    const stat = fs.statSync(filePath);
    const stream = fs.createReadStream(filePath);
    const res = new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': inferContentType(filePath),
        'Content-Length': String(stat.size),
        'X-Download-Count': String(ebook.downloadCount),
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
      }
    });
    return res;
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to download ebook';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

function inferContentType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.epub') return 'application/epub+zip';
  if (ext === '.mobi') return 'application/x-mobipocket-ebook';
  if (ext === '.txt') return 'text/plain; charset=utf-8';
  return 'application/octet-stream';
}