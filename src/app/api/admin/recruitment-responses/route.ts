import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import RecruitmentResponse from '@/models/RecruitmentResponse'
import RecruitmentForm from '@/models/RecruitmentForm'
import { getUserFromAccessToken } from '@/lib/auth'
import { FileHandler } from '@/lib/fileHandler'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    const user = await getUserFromAccessToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || '20')))
    const formId = searchParams.get('formId') || undefined
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') || undefined
    const q = (searchParams.get('search') || '').trim()
    const skip = (page - 1) * limit

  const filter: any = {}
  if (formId) filter.formRef = formId
  if (status && status !== 'all') {
    const statusMap: Record<string, string> = {
      approved: 'accepted',
      shortlisted: 'waitlisted',
      pending: 'pending',
      reviewed: 'reviewed',
      rejected: 'rejected'
    }
    filter.status = statusMap[status] || status
  }

  const searchOr = q
    ? [
        { applicantName: { $regex: q, $options: 'i' } },
        { applicantEmail: { $regex: q, $options: 'i' } }
      ]
    : undefined

  const findConditions: any = searchOr ? { ...filter, $or: searchOr } : filter
  let query = RecruitmentResponse.find(findConditions)

  const total = await RecruitmentResponse.countDocuments(findConditions)

    // Get statistics
  const stats = {
    total: await RecruitmentResponse.countDocuments(),
    pending: await RecruitmentResponse.countDocuments({ status: 'pending' }),
    approved: await RecruitmentResponse.countDocuments({ status: 'accepted' }),
    rejected: await RecruitmentResponse.countDocuments({ status: 'rejected' }),
    shortlisted: await RecruitmentResponse.countDocuments({ status: 'waitlisted' })
  };

  const items = await query
    .sort({ submittedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('formRef', 'title')
    .lean()

  const data = items.map((r: any) => ({
    _id: String(r._id),
    formId: r.formRef ? String(r.formRef._id || r.formRef) : undefined,
    formTitle: r.formRef && r.formRef.title ? r.formRef.title : undefined,
    createdAt: r.submittedAt,
    submitterName: r.applicantName,
    submitterEmail: r.applicantEmail,
    submitterPhone: r.answers?.phone,
    status: r.status,
    priority: r.priority,
    rating: r.rating,
    reviewNotes: r.reviewNotes,
    reviewedBy: r.reviewedBy ? String(r.reviewedBy) : undefined,
    reviewedAt: r.reviewedAt,
    responses: r.answers || {},
    attachments: [],
    ipAddress: r.ipAddress,
    userAgent: r.userAgent
  }))

    return NextResponse.json({
      success: true,
      data,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch recruitment responses' }, { status: 500 })
  }
}

import { NotificationService } from '@/lib/notificationService'

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    const user = await getUserFromAccessToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { id, status, rating, reviewNotes, priority } = body
    if (!id) {
      return NextResponse.json({ success: false, error: 'Response ID required' }, { status: 400 })
    }
    
    // Get original document to check status change
    const originalDoc = await RecruitmentResponse.findById(id).populate('formRef');
    if (!originalDoc) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 })
    }

    const update: any = {}
    if (status) update.status = status
    if (typeof rating !== 'undefined') update.rating = rating
    if (typeof reviewNotes !== 'undefined') update.reviewNotes = reviewNotes
    if (priority) update.priority = priority
    update.reviewedBy = user._id
    update.reviewedAt = new Date()
    
    const doc = await RecruitmentResponse.findByIdAndUpdate(id, { $set: update }, { new: true }).populate('formRef')
    
    // Send notification if status changed
    if (status && status !== originalDoc.status && doc.userRef) {
      try {
        const formTitle = doc.formRef?.title?.en || doc.formRef?.title || 'Recruitment';
        
        const statusConfigs: Record<string, { title: any, message: any, type: any }> = {
          accepted: {
            title: { en: 'Application Approved', ta: 'விண்ணப்பம் அங்கீகரிக்கப்பட்டது' },
            message: { 
              en: `Your application for "${formTitle}" has been approved.`, 
              ta: `"${formTitle}" க்கான உங்கள் விண்ணப்பம் அங்கீகரிக்கப்பட்டது.` 
            },
            type: 'success'
          },
          rejected: {
            title: { en: 'Application Update', ta: 'விண்ணப்பம் புதுப்பிக்கப்பட்டது' },
            message: { 
              en: `Your application for "${formTitle}" has been reviewed and rejected.`, 
              ta: `"${formTitle}" க்கான உங்கள் விண்ணப்பம் பரிசீலிக்கப்பட்டு நிராகரிக்கப்பட்டது.` 
            },
            type: 'error'
          },
          waitlisted: {
            title: { en: 'Application Shortlisted', ta: 'விண்ணப்பம் தேர்வு செய்யப்பட்டது' },
            message: { 
              en: `Your application for "${formTitle}" has been shortlisted.`, 
              ta: `"${formTitle}" க்கான உங்கள் விண்ணப்பம் தேர்வு செய்யப்பட்டுள்ளது.` 
            },
            type: 'info'
          }
        };

        const config = statusConfigs[status] || {
          title: { en: 'Application Updated', ta: 'விண்ணப்பம் புதுப்பிக்கப்பட்டது' },
          message: { en: `Your application for "${formTitle}" status is now ${status}.`, ta: `"${formTitle}" க்கான உங்கள் விண்ணப்பத்தின் நிலை இப்போது ${status}.` },
          type: 'info'
        };
        
        await NotificationService.createNotification({
          title: config.title,
          message: config.message,
          type: config.type,
          priority: 'high',
          targetAudience: 'specific',
          userRef: doc.userRef,
          actionUrl: `/profile/applications`, 
          actionText: {
            en: 'View Status',
            ta: 'நிலையைப் பார்க்க'
          },
          tags: ['recruitment', 'application', status],
          sendEmail: false, 
          createdBy: user._id
        });
      } catch (notifError) {
        console.error('Failed to send status notification:', notifError);
      }
    }

    return NextResponse.json({ success: true, data: { _id: String(doc._id), ...doc.toObject() } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update response' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect()
    const user = await getUserFromAccessToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Response ID required' }, { status: 400 })
    }
    const removed = await RecruitmentResponse.findByIdAndDelete(id)
    if (!removed) {
      return NextResponse.json({ success: false, error: 'Response not found' }, { status: 404 })
    }

    // Decrement the response count in the associated form
    if (removed.formRef) {
      await RecruitmentForm.findByIdAndUpdate(removed.formRef, { 
        $inc: { currentResponses: -1 } 
      });
    }

    // Clean up response's upload directory
    try {
      const responseUploadDir = `uploads/recruitment/${id}`;
      FileHandler.deleteDirectory(responseUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup response directory:', cleanupError);
    }

    return NextResponse.json({ success: true, message: 'Response deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete response' }, { status: 500 })
  }
}
