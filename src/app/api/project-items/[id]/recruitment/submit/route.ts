import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../../lib/mongodb';
import ProjectItem from '../../../../../../models/ProjectItem';
import RecruitmentForm from '../../../../../../models/RecruitmentForm';
import RecruitmentResponse from '../../../../../../models/RecruitmentResponse';
import { NotificationService } from '../../../../../../lib/notificationService';
import { getUserFromAccessToken } from '../../../../../../lib/auth';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
    // Require authentication for recruitment submissions
    const user = await getUserFromAccessToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required for recruitment submissions' },
        { status: 401 }
      );
    }
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.applicantName || !body.applicantEmail || !body.answers) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: applicantName, applicantEmail, answers' },
        { status: 400 }
      );
    }

    // Find the project item
    const projectItem = await ProjectItem.findById(id);
    
    if (!projectItem) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Find recruitment form for this project
    if (!projectItem.recruitmentFormId) {
      return NextResponse.json(
        { success: false, error: 'No recruitment form available for this project' },
        { status: 404 }
      );
    }

    const form = await RecruitmentForm.findById(projectItem.recruitmentFormId);
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form not found' },
        { status: 404 }
      );
    }

    // Check if form is active and open for submissions
    const now = new Date();
    
    if (!form.isActive) {
      return NextResponse.json(
        { success: false, error: 'Recruitment form is not active' },
        { status: 400 }
      );
    }

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

    if (form.maxResponses && form.currentResponses >= form.maxResponses) {
      return NextResponse.json(
        { success: false, error: 'Maximum responses reached for this form' },
        { status: 400 }
      );
    }

    // Check if user has already submitted for this form
    const existingResponse = await RecruitmentResponse.findOne({
      formRef: form._id,
      userRef: user._id
    });

    if (existingResponse) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted an application for this recruitment' },
        { status: 400 }
      );
    }

    // Convert answers array to object format
    const answersObject: { [key: string]: any } = {};
    if (Array.isArray(body.answers)) {
      body.answers.forEach((answer: { key: string; value: any }) => {
        answersObject[answer.key] = answer.value;
      });
    } else {
      Object.assign(answersObject, body.answers);
    }

    // Create new recruitment response with user reference
    const newResponse = new RecruitmentResponse({
      formRef: form._id,
      projectItemRef: projectItem._id,
      userRef: user._id, // Add user reference
      roleApplied: form.role || 'participant',
      answers: answersObject,
      applicantEmail: body.applicantEmail,
      applicantName: body.applicantName,
      status: 'pending',
      submittedAt: new Date()
    });

    const savedResponse = await newResponse.save();

    // Update form's current response count
    await RecruitmentForm.findByIdAndUpdate(
      form._id,
      { $inc: { currentResponses: 1 } }
    );

    // Send notification for successful recruitment application
    try {
      await NotificationService.createNotification({
        title: {
          en: 'Application Submitted Successfully',
          ta: 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது'
        },
        message: {
          en: `Your application for "${projectItem.title?.en || projectItem.title}" has been submitted successfully. We will review your application and get back to you soon.`,
          ta: `"${projectItem.title?.ta || projectItem.title}" க்கான உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. நாங்கள் உங்கள் விண்ணப்பத்தை மதிப்பாய்வு செய்து விரைவில் உங்களைத் தொடர்பு கொள்வோம்.`
        },
        type: 'success',
        priority: 'medium',
        targetAudience: 'specific',
        userRef: user._id, // Send to authenticated user
        actionUrl: `/projects/${projectItem._id}`,
        actionText: {
          en: 'View Project',
          ta: 'திட்டத்தைப் பார்க்க'
        },
        sendEmail: true,
        createdBy: user._id
      });
    } catch (notificationError) {
      console.error('Failed to send recruitment notification:', notificationError);
      // Don't fail the main request if notification fails
    }

    return NextResponse.json({
      ok: true,
      success: true,
      response: {
        _id: savedResponse._id.toString(),
        status: savedResponse.status,
        submittedAt: savedResponse.submittedAt
      },
      message: 'Application submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting recruitment application:', error);
    return NextResponse.json(
      { ok: false, success: false, error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}