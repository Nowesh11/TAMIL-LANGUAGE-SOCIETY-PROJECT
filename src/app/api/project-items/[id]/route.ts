import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import ProjectItem from '../../../../models/ProjectItem';
import mongoose, { Types } from 'mongoose';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid project item ID'
      }, { status: 400 });
    }
    
    const item = await ProjectItem.findById(id)
      .populate('createdBy', 'name email')
      .populate('recruitmentFormId')
      .lean();
    
    if (!item) {
      return NextResponse.json({
        success: false,
        error: 'Project item not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      item: {
        ...item,
        _id: String((item as any)._id),
        createdBy: (item as any).createdBy ? String((item as any).createdBy._id) : undefined,
        createdByName: (item as any).createdBy?.name,
        recruitmentFormId: (item as any).recruitmentFormId ? String((item as any).recruitmentFormId) : undefined
      }
    });
  } catch (error) {
    console.error('GET /api/project-items/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch project item'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid project item ID'
      }, { status: 400 });
    }
    
    const updatedItem = await ProjectItem.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').lean();
    
    if (!updatedItem) {
      return NextResponse.json({
        success: false,
        error: 'Project item not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      item: {
        ...updatedItem,
        _id: String((updatedItem as any)._id),
        createdBy: (updatedItem as any).createdBy ? String((updatedItem as any).createdBy._id) : undefined,
        createdByName: (updatedItem as any).createdBy?.name
      }
    });
  } catch (error) {
    console.error('PUT /api/project-items/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update project item'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid project item ID'
      }, { status: 400 });
    }
    
    const deletedItem = await ProjectItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return NextResponse.json({
        success: false,
        error: 'Project item not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Project item deleted successfully'
    });
  } catch (error) {
    console.error('DELETE /api/project-items/[id] error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project item'
    }, { status: 500 });
  }
}