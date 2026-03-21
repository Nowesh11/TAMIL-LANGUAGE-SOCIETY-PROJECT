import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { getUserFromAccessToken } from '../../../lib/auth';
import PaymentSettings from '../../../models/PaymentSettings';
import Purchase from '../../../models/Purchase';
import Book from '../../../models/Book';
import { NotificationService } from '../../../lib/notificationService';
import { ActivityLogger } from '../../../lib/activityLogger';
import { sendEmail } from '../../../lib/emailService';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const purchases = await Purchase.find({ userRef: user._id })
      .populate('bookRef')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, items: purchases });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to fetch purchases';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const items: Array<{ bookId: string; quantity: number }> = body.items || [];
    const shippingAddress = body.shippingAddress || null;
    const method: 'epayum' | 'fpx' | 'cash' | 'card' = body.method;
    const notes: string | undefined = body.notes;
    const receiptPath: string | undefined = body.receiptPath;

    if (!Array.isArray(items) || items.length === 0)
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode ||
        !shippingAddress.country) {
      return NextResponse.json({ success: false, error: 'Invalid shipping address' }, { status: 400 });
    }

    if (!method || !['epayum', 'fpx', 'cash', 'card'].includes(method))
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });

    const settings = await (PaymentSettings as any).getCurrentSettings();
    if (!settings) return NextResponse.json({ success: false, error: 'Payment settings not configured' }, { status: 500 });

    // Fetch books and validate stock
    const bookDocs = await Promise.all(items.map(async (it) => {
      const b = await Book.findById(it.bookId);
      if (!b || !b.active) throw new Error('Book not found or inactive');
      if (it.quantity <= 0) throw new Error('Invalid quantity');
      if (b.stock < it.quantity) throw new Error(`Insufficient stock for ${b.title?.en || 'book'}`);
      return b;
    }));

    // Compute totals
    const perItemTotals = bookDocs.map((b, idx) => {
      const qty = items[idx].quantity;
      const unit = b.price;
      const total = unit * qty;
      return { unit, qty, total };
    });
    const subtotal = perItemTotals.reduce((sum, it) => sum + it.total, 0);
    const tax = settings.calculateTax(subtotal);
    const shippingFee = settings.calculateShippingFee(subtotal);
    const finalTotal = settings.calculateTotal(subtotal, true);

    const distributions = perItemTotals.map((it) => {
      const share = subtotal > 0 ? it.total / subtotal : 0;
      const taxShare = tax * share;
      const shipShare = shippingFee * share;
      const finalAmount = it.total + taxShare + shipShare;
      return { taxShare, shipShare, finalAmount };
    });

    // Create purchases
    const created: any[] = [];
    for (let i = 0; i < bookDocs.length; i++) {
      const book = bookDocs[i];
      const { unit, qty } = perItemTotals[i];
      const { shipShare, finalAmount } = distributions[i];

      const p = await Purchase.create({
        userRef: user._id,
        bookRef: book._id,
        quantity: qty,
        unitPrice: unit,
        totalAmount: perItemTotals[i].total,
        shippingFee: shipShare,
        finalAmount,
        status: 'pending',
        paymentDetails: {
          method,
          amount: finalAmount,
          currency: settings.currency,
          notes,
          proofOfPayment: receiptPath || undefined,
          receiptPath: receiptPath || undefined
        },
        shippingAddress
      });
      created.push(p);

      // Log purchase activity
      ActivityLogger.logBookPurchase(user._id, book._id, book.title?.en || 'Unknown Book', finalAmount)
        .catch((err: any) => console.error('Activity log failed:', err));

      // Reduce stock
      book.reduceStock(qty).catch((err: any) => console.error('Stock reduction failed:', err));

      // Create notification asynchronously
      NotificationService.createNotification({
        type: 'success',
        title: {
          en: `Purchase Confirmed: ${book.title?.en || 'Item'}`,
          ta: `கொள்முதல் உறுதி: ${book.title?.ta || book.title?.en || 'பொருள்'}`
        },
        message: {
          en: `You purchased ${qty} × ${book.title?.en || 'Item'}.`,
          ta: `நீங்கள் ${qty} × ${book.title?.ta || book.title?.en || 'பொருள்'} வாங்கியுள்ளீர்கள்.`
        },
        tags: ['event', 'purchase'],
        targetAudience: 'specific',
        userRef: user._id,
        priority: 'high',
        sendEmail: false,
        actionUrl: '/account/purchases',
        actionText: { en: 'View Purchases', ta: 'கொள்முதல்களைப் பார்க்கவும்' },
        createdBy: user._id
      }).catch((err: any) => console.error('Notification failed:', err));
    }

    // Send receipt email asynchronously (fire-and-forget)
    sendEmail({
      to: user.email,
      subject: `Order Confirmation - #${created[0]._id.toString().slice(-6).toUpperCase()}`,
      template: 'bookPurchaseReceipt',
      data: {
        userName: user.name?.en || 'Valued Member',
        orderId: created[0]._id.toString().slice(-6).toUpperCase(),
        items: bookDocs.map((b, i) => ({ title: b.title?.en || 'Book', qty: items[i].quantity, price: perItemTotals[i].unit })),
        subtotal,
        tax,
        shipping: shippingFee,
        total: finalTotal,
        actionUrl: '/account/purchases',
        actionText: 'View Order',
        shippingAddress: `${shippingAddress.fullName}, ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}, ${shippingAddress.country}`
      }
    }).catch(err => console.error('Email failed:', err));

    // Return response immediately
    return NextResponse.json({ success: true, order: { subtotal, tax, shippingFee, finalTotal }, purchases: created });

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to create purchase';
    const status = (e instanceof Error && /Unauthorized/.test(e.message)) ? 401 : 500;
    return NextResponse.json({ success: false, error }, { status });
  }
}