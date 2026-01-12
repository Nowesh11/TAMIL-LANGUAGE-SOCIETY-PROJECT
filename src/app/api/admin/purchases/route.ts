import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Purchase from '@/models/Purchase'
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
          { orderId: { $regex: q, $options: 'i' } },
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
      .lean()

    const data = items.map((p: any) => ({
      _id: String(p._id),
      orderId: p.orderId,
      bookRef: String(p.bookRef),
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalAmount: p.totalAmount,
      shippingFee: p.shippingFee,
      finalAmount: p.finalAmount,
      status: p.status,
      paymentDetails: p.paymentDetails,
      shippingAddress: p.shippingAddress,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))

    return NextResponse.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } })
  } catch (error) {
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

    const update: any = {}
    if (status) update.status = status
    if (paymentStatus) update['paymentDetails.status'] = paymentStatus
    if (trackingNumber) update['shippingDetails.trackingNumber'] = trackingNumber
    if (shippingCarrier) update['shippingDetails.shippingCarrier'] = shippingCarrier
    if (estimatedDelivery) update['shippingDetails.estimatedDelivery'] = new Date(estimatedDelivery)
    if (actualDelivery) update['shippingDetails.actualDelivery'] = new Date(actualDelivery)
    if (notes !== undefined) update.notes = notes

    const updated = await Purchase.findByIdAndUpdate(id, { ...update, updatedAt: new Date() }, { new: true })
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Purchase not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: { _id: String(updated._id), ...updated.toObject() } })
  } catch (error) {
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
