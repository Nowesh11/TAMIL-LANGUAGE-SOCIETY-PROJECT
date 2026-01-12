import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RecruitmentForm from '@/models/RecruitmentForm';
import RecruitmentResponse from '@/models/RecruitmentResponse';
import ProjectItem from '@/models/ProjectItem';
import { getUserFromAccessToken } from '@/lib/auth';
import { FileHandler } from '@/lib/fileHandler';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive') || '';
    const projectItemId = searchParams.get('projectItemId') || '';
    const skip = (page - 1) * limit;

    const query: any = {};
    if (search) {
      query.$or = [
        { 'title.en': { $regex: search, $options: 'i' } },
        { 'title.ta': { $regex: search, $options: 'i' } },
        { 'description.en': { $regex: search, $options: 'i' } },
        { 'description.ta': { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (isActive) query.isActive = isActive === 'true';
    if (projectItemId) query.projectItemId = projectItemId;

    const total = await RecruitmentForm.countDocuments(query);
    const forms = await RecruitmentForm.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formatted = await Promise.all(forms.map(async (f: any) => {
      // Dynamic count to ensure accuracy
      const realCount = await RecruitmentResponse.countDocuments({ formRef: f._id });
      
      return {
        ...f,
        _id: f._id.toString(),
        currentResponses: realCount, // Override with real count
        createdAt: f.createdAt?.toISOString(),
        updatedAt: f.updatedAt?.toISOString(),
        startDate: f.startDate?.toISOString(),
        endDate: f.endDate?.toISOString()
      };
    }));

    // Calculate stats
    const totalForms = await RecruitmentForm.countDocuments();
    const activeForms = await RecruitmentForm.countDocuments({ isActive: true });
    const totalSubmissions = await RecruitmentResponse.countDocuments();
    // Avg fields calculation might be expensive to do on every list call, 
    // but for now we can just return 0 or do an aggregation if needed. 
    // Let's do a simple aggregation for avg fields if strictly needed, or skip it.
    // The UI expects avgFields.
    const avgFieldsResult = await RecruitmentForm.aggregate([
      { $project: { numberOfFields: { $size: "$fields" } } },
      { $group: { _id: null, avgFields: { $avg: "$numberOfFields" } } }
    ]);
    const avgFields = avgFieldsResult.length > 0 ? Math.round(avgFieldsResult[0].avgFields) : 0;

    const stats = {
      total: totalForms,
      active: activeForms,
      totalSubmissions,
      avgFields
    };

    return NextResponse.json({
      success: true,
      data: formatted,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.error('Admin Recruitment Forms GET error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch recruitment forms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    let body: any = {};
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) body = await request.json();
    else body = JSON.parse(await request.text());

    const {
      title,
      description,
      role = 'participants',
      projectItemId,
      fields = [],
      image,
      isActive = true,
      startDate,
      endDate,
      maxResponses,
      emailNotification
    } = body;

    const titleObj = typeof title === 'string' ? { en: title, ta: title } : title;
    if (!titleObj?.en || !titleObj?.ta) {
      return NextResponse.json({ success: false, error: 'Title in both languages is required' }, { status: 400 });
    }
    const descObj = typeof description === 'string' ? { en: description, ta: description } : description;

    const normalizedFields = Array.isArray(fields) ? fields.map((fld: any, idx: number) => ({
      id: fld.id || `${Date.now()}-${idx}`,
      label: typeof fld.label === 'string' ? { en: fld.label, ta: fld.label } : fld.label,
      type: fld.type || 'text',
      options: Array.isArray(fld.options) ? fld.options.map((opt: any) => (
        typeof opt === 'string' ? { en: opt, ta: opt, value: opt } : opt
      )) : undefined,
      required: !!fld.required,
      order: typeof fld.order === 'number' ? fld.order : idx + 1,
      placeholder: fld.placeholder
        ? (typeof fld.placeholder === 'string' ? { en: fld.placeholder, ta: fld.placeholder } : fld.placeholder)
        : undefined,
      validation: fld.validation || {}
    })) : [];

    // Check for date overlap
    if (projectItemId) {
      const existingForms = await RecruitmentForm.find({
        projectItemId,
        isActive: true,
        $or: [
          {
            startDate: { $lte: new Date(endDate || '2099-12-31') },
            endDate: { $gte: new Date(startDate || new Date()) }
          }
        ]
      });

      if (existingForms.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Date Conflict: Another active form exists for this project in the selected date range.' 
        }, { status: 409 });
      }
    }

    const form = await RecruitmentForm.create({
      title: titleObj,
      description: descObj,
      role,
      projectItemId: projectItemId || undefined,
      fields: normalizedFields,
      image: image || undefined,
      isActive: !!isActive,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      maxResponses: maxResponses !== undefined && maxResponses !== null ? parseInt(maxResponses, 10) : undefined,
      currentResponses: 0,
      emailNotification: !!emailNotification,
      createdBy: user._id
    });

    if (projectItemId) {
      await ProjectItem.updateMany({ recruitmentFormId: form._id }, { $unset: { recruitmentFormId: 1 } });
      await ProjectItem.findByIdAndUpdate(projectItemId, { recruitmentFormId: form._id });
    }

    return NextResponse.json({ success: true, data: { ...form.toObject(), _id: form._id.toString() } }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Recruitment Forms POST error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to create recruitment form' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { _id, projectItemId, fields, title, description, startDate, endDate, maxResponses, isActive, role, image, emailNotification, ...rest } = body;
    if (!_id) return NextResponse.json({ success: false, error: 'Form ID is required' }, { status: 400 });

    const update: any = { ...rest };
    if (title) update.title = typeof title === 'string' ? { en: title, ta: title } : title;
    if (description) update.description = typeof description === 'string' ? { en: description, ta: description } : description;
    if (typeof isActive !== 'undefined') update.isActive = !!isActive;
    if (role) update.role = role;
    if (image !== undefined) update.image = image || undefined;
    if (emailNotification !== undefined) update.emailNotification = !!emailNotification;
    if (startDate) update.startDate = new Date(startDate);
    if (endDate) update.endDate = new Date(endDate);
    if (typeof maxResponses !== 'undefined') update.maxResponses = maxResponses !== null ? parseInt(maxResponses, 10) : undefined;
    if (Array.isArray(fields)) {
      update.fields = fields.map((fld: any, idx: number) => ({
        id: fld.id || `${Date.now()}-${idx}`,
        label: typeof fld.label === 'string' ? { en: fld.label, ta: fld.label } : fld.label,
        type: fld.type || 'text',
        options: Array.isArray(fld.options) ? fld.options.map((opt: any) => (
          typeof opt === 'string' ? { en: opt, ta: opt, value: opt } : opt
        )) : undefined,
        required: !!fld.required,
        order: typeof fld.order === 'number' ? fld.order : idx + 1,
        placeholder: fld.placeholder
          ? (typeof fld.placeholder === 'string' ? { en: fld.placeholder, ta: fld.placeholder } : fld.placeholder)
          : undefined,
        validation: fld.validation || {}
      }));
    }

    if (projectItemId !== undefined) {
      update.projectItemId = projectItemId;
    }

    const form = await RecruitmentForm.findByIdAndUpdate(_id, update, { new: true, runValidators: true });
    if (!form) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });

    if (projectItemId !== undefined) {
      await ProjectItem.updateMany({ recruitmentFormId: form._id }, { $unset: { recruitmentFormId: 1 } });
      if (projectItemId) await ProjectItem.findByIdAndUpdate(projectItemId, { recruitmentFormId: form._id });
    }

    return NextResponse.json({ success: true, data: { ...form.toObject(), _id: form._id.toString() } });
  } catch (error: any) {
    console.error('Admin Recruitment Forms PUT error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update recruitment form' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Form ID is required' }, { status: 400 });

    const form = await RecruitmentForm.findByIdAndDelete(id);
    if (!form) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });

    // Delete all associated responses
    await RecruitmentResponse.deleteMany({ formRef: form._id });

    await ProjectItem.updateMany({ recruitmentFormId: form._id }, { $unset: { recruitmentFormId: 1 } });

    // Clean up recruitment form's upload directory
    try {
      const formUploadDir = `uploads/recruitment-forms/${id}`;
      FileHandler.deleteDirectory(formUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup recruitment form directory:', cleanupError);
    }

    return NextResponse.json({ success: true, message: 'Recruitment form deleted successfully' });
  } catch (error: any) {
    console.error('Admin Recruitment Forms DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete recruitment form' }, { status: 500 });
  }
}