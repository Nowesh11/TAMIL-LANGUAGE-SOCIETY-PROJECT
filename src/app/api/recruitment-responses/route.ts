import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import RecruitmentResponse from '../../../models/RecruitmentResponse';
import RecruitmentForm from '../../../models/RecruitmentForm';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (formId) query.formRef = formId;
    if (status) query.status = status;

    // Get total count for pagination
    const total = await RecruitmentResponse.countDocuments(query);

    // Fetch responses with pagination and populate form details
    const responses = await RecruitmentResponse.find(query)
      .populate('formRef', 'title role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Convert ObjectIds to strings
    const formattedResponses = responses.map(response => ({
      ...response,
      _id: (response as any)._id.toString(),
      formRef: (response as any).formRef ? {
        ...(response as any).formRef,
        _id: (response as any).formRef._id.toString()
      } : (response as any).formRef
    }));

    return NextResponse.json({
      success: true,
      responses: formattedResponses,
      stats: {
        total: await RecruitmentResponse.countDocuments(),
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recruitment responses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recruitment responses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.formId || !body.answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: formId, answers' },
        { status: 400 }
      );
    }

    // Verify the recruitment form exists and is active
    const form = await RecruitmentForm.findById(body.formId);
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form not found' },
        { status: 404 }
      );
    }

    // Check if form is active
    if (form.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Recruitment form is not active' },
        { status: 400 }
      );
    }

    // Check if form has reached max responses
    if (form.maxResponses > 0) {
      const currentResponseCount = await RecruitmentResponse.countDocuments({ formRef: body.formId });
      if (currentResponseCount >= form.maxResponses) {
        return NextResponse.json(
          { success: false, error: 'Maximum responses reached for this form' },
          { status: 400 }
        );
      }
    }

    // Check if form is within date range
    const now = new Date();
    if (form.startDate && now < form.startDate) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form is not yet open' },
        { status: 400 }
      );
    }
    if (form.endDate && now > form.endDate) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form has closed' },
        { status: 400 }
      );
    }

    // Create new recruitment response
    const newResponse = new RecruitmentResponse({
      formRef: body.formId,
      answers: body.answers,
      applicantEmail: body.applicantEmail,
      applicantName: body.applicantName,
      roleApplied: form.role, // Inherit role from form
      status: 'pending'
    });

    const savedResponse = await newResponse.save();
    await RecruitmentForm.findByIdAndUpdate(body.formId, { $inc: { currentResponses: 1 } });

    return NextResponse.json({
      success: true,
      response: {
        ...savedResponse.toObject(),
        _id: savedResponse._id.toString()
      },
      message: 'Application submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating recruitment response:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
