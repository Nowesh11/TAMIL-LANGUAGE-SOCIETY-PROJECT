import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import Component from '../../../../../models/Component';
import { ActivityLogger } from '../../../../../lib/activityLogger';
import { getUserFromAccessToken } from '../../../../../lib/auth';
import { FileHandler } from '../../../../../lib/fileHandler';

export const runtime = 'nodejs';

// PATCH - Update specific component
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    // Find existing component
    const existingComponent = await Component.findById(id);
    if (!existingComponent) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Update component with provided fields (exclude createdBy to prevent overwriting)
    const { createdBy, ...bodyWithoutCreatedBy } = body;
    const updateData = {
      ...bodyWithoutCreatedBy,
      updatedBy: user._id
    };
    
    // Validate bilingual content if updating content
    if (body.content && (existingComponent.type === 'hero' || existingComponent.type === 'text' || existingComponent.type === 'card')) {
      if (body.content.title && (!body.content.title.en || !body.content.title.ta)) {
        return NextResponse.json(
          { success: false, error: 'Title in both languages is required for this component type' },
          { status: 400 }
        );
      }
    }
    
    const updatedComponent = await Component.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
     .populate('updatedBy', 'name email');
    
    // Log activity
    await ActivityLogger.log({
      userId: user._id.toString(),
      userType: 'admin',
      entityType: 'component',
      entityId: id,
      action: 'updated',
      description: `Updated ${updatedComponent.type} component for ${updatedComponent.page} page`
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedComponent.toObject(),
        _id: updatedComponent._id.toString(),
        createdBy: updatedComponent.createdBy ? {
          _id: updatedComponent.createdBy._id?.toString(),
          name: updatedComponent.createdBy.name,
          email: updatedComponent.createdBy.email
        } : null,
        updatedBy: updatedComponent.updatedBy ? {
          _id: updatedComponent.updatedBy._id?.toString(),
          name: updatedComponent.updatedBy.name,
          email: updatedComponent.updatedBy.email
        } : null,
        createdAt: updatedComponent.createdAt?.toISOString(),
        updatedAt: updatedComponent.updatedAt?.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Admin Component PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update component' },
      { status: 500 }
    );
  }
}

// DELETE - Delete specific component
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Find component before deletion for logging
    const component = await Component.findById(id);
    if (!component) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Delete component
    await Component.findByIdAndDelete(id);
    
    // Clean up component's upload directory
    try {
      const componentUploadDir = `uploads/components/${component.type}/${id}`;
      FileHandler.deleteDirectory(componentUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup component directory:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }
    
    // Log activity
    await ActivityLogger.log({
      userId: user._id.toString(),
      userType: 'admin',
      entityType: 'component',
      entityId: id,
      action: 'deleted',
      description: `Deleted ${component.type} component from ${component.page} page`
    });
    
    return NextResponse.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin Component DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete component' },
      { status: 500 }
    );
  }
}