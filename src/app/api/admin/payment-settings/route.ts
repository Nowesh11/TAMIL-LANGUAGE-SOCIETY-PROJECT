import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import PaymentSettings from '../../../../models/PaymentSettings';

export const runtime = 'nodejs';

// GET - Fetch payment settings with admin details
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const paymentMethod = url.searchParams.get('paymentMethod') || 'all';
    const maintenanceMode = url.searchParams.get('maintenanceMode') || 'all';

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { supportEmail: { $regex: search, $options: 'i' } },
        { supportPhone: { $regex: search, $options: 'i' } },
        { currency: { $regex: search, $options: 'i' } },
        { 'epayum.bankName': { $regex: search, $options: 'i' } },
        { 'fpx.bankName': { $regex: search, $options: 'i' } }
      ];
    }

    if (maintenanceMode !== 'all') {
      query.isMaintenanceMode = maintenanceMode === 'true';
    }

    if (paymentMethod !== 'all') {
      if (paymentMethod === 'epayum') {
        query['epayum.isActive'] = true;
      } else if (paymentMethod === 'fpx') {
        query['fpx.isActive'] = true;
      }
    }

    // Get total count
    const total = await PaymentSettings.countDocuments(query);
    
    // Get paginated results
    const settings = await PaymentSettings.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Mask secret keys
    const maskedSettings = settings.map((setting: any) => {
      if (setting.stripe?.secretKey) {
        setting.stripe.secretKey = '********';
      }
      return setting;
    });

    // Calculate pagination
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: maskedSettings,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Create new payment settings
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = [
      'epayum.link',
      'epayum.instructions',
      'fpx.bankName',
      'fpx.accountNumber',
      'fpx.accountHolder',
      'fpx.instructions',
      'shipping.fee',
      'shipping.currency',
      'shipping.estimatedDays',
      'taxRate',
      'currency',
      'supportEmail'
    ];

    for (const field of requiredFields) {
      const fieldParts = field.split('.');
      let value = body;
      for (const part of fieldParts) {
        value = value?.[part];
      }
      if (value === undefined || value === null || value === '') {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.supportEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate URL format for epayum link
    try {
      new URL(body.epayum.link);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid epayum link format' },
        { status: 400 }
      );
    }

    // Validate numeric fields
    if (isNaN(body.taxRate) || body.taxRate < 0 || body.taxRate > 100) {
      return NextResponse.json(
        { success: false, error: 'Tax rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (isNaN(body.shipping.fee) || body.shipping.fee < 0) {
      return NextResponse.json(
        { success: false, error: 'Shipping fee must be a positive number' },
        { status: 400 }
      );
    }

    // Ensure at least one payment method is active
    if (!body.epayum.isActive && !body.fpx.isActive && !body.stripe?.isActive) {
      return NextResponse.json(
        { success: false, error: 'At least one payment method must be active' },
        { status: 400 }
      );
    }

    // Set default values
    const settingsData = {
      ...body,
      shipping: {
        ...body.shipping,
        availableCountries: body.shipping.availableCountries || ['Malaysia']
      }
    };

    const settings = new PaymentSettings(settingsData);
    await settings.save();

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Payment settings created successfully'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create payment settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Update payment settings
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Settings ID is required' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (updateData.supportEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.supportEmail)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate URL format for epayum link if provided
    if (updateData.epayum?.link) {
      try {
        new URL(updateData.epayum.link);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid epayum link format' },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields if provided
    if (updateData.taxRate !== undefined) {
      if (isNaN(updateData.taxRate) || updateData.taxRate < 0 || updateData.taxRate > 100) {
        return NextResponse.json(
          { success: false, error: 'Tax rate must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    if (updateData.shipping?.fee !== undefined) {
      if (isNaN(updateData.shipping.fee) || updateData.shipping.fee < 0) {
        return NextResponse.json(
          { success: false, error: 'Shipping fee must be a positive number' },
          { status: 400 }
        );
      }
    }

    // If key is masked, delete it from updateData to prevent overwriting with asterisks
    if (updateData.stripe?.secretKey === '********') {
      delete updateData.stripe.secretKey;
    }

    // Check if settings exist
    const existingSettings = await PaymentSettings.findById(id);
    if (!existingSettings) {
      return NextResponse.json(
        { success: false, error: 'Payment settings not found' },
        { status: 404 }
      );
    }

    // Ensure at least one payment method remains active
    const epayumActive = updateData.epayum?.isActive !== undefined 
      ? updateData.epayum.isActive 
      : existingSettings.epayum.isActive;
    const fpxActive = updateData.fpx?.isActive !== undefined 
      ? updateData.fpx.isActive 
      : existingSettings.fpx.isActive;
    const stripeActive = updateData.stripe?.isActive !== undefined
      ? updateData.stripe.isActive
      : existingSettings.stripe?.isActive;

    if (!epayumActive && !fpxActive && !stripeActive) {
      return NextResponse.json(
        { success: false, error: 'At least one payment method must be active' },
        { status: 400 }
      );
    }

    // Update the settings
    const updatedSettings = await PaymentSettings.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Payment settings updated successfully'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update payment settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment settings
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Settings ID is required' },
        { status: 400 }
      );
    }

    // Check if settings exist
    const settings = await PaymentSettings.findById(id);
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Payment settings not found' },
        { status: 404 }
      );
    }

    // Check if this is the only settings record
    const totalSettings = await PaymentSettings.countDocuments();
    if (totalSettings <= 1) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the last payment settings record' },
        { status: 400 }
      );
    }

    await PaymentSettings.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Payment settings deleted successfully'
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete payment settings';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}