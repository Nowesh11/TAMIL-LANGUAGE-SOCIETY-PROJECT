import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Purchase from '@/models/Purchase'
import NotificationService from '@/lib/notificationService'
import { getUserFromAccessToken } from '@/lib/auth'

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
    const limit = Math.max(1, Math.min(50, Number(searchParams.get('limit') || '20')))
    const status = searchParams.get('status') || undefined
    const paymentStatus = searchParams.get('paymentStatus') || undefined
    const q = (searchParams.get('search') || '').trim()
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const filter: any = {}
    if (status && status !== 'all') filter.status = status
    if (paymentStatus && paymentStatus !== 'all') filter['paymentDetails.status'] = paymentStatus
    if (startDate) filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(startDate) }
    if (endDate) filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(endDate) }

    let query = Purchase.find(filter)
    if (q) {
      query = Purchase.find({
        ...filter,
        $or: [
          { 'shippingAddress.fullName': { $regex: q, $options: 'i' } },
          { 'paymentDetails.method': { $regex: q, $options: 'i' } }
        ]
      })
    }

    const total = await Purchase.countDocuments(filter)
    const items = await query
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userRef', 'name email')
      .populate('bookRef', 'title author')
      .lean()

    const data = items.map((p: any) => ({
      _id: String(p._id),
      orderId: p._id.toString().substring(0, 8).toUpperCase(), // Generate display ID if missing
      bookRef: String(p.bookRef?._id || p.bookRef),
      bookTitle: p.bookRef?.title || { en: 'Unknown Book', ta: '' },
      bookAuthor: p.bookRef?.author || { en: '', ta: '' },
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalAmount: p.totalAmount,
      shippingFee: p.shippingFee,
      finalAmount: p.finalAmount,
      status: p.status,
      paymentDetails: p.paymentDetails,
      shippingAddress: p.shippingAddress,
      trackingNumber: p.trackingNumber,
      shippingCarrier: p.shippingCarrier,
      estimatedDelivery: p.estimatedDelivery,
      actualDelivery: p.actualDelivery,
      notes: p.notes,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect()
    const user = await getUserFromAccessToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status, paymentStatus, trackingNumber, shippingCarrier, estimatedDelivery, actualDelivery, notes } = body
    if (!id) {
      return NextResponse.json({ success: false, error: 'Purchase ID required' }, { status: 400 })
    }

    const purchase = await Purchase.findById(id).populate('userRef');
    if (!purchase) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    const previousStatus = purchase.status;

    // Update fields
    if (status) purchase.status = status
    if (paymentStatus) {
      if (paymentStatus === 'paid') {
        if (!purchase.paymentDetails.paidAt) {
          purchase.paymentDetails.paidAt = new Date()
        }
        // Update main status to 'paid' if no specific status was provided
        if (!status) {
          purchase.status = 'paid'
        }
      }
    }
    
    // Update shipping fields at root level
    if (trackingNumber !== undefined) purchase.trackingNumber = trackingNumber
    if (shippingCarrier !== undefined) purchase.shippingCarrier = shippingCarrier
    
    // Handle estimatedDelivery parsing carefully
    if (estimatedDelivery) {
      const dateVal = new Date(estimatedDelivery);
      if (!isNaN(dateVal.getTime())) {
         // Only update if it's a valid date.
         // Also check if it's in the future if status is shipped, or just allow it for admin flexibility
         // Mongoose validator handles "must be in future" if configured, so we rely on that or handle catch block
         purchase.estimatedDelivery = dateVal;
      }
    } else if (estimatedDelivery === '') {
       // Explicitly clear if empty string
       purchase.estimatedDelivery = undefined;
    }

    if (actualDelivery) {
      const dateVal = new Date(actualDelivery)
      if (!isNaN(dateVal.getTime())) {
        purchase.deliveredAt = dateVal
        if (!status) purchase.status = 'delivered'
      }
    } else if (actualDelivery === '') {
       purchase.deliveredAt = undefined;
    }
    
    if (notes !== undefined) purchase.notes = notes

    await purchase.save()

    // Send notification if status changed
    if (status && status !== previousStatus) {
      try {
        const orderData = {
          orderId: purchase._id.toString().substring(0, 8).toUpperCase(),
          userRef: purchase.userRef,
          shippingCarrier: purchase.shippingCarrier
        };
        await NotificationService.createPurchaseStatusNotification(
          orderData,
          status,
          purchase.trackingNumber,
          user._id
        );
      } catch (notifyError) {
        console.error('Failed to send notification:', notifyError);
        // Don't fail the request just because notification failed
      }
    }

    return NextResponse.json({ success: true, data: { _id: String(purchase._id), ...purchase.toObject() } })
  } catch (error: any) {
    console.error('Error updating purchase:', error);
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
       return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update purchase' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    const user = await getUserFromAccessToken(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const {
      userRef,
      bookRef,
      quantity,
      unitPrice,
      shippingFee,
      paymentDetails,
      shippingAddress,
      status,
      notes
    } = body
    if (!userRef || !bookRef || !quantity || !unitPrice || shippingFee === undefined || !paymentDetails || !paymentDetails.method || paymentDetails.amount === undefined || !paymentDetails.currency || !shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    const totalAmount = Number(quantity) * Number(unitPrice)
    const finalAmount = totalAmount + Number(shippingFee || 0)
    const doc = await Purchase.create({
      userRef,
      bookRef,
      quantity,
      unitPrice,
      totalAmount,
      shippingFee,
      finalAmount,
      status: status || 'pending',
      paymentDetails,
      shippingAddress,
      notes
    })
    return NextResponse.json({ success: true, data: { _id: String(doc._id), ...doc.toObject() } })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create purchase' }, { status: 500 })
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
      return NextResponse.json({ success: false, error: 'Purchase ID required' }, { status: 400 })
    }
    const removed = await Purchase.findByIdAndDelete(id)
    if (!removed) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: 'Purchase deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete purchase' }, { status: 500 })
  }
}
