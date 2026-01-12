import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Team from '../../../../models/Team';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { getUserFromAccessToken } from '../../../../lib/auth';
import { FileHandler } from '../../../../lib/fileHandler';
import { NotificationService } from '../../../../lib/notificationService';

export const runtime = 'nodejs';

// GET - Fetch all team members for admin
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';
    const featured = searchParams.get('featured') || '';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ta': { $regex: search, $options: 'i' } },
        { 'position.en': { $regex: search, $options: 'i' } },
        { 'position.ta': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (featured) {
      query.featured = featured === 'true';
    }
    
    // Get total count
    const total = await Team.countDocuments(query);
    
    // Get statistics
    const stats = {
      total: await Team.countDocuments(),
      active: await Team.countDocuments({ isActive: true }),
      inactive: await Team.countDocuments({ isActive: false }),
      featured: await Team.countDocuments({ isFeatured: true })
    };
    
    // Fetch team members
    const members = await Team.find(query)
      .sort({ orderNum: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format response
    const formattedMembers = members.map((member: any) => ({
      ...member,
      _id: member._id.toString(),
      imageUrl: member.imagePath ? `/api/team/image?id=${member._id}` : null,
      createdAt: member.createdAt?.toISOString(),
      updatedAt: member.updatedAt?.toISOString(),
      joinedDate: member.joinedDate?.toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedMembers,
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Admin Team GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST - Create new team member
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

    const body = await request.json();
    const {
      name,
      position,
      bio,
      email,
      phone,
      location,
      socialLinks,
      role = 'member',
      department,
      isActive = true,
      featured = false,
      orderNum = 0,
      joinedDate,
      imagePath,
      achievements = [],
      specializations = [],
      languages = []
    } = body;
    
    // Validate required fields
    if (!name?.en || !name?.ta) {
      return NextResponse.json(
        { success: false, error: 'Name in both English and Tamil is required' },
        { status: 400 }
      );
    }
    
    if (!position?.en || !position?.ta) {
      return NextResponse.json(
        { success: false, error: 'Position in both English and Tamil is required' },
        { status: 400 }
      );
    }
    
    // Generate slug from English name
    const slug = name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Create new team member
    const member = new Team({
      name,
      position,
      bio,
      email,
      phone,
      location,
      socialLinks: socialLinks || {},
      role,
      department,
      isActive,
      featured,
      orderNum,
      joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
      imagePath,
      achievements,
      specializations,
      languages,
      slug
    });
    
    await member.save();
    
    // Log admin team member creation activity
    await ActivityLogger.logTeamMemberCreation('admin', member._id, member.name?.en || 'Unknown Member');

    // Create notification
    await NotificationService.createTeamNotification('created', member, user._id);
    
    return NextResponse.json({
      success: true,
      data: {
        ...member.toObject(),
        _id: member._id.toString(),
        imageUrl: member.imagePath ? `/api/team/image?id=${member._id}` : null
      },
      message: 'Team member created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Team POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create team member' },
      { status: 500 }
    );
  }
}

// PUT - Update team member
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { _id, joinedDate, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Team member ID is required' },
        { status: 400 }
      );
    }
    
    // Handle date conversion
    if (joinedDate) {
      updateData.joinedDate = new Date(joinedDate);
    }
    
    // Update slug if name changed
    if (updateData.name?.en) {
      updateData.slug = updateData.name.en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    const member = await Team.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    // Log admin team member update activity
    await ActivityLogger.logTeamMemberUpdate('admin', member._id, member.name?.en || 'Unknown Name');
    
    return NextResponse.json({
      success: true,
      data: {
        ...member.toObject(),
        _id: member._id.toString(),
        imageUrl: member.imagePath ? `/api/team/image?id=${member._id}` : null
      },
      message: 'Team member updated successfully'
    });
  } catch (error: any) {
    console.error('Admin Team PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Team member ID is required' },
        { status: 400 }
      );
    }
    
    const member = await Team.findByIdAndDelete(id);
    
    if (!member) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    // Clean up team member's upload directory
    try {
      const teamUploadDir = `uploads/team/${id}`;
      FileHandler.deleteDirectory(teamUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup team member directory:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }
    
    // Log admin team member deletion activity
    await ActivityLogger.logTeamMemberDeletion('admin', member._id, member.name?.en || 'Unknown Name');
    
    return NextResponse.json({
      success: true,
      message: 'Team member deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin Team DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete team member' },
      { status: 500 }
    );
  }
}