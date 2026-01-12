import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import ProjectItem from '../../../models/ProjectItem';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const bureau = searchParams.get('bureau');
    const status = searchParams.get('status') || 'active';
    const featured = searchParams.get('featured');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (bureau) query.bureau = bureau;
    if (featured === 'true') query.featured = true;

    // Get total count for pagination
    const total = await ProjectItem.countDocuments(query);

    // Fetch items with pagination
    const items = await ProjectItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Convert ObjectIds to strings
    const formattedItems = items.map(item => ({
      ...item,
      _id: (item as any)._id.toString()
    }));

    return NextResponse.json({
      success: true,
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching project items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch project items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.type || !body.title || !body.shortDesc || !body.fullDesc) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, shortDesc, fullDesc' },
        { status: 400 }
      );
    }

    // Create new project item
    const newItem = new ProjectItem({
      type: body.type,
      bureau: body.bureau,
      title: body.title,
      shortDesc: body.shortDesc,
      fullDesc: body.fullDesc,
      status: body.status || 'active',
      featured: body.featured || false,
      active: true,
      createdBy: body.createdBy
    });

    const savedItem = await newItem.save();

    return NextResponse.json({
      success: true,
      item: {
        ...savedItem.toObject(),
        _id: savedItem._id.toString()
      },
      message: 'Project item created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create project item' },
      { status: 500 }
    );
  }
}