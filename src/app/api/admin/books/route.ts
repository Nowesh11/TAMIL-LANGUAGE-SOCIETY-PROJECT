import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import BookRating from '../../../../models/BookRating';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { FileHandler } from '../../../../lib/fileHandler';

export const runtime = 'nodejs';

// GET - Fetch Books with search, pagination, and filtering
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
    const stockStatus = searchParams.get('stockStatus'); // 'inStock', 'lowStock', 'outOfStock', or null

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
    
    // Stock status filtering
    if (stockStatus === 'inStock') filter.stock = { $gt: 10 };
    if (stockStatus === 'lowStock') filter.stock = { $gte: 1, $lte: 10 };
    if (stockStatus === 'outOfStock') filter.stock = { $lte: 0 };

    const total = await Book.countDocuments(filter);
    const books = await Book.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate stats
    const stats = {
      total: await Book.countDocuments(),
      active: await Book.countDocuments({ active: true }),
      outOfStock: await Book.countDocuments({ stock: { $lte: 0 } }),
      lowStock: await Book.countDocuments({ stock: { $gt: 0, $lte: 10 } })
    };

    const items = books.map(book => ({
      _id: String(book._id),
      title: book.title,
      author: book.author,
      description: book.description,
      price: book.price,
      stock: book.stock,
      coverPath: book.coverPath,
      isbn: book.isbn,
      category: book.category,
      publishedYear: book.publishedYear,
      pages: book.pages,
      language: book.language,
      featured: book.featured || false,
      active: book.active !== false,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      isAvailable: book.stock > 0 && book.active !== false
    }));

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
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    );
  }
}

// POST - Create new Book
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    console.log('📚 Creating Book with data:', JSON.stringify(data, null, 2));
    
    // Validate required fields manually if needed, or let Mongoose do it
    const book = new Book(data);
    await book.save();
    
    return NextResponse.json({
      success: true,
      data: book
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error creating book:', error);
    return NextResponse.json({ success: false, error: 'Failed to create book', details: (error as Error).message }, { status: 500 });
  }
}

// PUT - Update Book
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const book = await Book.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Log admin book update activity
    await ActivityLogger.logBookUpdate('admin', book._id, book.title?.en || 'Unknown Title');

    return NextResponse.json({
      success: true,
      data: {
        _id: String(book._id),
        ...book.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    );
  }
}

// DELETE - Delete Book
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Book ID is required' },
        { status: 400 }
      );
    }

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Clean up book's upload directory
    try {
      const bookUploadDir = `uploads/books/${id}`;
      FileHandler.deleteDirectory(bookUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup book directory:', cleanupError);
    }

    // Log admin book deletion activity
    await ActivityLogger.logBookDeletion('admin', book._id, book.title?.en || 'Unknown Title');

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    );
  }
}