import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import RecruitmentResponse from '../../../../models/RecruitmentResponse';
import RecruitmentForm from '../../../../models/RecruitmentForm';
import { Types } from 'mongoose';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recruitment response ID' },
        { status: 400 }
      );
    }

    const response = await RecruitmentResponse.findById(id)
      .populate('formId', 'title role')
      .lean();
    
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Recruitment response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      response: {
        ...response,
        _id: (response as any)._id.toString(),
        formId: (response as any).formId ? {
          ...(response as any).formId,
          _id: (response as any).formId._id.toString()
        } : (response as any).formId
      }
    });
  } catch (error) {
    console.error('Error fetching recruitment response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recruitment response' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await req.json();
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recruitment response ID' },
        { status: 400 }
      );
    }

    const updatedResponse = await RecruitmentResponse.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('formId', 'title role')
    .lean();
    
    if (!updatedResponse) {
      return NextResponse.json(
        { success: false, error: 'Recruitment response not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      response: {
        ...updatedResponse,
        _id: (updatedResponse as any)._id.toString(),
        formId: (updatedResponse as any).formId ? {
          ...(updatedResponse as any).formId,
          _id: (updatedResponse as any).formId._id.toString()
        } : (updatedResponse as any).formId
      },
      message: 'Recruitment response updated successfully'
    });
  } catch (error) {
    console.error('Error updating recruitment response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recruitment response' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid recruitment response ID' },
        { status: 400 }
      );
    }

    const deletedResponse = await RecruitmentResponse.findByIdAndDelete(id).lean();
    
    if (!deletedResponse) {
      return NextResponse.json(
        { success: false, error: 'Recruitment response not found' },
        { status: 404 }
      );
    }

    // Decrement the response count in the associated form
    if ((deletedResponse as any).formRef) {
      await RecruitmentForm.findByIdAndUpdate((deletedResponse as any).formRef, { 
        $inc: { currentResponses: -1 } 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recruitment response deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recruitment response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recruitment response' },
      { status: 500 }
    );
  }
}