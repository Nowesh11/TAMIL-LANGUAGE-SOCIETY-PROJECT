import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import RecruitmentForm from '../../../models/RecruitmentForm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const available = searchParams.get('available');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (available === 'true') {
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
      query.status = 'active';
    }

    // Get total count for pagination
    const total = await RecruitmentForm.countDocuments(query);

    // Fetch forms with pagination
    const forms = await RecruitmentForm.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Convert ObjectIds to strings
    const formattedForms = forms.map(form => ({
      ...form,
      _id: (form as any)._id.toString()
    }));

    return NextResponse.json({
      success: true,
      forms: formattedForms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recruitment forms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recruitment forms' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.role || !body.fields) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, role, fields' },
        { status: 400 }
      );
    }

    // Create new recruitment form
    const newForm = new RecruitmentForm({
      title: body.title,
      description: body.description,
      role: body.role,
      fields: body.fields,
      startDate: body.startDate || new Date(),
      endDate: body.endDate,
      maxResponses: body.maxResponses || 0,
      status: body.status || 'active'
    });

    const savedForm = await newForm.save();

    return NextResponse.json({
      success: true,
      form: {
        ...savedForm.toObject(),
        _id: savedForm._id.toString()
      },
      message: 'Recruitment form created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recruitment form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create recruitment form' },
      { status: 500 }
    );
  }
}