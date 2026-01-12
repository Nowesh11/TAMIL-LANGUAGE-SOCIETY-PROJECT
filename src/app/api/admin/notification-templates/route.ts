import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NotificationTemplate from '@/models/NotificationTemplate';
import { getUserFromAccessToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await NotificationTemplate.find().sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({
      success: true,
      data: templates.map(t => ({
        ...t,
        _id: (t as any)._id.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const template = await NotificationTemplate.create(body);

    return NextResponse.json({
      success: true,
      data: {
        ...template.toObject(),
        _id: template._id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ success: false, error: 'Failed to create template' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await NotificationTemplate.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
