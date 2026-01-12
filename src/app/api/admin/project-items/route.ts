import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import ProjectItem from '../../../../models/ProjectItem';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { getUserFromAccessToken } from '../../../../lib/auth';
import { FileHandler } from '../../../../lib/fileHandler';
import { NotificationService } from '../../../../lib/notificationService';

export const runtime = 'nodejs';

// GET - Fetch all project items for admin
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const bureau = searchParams.get('bureau') || '';
    const active = searchParams.get('active') || '';
    const featured = searchParams.get('featured') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ta': { $regex: search, $options: 'i' } },
        { 'shortDesc.en': { $regex: search, $options: 'i' } },
        { 'shortDesc.ta': { $regex: search, $options: 'i' } },
        { 'fullDesc.en': { $regex: search, $options: 'i' } },
        { 'fullDesc.ta': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (bureau) {
      query.bureau = bureau;
    }
    
    if (active) {
      query.active = active === 'true';
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Get total count
    const total = await ProjectItem.countDocuments(query);
    
    // Get stats
    const stats = {
      total: await ProjectItem.countDocuments(),
      active: await ProjectItem.countDocuments({ active: true, status: 'active' }),
      featured: await ProjectItem.countDocuments({ featured: true }),
      planning: await ProjectItem.countDocuments({ status: 'planning' }),
      completed: await ProjectItem.countDocuments({ status: 'completed' }),
      totalBudget: (await ProjectItem.aggregate([
        { $group: { _id: null, total: { $sum: "$budget" } } }
      ]))[0]?.total || 0
    };

    // Fetch project items
    const items = await ProjectItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format response
    const formattedItems = items.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
      createdAt: item.createdAt?.toISOString(),
      updatedAt: item.updatedAt?.toISOString(),
      startDate: item.startDate?.toISOString(),
      endDate: item.endDate?.toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedItems,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin Project Items GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch project items' },
      { status: 500 }
    );
  }
}

// POST - Create new project item
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      shortDesc,
      fullDesc,
      type,
      bureau,
      status = 'planning',
      budget,
      startDate,
      endDate,
      goals,
      achievement,
      directorName,
      location,
      participants = 0,
      heroImagePath,
      images = [],
      featured = false,
      active = true,
      recruitmentFormId
    } = body;
    
    // Validate required fields
    if (!title?.en || !title?.ta) {
      return NextResponse.json({ success: false, error: 'Title in both English and Tamil is required' }, { status: 400 });
    }
    if (!shortDesc?.en || !shortDesc?.ta) {
      return NextResponse.json({ success: false, error: 'Short description in both languages is required' }, { status: 400 });
    }
    if (!fullDesc?.en || !fullDesc?.ta) {
      return NextResponse.json({ success: false, error: 'Full description in both languages is required' }, { status: 400 });
    }
    if (!goals?.en || !goals?.ta) {
      return NextResponse.json({ success: false, error: 'Goals in both languages are required' }, { status: 400 });
    }
    if (!directorName?.en || !directorName?.ta) {
      return NextResponse.json({ success: false, error: 'Director name in both languages is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, error: 'Project type is required' }, { status: 400 });
    }

    const item = new ProjectItem({
      title,
      shortDesc,
      fullDesc,
      type,
      bureau,
      status,
      budget: budget !== undefined && budget !== null ? parseFloat(budget) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      goals,
      achievement,
      directorName,
      location,
      participants: typeof participants === 'number' ? participants : parseInt(participants, 10) || 0,
      heroImagePath,
      images,
      featured,
      active,
      recruitmentFormId,
      createdBy: user._id
    });
    
    await item.save();
    
    // Log admin project creation activity
    await ActivityLogger.logProjectCreation('admin', item._id, item.title?.en || 'Unknown Title');
    
    // Create notification
    await NotificationService.createProjectNotification('created', item, user._id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...item.toObject(),
        _id: item._id.toString()
      },
      message: 'Project item created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Project Items POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project item' },
      { status: 500 }
    );
  }
}

// PUT - Update project item
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { _id, startDate, endDate, budget, participants, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Project item ID is required' },
        { status: 400 }
      );
    }
    
    // Handle date conversions
    if (startDate) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }
    
    // Handle numeric conversions
    if (budget !== undefined) {
      updateData.budget = parseFloat(budget);
    }
    if (participants !== undefined) {
      updateData.participants = parseInt(participants, 10) || 0;
    }
    
    const item = await ProjectItem.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Project item not found' },
        { status: 404 }
      );
    }
    
    // Log admin project item update activity
    await ActivityLogger.logProjectUpdate('admin', item._id, item.title?.en || 'Unknown Title');
    
    return NextResponse.json({
      success: true,
      data: {
        ...item.toObject(),
        _id: item._id.toString()
      },
      message: 'Project item updated successfully'
    });
  } catch (error: any) {
    console.error('Admin Project Items PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update project item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete project item
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Project item ID is required' },
        { status: 400 }
      );
    }
    
    const item = await ProjectItem.findByIdAndDelete(id);
    
    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Project item not found' },
        { status: 404 }
      );
    }
    
    // Clean up project item's upload directory
    try {
      const projectUploadDir = `uploads/projectitems/${id}`;
      FileHandler.deleteDirectory(projectUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup project item directory:', cleanupError);
    }

    // Log admin project item deletion activity
    await ActivityLogger.logProjectDeletion('admin', item._id, item.title?.en || 'Unknown Title');
    
    return NextResponse.json({
      success: true,
      message: 'Project item deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin Project Items DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete project item' },
      { status: 500 }
    );
  }
}