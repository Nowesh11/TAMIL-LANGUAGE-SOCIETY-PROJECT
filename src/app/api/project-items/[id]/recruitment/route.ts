import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/mongodb';
import ProjectItem from '../../../../../models/ProjectItem';
import RecruitmentForm from '../../../../../models/RecruitmentForm';
import RecruitmentResponse from '../../../../../models/RecruitmentResponse';
import User from '../../../../../models/User';
import { NotificationService } from '../../../../../lib/notificationService';
import { sendEmail } from '../../../../../lib/emailService';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }

    // Find the project item
    const projectItem = await ProjectItem.findById(id).lean();
    
    if (!projectItem) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    // Find recruitment form for this project by projectItemId
    const form = await RecruitmentForm.findOne({ 
      projectItemId: id,
      isActive: true 
    }).lean();

    // If no form found, return empty response
    if (!form) {
      return NextResponse.json({
        success: true,
        form: null,
        message: 'No recruitment form available for this project'
      });
    }

    // Calculate form status
    const now = new Date();
    let status = 'inactive';
    
    if ((form as any).isActive) {
      if ((form as any).maxResponses && (form as any).currentResponses >= (form as any).maxResponses) {
        status = 'full';
      } else if ((form as any).endDate && now > (form as any).endDate) {
        status = 'expired';
      } else if ((form as any).startDate && now < (form as any).startDate) {
        status = 'upcoming';
      } else {
        status = 'open';
      }
    }

    return NextResponse.json({
      success: true,
      form: {
        _id: (form as any)._id.toString(),
        title: (form as any).title,
        description: (form as any).description,
        role: (form as any).role,
        status: status,
        fields: (form as any).fields || [],
        startDate: (form as any).startDate,
        endDate: (form as any).endDate,
        maxResponses: (form as any).maxResponses,
        currentResponses: (form as any).currentResponses
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    
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

    // Convert answers array to object format
    const answersObject: { [key: string]: any } = {};
    if (Array.isArray(body.answers)) {
      body.answers.forEach((answer: { key: string; value: any }) => {
        answersObject[answer.key] = answer.value;
      });
    } else {
      Object.assign(answersObject, body.answers);
    }

    // Create new recruitment response
    const newResponse = new RecruitmentResponse({
      formRef: form._id,
      projectItemRef: projectItem._id,
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
      // Get admin user for createdBy field
      const adminUser = await User.findOne({ role: 'admin' });
      if (!adminUser) {
        console.error('No admin user found for notification creation');
        throw new Error('Admin user required for notification');
      }

      // Create notification for admins about new recruitment
      await NotificationService.createRecruitmentNotification(
        projectItem,
        { name: body.name, email: body.applicantEmail },
        adminUser._id
      );

      // Send confirmation email to applicant
      if (body.applicantEmail) {
        await sendEmail({
          to: body.applicantEmail,
          subject: 'Application Submitted Successfully - Tamil Language Society',
          template: 'recruitment-confirmation',
          data: {
            applicantName: body.name,
            projectTitle: projectItem.title?.en || projectItem.title,
            projectUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/projects/${projectItem._id}`,
            submissionDate: new Date().toLocaleDateString()
          }
        });
      }
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