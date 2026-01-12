import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import EBook from '../../../../models/EBook';
import EBookRating from '../../../../models/EBookRating';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { FileHandler } from '../../../../lib/fileHandler';

export const runtime = 'nodejs';

// GET - Fetch EBooks with search, pagination, and filtering
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    
    const search = searchParams.get('search') || '';
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || '10')));
    const status = searchParams.get('status'); // 'active', 'inactive', or null for all
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const featured = searchParams.get('featured'); // 'true', 'false', or null

    // Build filter
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ta': { $regex: search, $options: 'i' } },
        { 'author.en': { $regex: search, $options: 'i' } },
        { 'author.ta': { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') filter.active = true;
    if (status === 'inactive') filter.active = false;
    if (category && category !== 'all') filter.category = category;
    if (language && language !== 'all') filter.language = language;
    if (featured === 'true') filter.featured = true;
    if (featured === 'false') filter.featured = false;

    const total = await EBook.countDocuments(filter);
    const ebooks = await EBook.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Get ratings for these ebooks
    const ebookIds = ebooks.map(ebook => ebook._id);
    const ratings = await EBookRating.aggregate([
      { $match: { ebookId: { $in: ebookIds } } },
      { $group: { _id: '$ebookId', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
    ]);

    const ratingMap = new Map();
    ratings.forEach(r => ratingMap.set(String(r._id), { count: r.count, avg: r.avg }));

    const items = ebooks.map(ebook => ({
      _id: String(ebook._id),
      title: ebook.title,
      author: ebook.author,
      description: ebook.description,
      isbn: ebook.isbn,
      category: ebook.category,
      language: ebook.language,
      fileFormat: ebook.fileFormat,
      fileSize: ebook.fileSize,
      coverPath: ebook.coverPath,
      filePath: ebook.filePath,
      featured: ebook.featured || false,
      active: ebook.active !== false,
      downloadCount: ebook.downloadCount || 0,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      rating: ratingMap.get(String(ebook._id)) || { count: 0, avg: 0 }
    }));

    // Calculate stats
    const totalEbooks = await EBook.countDocuments();
    const activeEbooks = await EBook.countDocuments({ active: true });
    const featuredEbooks = await EBook.countDocuments({ featured: true });
    const downloadStats = await EBook.aggregate([
      { $group: { _id: null, total: { $sum: "$downloadCount" } } }
    ]);
    const totalDownloads = downloadStats.length > 0 ? downloadStats[0].total : 0;

    const stats = {
      total: totalEbooks,
      active: activeEbooks,
      featured: featuredEbooks,
      totalDownloads
    };

    return NextResponse.json({
      success: true,
      data: items,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ebooks' },
      { status: 500 }
    );
  }
}

// POST - Create new EBook
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();

    // Validate required fields
    if (!data.title?.en || !data.title?.ta) {
      return NextResponse.json(
        { success: false, error: 'Title in both English and Tamil is required' },
        { status: 400 }
      );
    }

    if (!data.author?.en || !data.author?.ta) {
      return NextResponse.json(
        { success: false, error: 'Author in both English and Tamil is required' },
        { status: 400 }
      );
    }

    if (!data.filePath) {
      return NextResponse.json(
        { success: false, error: 'File path is required' },
        { status: 400 }
      );
    }

    const ebook = new EBook({
      title: data.title,
      author: data.author,
      description: data.description || { en: '', ta: '' },
      isbn: data.isbn || '',
      category: data.category || 'general',
      language: data.language || 'tamil',
      fileFormat: data.fileFormat || 'pdf',
      fileSize: data.fileSize || 0,
      coverPath: data.coverPath || '',
      filePath: data.filePath,
      featured: data.featured || false,
      active: data.active !== false,
      downloadCount: 0
    });

    await ebook.save();

    // Log admin ebook creation activity
    await ActivityLogger.logEbookCreation('admin', ebook._id, ebook.title?.en || 'Unknown Title');

    return NextResponse.json({
      success: true,
      data: {
        _id: String(ebook._id),
        ...ebook.toObject()
      }
    });
  } catch (error) {
    console.error('Error creating ebook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create ebook' },
      { status: 500 }
    );
  }
}

// PUT - Update EBook
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'EBook ID is required' },
        { status: 400 }
      );
    }

    const ebook = await EBook.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!ebook) {
      return NextResponse.json(
        { success: false, error: 'EBook not found' },
        { status: 404 }
      );
    }

    // Log admin ebook update activity
    await ActivityLogger.logEbookUpdate('admin', ebook._id, ebook.title?.en || 'Unknown Title');

    return NextResponse.json({
      success: true,
      data: {
        _id: String(ebook._id),
        ...ebook.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating ebook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update ebook' },
      { status: 500 }
    );
  }
}

// DELETE - Delete EBook
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'EBook ID is required' },
        { status: 400 }
      );
    }

    const ebook = await EBook.findByIdAndDelete(id);

    if (!ebook) {
      return NextResponse.json(
        { success: false, error: 'EBook not found' },
        { status: 404 }
      );
    }

    // Clean up ebook's upload directory
    try {
      const ebookUploadDir = `uploads/ebooks/${id}`;
      FileHandler.deleteDirectory(ebookUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup ebook directory:', cleanupError);
    }

    // Log admin ebook deletion activity
    await ActivityLogger.logEbookDeletion('admin', ebook._id, ebook.title?.en || 'Unknown Title');

    // Also delete associated ratings
    await EBookRating.deleteMany({ ebookId: id });

    return NextResponse.json({
      success: true,
      message: 'EBook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ebook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete ebook' },
      { status: 500 }
    );
  }
}