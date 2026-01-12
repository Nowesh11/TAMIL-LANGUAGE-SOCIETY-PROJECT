import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import EBook from '../../../../models/EBook';
import EBookRating from '../../../../models/EBookRating';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid ebook ID'
      }, { status: 400 });
    }
    
    // Find the ebook
    const ebook = await EBook.findById(id).lean();
    
    if (!ebook || !(ebook as any).active) {
      return NextResponse.json({
        success: false,
        error: 'Ebook not found'
      }, { status: 404 });
    }
    
    // Get rating information
    const ratings = await EBookRating.aggregate([
      { $match: { ebookId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$rating' } } }
    ]);
    
    const ratingInfo = ratings[0] || { count: 0, avg: 0 };
    
    // Format the response
    const ebookData = {
      _id: String((ebook as any)._id),
      title: (ebook as any).title,
      author: (ebook as any).author,
      description: (ebook as any).description,
      fileFormat: (ebook as any).fileFormat,
      category: (ebook as any).category || null,
      language: (ebook as any).language,
      featured: !!(ebook as any).featured,
      downloadCount: (ebook as any).downloadCount || 0,
      coverPath: (ebook as any).coverPath || null,
      filePath: (ebook as any).filePath,
      isbn: (ebook as any).isbn,
      publishedYear: (ebook as any).publishedYear,
      active: (ebook as any).active,
      rating: {
        count: ratingInfo.count,
        average: ratingInfo.avg || 0
      },
      createdAt: (ebook as any).createdAt,
      updatedAt: (ebook as any).updatedAt
    };
    
    return NextResponse.json({
      success: true,
      ebook: ebookData
    });
  } catch (error) {
    console.error('GET /api/ebooks/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ebook details'
    }, { status: 500 });
  }
}