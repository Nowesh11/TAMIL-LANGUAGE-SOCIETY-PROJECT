import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Poster from '../../../../../models/Poster';
import { ActivityLogger } from '../../../../../lib/activityLogger';

export const runtime = 'nodejs';

// PATCH - Toggle poster status
export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { id, isActive } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Poster ID is required' },
        { status: 400 }
      );
    }
    
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }
    
    const poster = await Poster.findByIdAndUpdate(
      id,
      { isActive, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!poster) {
      return NextResponse.json(
        { success: false, error: 'Poster not found' },
        { status: 404 }
      );
    }
    
    // Log admin poster status toggle activity
    await ActivityLogger.logPosterUpdate(
      'admin', 
      poster._id, 
      `${poster.title?.en || 'Unknown Title'} - Status: ${isActive ? 'Activated' : 'Deactivated'}`
    );
    
    return NextResponse.json({
      success: true,
      data: {
        ...poster.toObject(),
        _id: poster._id.toString(),
        imageUrl: poster.imagePath ? `/api/posters/image?id=${poster._id}` : null
      },
      message: `Poster ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error: any) {
    console.error('Admin Posters Toggle Status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle poster status' },
      { status: 500 }
    );
  }
}