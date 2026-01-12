import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
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
        { success: false, error: 'Invalid recruitment form ID' },
        { status: 400 }
      );
    }

    const form = await RecruitmentForm.findById(id).lean();
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      form: {
        ...form,
        _id: (form as any)._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching recruitment form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recruitment form' },
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
        { success: false, error: 'Invalid recruitment form ID' },
        { status: 400 }
      );
    }

    const updatedForm = await RecruitmentForm.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedForm) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      form: {
        ...updatedForm,
        _id: (updatedForm as any)._id.toString()
      },
      message: 'Recruitment form updated successfully'
    });
  } catch (error) {
    console.error('Error updating recruitment form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recruitment form' },
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
        { success: false, error: 'Invalid recruitment form ID' },
        { status: 400 }
      );
    }

    const deletedForm = await RecruitmentForm.findByIdAndDelete(id).lean();
    
    if (!deletedForm) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recruitment form deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recruitment form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recruitment form' },
      { status: 500 }
    );
  }
}