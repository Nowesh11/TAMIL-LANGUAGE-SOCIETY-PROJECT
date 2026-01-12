import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Poster from '../../../../models/Poster';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { getUserFromAccessToken } from '../../../../lib/auth';
import { FileHandler } from '../../../../lib/fileHandler';
import { NotificationService } from '../../../../lib/notificationService';

export const runtime = 'nodejs';

// GET - Fetch all posters for admin
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ta': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.ta': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured && featured !== 'all') {
      query.isFeatured = featured === 'featured';
    }
    
    // Get total count
    const total = await Poster.countDocuments(query);
    
    // Get statistics
    const stats = {
      total: await Poster.countDocuments(),
      active: await Poster.countDocuments({ isActive: true }),
      inactive: await Poster.countDocuments({ isActive: false }),
      featured: await Poster.countDocuments({ isFeatured: true }),
      byCategory: {}
    };
    
    // Get category statistics
    const categoryStats = await Poster.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    categoryStats.forEach((stat: any) => {
      if (stat._id) {
        (stats.byCategory as any)[stat._id] = stat.count;
      }
    });
    
    // Fetch posters
    const posters = await Poster.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format response
    const formattedPosters = posters.map((poster: any) => ({
      ...poster,
      _id: poster._id.toString(),
      imageUrl: poster.imagePath ? `/api/posters/image?id=${poster._id}` : null,
      createdAt: poster.createdAt?.toISOString(),
      updatedAt: poster.updatedAt?.toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedPosters,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin Posters GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch posters' },
      { status: 500 }
    );
  }
}

// POST - Create new poster
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get user from JWT token
    const user = await getUserFromAccessToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const {
      title,
      description,
      category,
      eventDate,
      isActive = true,
      isFeatured = false,
      order = 0,
      imagePath
    } = body;
    
    // Validate required fields
    if (!title?.en || !title?.ta) {
      return NextResponse.json(
        { success: false, error: 'Title in both English and Tamil is required' },
        { status: 400 }
      );
    }
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category is required' },
        { status: 400 }
      );
    }
    
    // Create new poster
    const poster = new Poster({
      title,
      description,
      category,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      isActive,
      isFeatured,
      order,
      imagePath,
      createdBy: user._id
    });
    
    await poster.save();
    
    // Log admin poster creation activity
    await ActivityLogger.logPosterCreation('admin', poster._id, poster.title?.en || 'Unknown Title');

    // Create notification
    await NotificationService.createPosterNotification('created', poster, user._id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...poster.toObject(),
        _id: poster._id.toString(),
        imageUrl: poster.imagePath ? `/api/posters/image?id=${poster._id}` : null
      },
      message: 'Poster created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Posters POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create poster' },
      { status: 500 }
    );
  }
}

// PUT - Update poster
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get user from JWT token
    const user = await getUserFromAccessToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { _id, eventDate, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Poster ID is required' },
        { status: 400 }
      );
    }
    
    // Handle date conversion
    if (eventDate) {
      updateData.eventDate = new Date(eventDate);
    }
    
    const poster = await Poster.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!poster) {
      return NextResponse.json(
        { success: false, error: 'Poster not found' },
        { status: 404 }
      );
    }
    
    // Log admin poster update activity
    await ActivityLogger.logPosterUpdate('admin', poster._id, poster.title?.en || 'Unknown Title');
    
    return NextResponse.json({
      success: true,
      data: {
        ...poster.toObject(),
        _id: poster._id.toString(),
        imageUrl: poster.imagePath ? `/api/posters/image?id=${poster._id}` : null
      },
      message: 'Poster updated successfully'
    });
  } catch (error: any) {
    console.error('Admin Posters PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update poster' },
      { status: 500 }
    );
  }
}

// DELETE - Delete poster
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    // Get user from JWT token
    const user = await getUserFromAccessToken(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Poster ID is required' },
        { status: 400 }
      );
    }
    
    const poster = await Poster.findByIdAndDelete(id);
    
    if (!poster) {
      return NextResponse.json(
        { success: false, error: 'Poster not found' },
        { status: 404 }
      );
    }
    
    // Clean up poster's upload directory
    try {
      const posterUploadDir = `uploads/posters/${id}`;
      FileHandler.deleteDirectory(posterUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup poster directory:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }
    
    // Log admin poster deletion activity
    await ActivityLogger.logPosterDeletion('admin', poster._id, poster.title?.en || 'Unknown Title');
    
    return NextResponse.json({
      success: true,
      message: 'Poster deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin Posters DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete poster' },
      { status: 500 }
    );
  }
}