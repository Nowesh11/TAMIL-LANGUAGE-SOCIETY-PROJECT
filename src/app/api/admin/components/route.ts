import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import Component from '../../../../models/Component';
import { ActivityLogger } from '../../../../lib/activityLogger';
import { getUserFromAccessToken } from '../../../../lib/auth';
import { FileHandler } from '../../../../lib/fileHandler';

export const runtime = 'nodejs';

// Helper function to ensure bilingual content structure
function ensureBilingual(content: any): any {
  if (!content || typeof content !== 'object') {
    return content;
  }

  const ensuredContent = { ...content };

  // Ensure bilingual text fields
  const bilingualFields = ['title', 'text', 'name', 'heading'];
  bilingualFields.forEach(field => {
    if (ensuredContent[field]) {
      if (typeof ensuredContent[field] === 'string') {
        ensuredContent[field] = { en: ensuredContent[field], ta: ensuredContent[field] };
      } else if (typeof ensuredContent[field] === 'object') {
        ensuredContent[field] = {
          en: ensuredContent[field].en || '',
          ta: ensuredContent[field].ta || ''
        };
      }
    }
  });

  // Ensure bilingual arrays
  if (ensuredContent.features && Array.isArray(ensuredContent.features)) {
    ensuredContent.features = ensuredContent.features.map((feature: any) => ({
      ...feature,
      title: feature.title ? (typeof feature.title === 'string' ? 
        { en: feature.title, ta: feature.title } : 
        { en: feature.title.en || '', ta: feature.title.ta || '' }) : { en: '', ta: '' },
      description: feature.description ? (typeof feature.description === 'string' ? 
        { en: feature.description, ta: feature.description } : 
        { en: feature.description.en || '', ta: feature.description.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.stats && Array.isArray(ensuredContent.stats)) {
    ensuredContent.stats = ensuredContent.stats.map((stat: any) => ({
      ...stat,
      label: stat.label ? (typeof stat.label === 'string' ? 
        { en: stat.label, ta: stat.label } : 
        { en: stat.label.en || '', ta: stat.label.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.faqs && Array.isArray(ensuredContent.faqs)) {
    ensuredContent.faqs = ensuredContent.faqs.map((faq: any) => ({
      ...faq,
      question: faq.question ? (typeof faq.question === 'string' ? 
        { en: faq.question, ta: faq.question } : 
        { en: faq.question.en || '', ta: faq.question.ta || '' }) : { en: '', ta: '' },
      answer: faq.answer ? (typeof faq.answer === 'string' ? 
        { en: faq.answer, ta: faq.answer } : 
        { en: faq.answer.en || '', ta: faq.answer.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.links && Array.isArray(ensuredContent.links)) {
    ensuredContent.links = ensuredContent.links.map((link: any) => ({
      ...link,
      text: link.text ? (typeof link.text === 'string' ? 
        { en: link.text, ta: link.text } : 
        { en: link.text.en || '', ta: link.text.ta || '' }) : { en: '', ta: '' }
    }));
  }

  if (ensuredContent.testimonials && Array.isArray(ensuredContent.testimonials)) {
    ensuredContent.testimonials = ensuredContent.testimonials.map((testimonial: any) => ({
      ...testimonial,
      name: testimonial.name ? (typeof testimonial.name === 'string' ? 
        { en: testimonial.name, ta: testimonial.name } : 
        { en: testimonial.name.en || '', ta: testimonial.name.ta || '' }) : { en: '', ta: '' },
      text: testimonial.text ? (typeof testimonial.text === 'string' ? 
        { en: testimonial.text, ta: testimonial.text } : 
        { en: testimonial.text.en || '', ta: testimonial.text.ta || '' }) : { en: '', ta: '' },
      position: testimonial.position ? (typeof testimonial.position === 'string' ? 
        { en: testimonial.position, ta: testimonial.position } : 
        { en: testimonial.position.en || '', ta: testimonial.position.ta || '' }) : { en: '', ta: '' }
    }));
  }

  return ensuredContent;
}

// GET - Fetch all components for admin with comprehensive filtering
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const pageFilter = searchParams.get('pageFilter') || '';
    const bureau = searchParams.get('bureau') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'content.title.en': { $regex: search, $options: 'i' } },
        { 'content.title.ta': { $regex: search, $options: 'i' } },
        { 'content.description.en': { $regex: search, $options: 'i' } },
        { 'content.description.ta': { $regex: search, $options: 'i' } },
        { 'content.subtitle.en': { $regex: search, $options: 'i' } },
        { 'content.subtitle.ta': { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { page: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    if (type) {
      query.type = type;
    }
    
    if (pageFilter) {
      query.page = pageFilter;
    }
    
    if (bureau) {
      query.bureau = bureau;
    }
    
    // Get total count
    const total = await Component.countDocuments(query);
    
    // Build sort object
    const sort: any = {};
    if (sortBy === 'order') {
      sort.order = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'type') {
      sort.type = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'page') {
      sort.page = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }
    
    // Fetch components with population
    const components = await Component.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format response
    const formattedComponents = components.map((component: any) => ({
      ...component,
      _id: component._id.toString(),
      content: ensureBilingual(component.content),
      createdBy: component.createdBy ? {
        _id: component.createdBy._id?.toString(),
        name: component.createdBy.name,
        email: component.createdBy.email
      } : null,
      updatedBy: component.updatedBy ? {
        _id: component.updatedBy._id?.toString(),
        name: component.updatedBy.name,
        email: component.updatedBy.email
      } : null,
      createdAt: component.createdAt?.toISOString(),
      updatedAt: component.updatedAt?.toISOString()
    }));
    
    // Get stats for dashboard
    const stats = await Promise.all([
      Component.countDocuments({ isActive: true }),
      Component.countDocuments({ isActive: false }),
      Component.distinct('type').then(types => types.length),
      Component.distinct('page').then(pages => pages.length),
      Component.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Component.aggregate([
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      // Detailed page stats with active/inactive counts
      Component.aggregate([
        {
          $group: {
            _id: '$page',
            count: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            inactive: { $sum: { $cond: ['$isActive', 0, 1] } }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // Category stats
      Component.aggregate([
        { $match: { category: { $exists: true, $nin: [null, ''] } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    return NextResponse.json({
      success: true,
      data: formattedComponents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        totalActive: stats[0],
        totalInactive: stats[1],
        totalTypes: stats[2],
        totalPages: stats[3],
        topTypes: stats[4],
        topPages: stats[5],
        pageStats: stats[6],
        categories: stats[7]
      }
    });
  } catch (error: any) {
    console.error('Admin Components GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch components' },
      { status: 500 }
    );
  }
}

// POST - Create new component
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      type, 
      page, 
      bureau, 
      content, 
      order, 
      isActive = true, 
      cssClasses, 
      customStyles, 
      visibility, 
      animation, 
      seo 
    } = body;
    
    // Validate required fields
    if (!type || !page || !content) {
      return NextResponse.json(
        { success: false, error: 'Type, page, and content are required' },
        { status: 400 }
      );
    }
    
    // Validate bilingual content based on type
    if (type === 'hero' || type === 'text' || type === 'card') {
      if (!content.title?.en || !content.title?.ta) {
        return NextResponse.json(
          { success: false, error: 'Title in both languages is required for this component type' },
          { status: 400 }
        );
      }
    }
    
    // Create component
    const component = new Component({
      type,
      page,
      bureau,
      content,
      order: order || 0,
      isActive,
      cssClasses,
      customStyles,
      visibility: visibility || { desktop: true, tablet: true, mobile: true },
      animation,
      seo,
      createdBy: user._id,
      updatedBy: user._id
    });
    
    await component.save();
    
    // Log activity
    await ActivityLogger.log({
      userId: user._id.toString(),
      userType: 'admin',
      entityType: 'component',
      entityId: component._id.toString(),
      action: 'created',
      description: `Created ${type} component for ${page} page`
    });
    
    // Populate the response
    await component.populate('createdBy', 'name email');
    await component.populate('updatedBy', 'name email');
    
    return NextResponse.json({
      success: true,
      data: {
        ...component.toObject(),
        _id: component._id.toString(),
        createdBy: component.createdBy ? {
          _id: component.createdBy._id?.toString(),
          name: component.createdBy.name,
          email: component.createdBy.email
        } : null,
        updatedBy: component.updatedBy ? {
          _id: component.updatedBy._id?.toString(),
          name: component.updatedBy.name,
          email: component.updatedBy.email
        } : null,
        createdAt: component.createdAt?.toISOString(),
        updatedAt: component.updatedAt?.toISOString()
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Components POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create component' },
      { status: 500 }
    );
  }
}

// PUT - Update existing component
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      id, 
      type, 
      page, 
      bureau, 
      content, 
      order, 
      isActive, 
      cssClasses, 
      customStyles, 
      visibility, 
      animation, 
      seo 
    } = body;
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Component ID is required' },
        { status: 400 }
      );
    }
    
    // Find existing component
    const existingComponent = await Component.findById(id);
    if (!existingComponent) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Validate bilingual content based on type
    if (type && (type === 'hero' || type === 'text' || type === 'card')) {
      if (content && (!content.title?.en || !content.title?.ta)) {
        return NextResponse.json(
          { success: false, error: 'Title in both languages is required for this component type' },
          { status: 400 }
        );
      }
    }
    
    // Update component
    const updateData: any = {
      updatedBy: user._id,
      updatedAt: new Date()
    };
    
    if (type !== undefined) updateData.type = type;
    if (page !== undefined) updateData.page = page;
    if (bureau !== undefined) updateData.bureau = bureau;
    if (content !== undefined) updateData.content = content;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (cssClasses !== undefined) updateData.cssClasses = cssClasses;
    if (customStyles !== undefined) updateData.customStyles = customStyles;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (animation !== undefined) updateData.animation = animation;
    if (seo !== undefined) updateData.seo = seo;
    
    const updatedComponent = await Component.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').populate('updatedBy', 'name email');
    
    if (!updatedComponent) {
      return NextResponse.json(
        { success: false, error: 'Failed to update component' },
        { status: 500 }
      );
    }
    
    // Log activity
    await ActivityLogger.log({
      userId: user._id.toString(),
      userType: 'admin',
      entityType: 'component',
      entityId: id,
      action: 'updated',
      description: `Updated ${updatedComponent.type} component for ${updatedComponent.page} page`
    });
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedComponent.toObject(),
        _id: updatedComponent._id.toString(),
        createdBy: updatedComponent.createdBy ? {
          _id: updatedComponent.createdBy._id?.toString(),
          name: updatedComponent.createdBy.name,
          email: updatedComponent.createdBy.email
        } : null,
        updatedBy: updatedComponent.updatedBy ? {
          _id: updatedComponent.updatedBy._id?.toString(),
          name: updatedComponent.updatedBy.name,
          email: updatedComponent.updatedBy.email
        } : null,
        createdAt: updatedComponent.createdAt?.toISOString(),
        updatedAt: updatedComponent.updatedAt?.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Admin Components PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update component' },
      { status: 500 }
    );
  }
}

// DELETE - Delete component
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    
    // Verify admin access
    const user = await getUserFromAccessToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Component ID is required' },
        { status: 400 }
      );
    }
    
    // Find component before deletion for logging
    const component = await Component.findById(id);
    if (!component) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }
    
    // Delete component
    await Component.findByIdAndDelete(id);
    
    // Clean up component's upload directory
    try {
      const componentUploadDir = `uploads/components/${component.type}/${id}`;
      FileHandler.deleteDirectory(componentUploadDir);
    } catch (cleanupError) {
      console.error('Failed to cleanup component directory:', cleanupError);
      // Don't fail the deletion if cleanup fails
    }
    
    // Log activity
    await ActivityLogger.log({
      userId: user._id.toString(),
      userType: 'admin',
      entityType: 'component',
      entityId: id,
      action: 'deleted',
      description: `Deleted ${component.type} component from ${component.page} page`
    });
    
    return NextResponse.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error: any) {
    console.error('Admin Components DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete component' },
      { status: 500 }
    );
  }
}