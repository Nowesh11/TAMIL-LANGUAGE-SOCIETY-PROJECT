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

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // 1. Authenticate user
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const items: Array<{ bookId: string; quantity: number }> = body.items || [];
    const shippingAddress = body.shippingAddress || null;
    const method: 'epayum' | 'fpx' | 'cash' | 'card' = body.method;
    const notes: string | undefined = body.notes;
    const receiptPath: string | undefined = body.receiptPath;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) {
      return NextResponse.json({ success: false, error: 'Invalid shipping address' }, { status: 400 });
    }
    if (!method || (method !== 'epayum' && method !== 'fpx' && method !== 'cash' && method !== 'card')) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    // 3. Get payment settings
    const settings = await (PaymentSettings as any).getCurrentSettings();
    if (!settings) {
      return NextResponse.json({ success: false, error: 'Payment settings not configured' }, { status: 500 });
    }

    // 4. Fetch books and validate stock
    const bookDocs = await Promise.all(items.map(async (it) => {
      const book = await Book.findById(it.bookId);
      if (!book || !book.active) throw new Error('Book not found or inactive');
      if (it.quantity <= 0) throw new Error('Invalid quantity');
      if (book.stock < it.quantity) throw new Error(`Insufficient stock for ${book.title?.en || 'book'}`);
      return book;
    }));

    // 5. Compute subtotal, tax, shipping, final total
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

    // 6. Proportional distribution
    const distributions = perItemTotals.map((it) => {
      const share = subtotal > 0 ? it.total / subtotal : 0;
      const taxShare = tax * share;
      const shipShare = shippingFee * share;
      const finalAmount = it.total + taxShare + shipShare;
      return { taxShare, shipShare, finalAmount };
    });

    // 7. Create purchases and reduce stock
    const createdPurchases = await Promise.all(bookDocs.map(async (book, idx) => {
      const { unit, qty, total } = perItemTotals[idx];
      const { shipShare, finalAmount } = distributions[idx];

      const purchase = await Purchase.create({
        userRef: user._id,
        bookRef: book._id,
        quantity: qty,
        unitPrice: unit,
        totalAmount: total,
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

      // Reduce stock
      await book.reduceStock(qty);

      // Log activity asynchronously
      ActivityLogger.logBookPurchase(user._id, book._id, book.title?.en || 'Unknown Book', finalAmount)
        .catch(err => console.error('Activity logging failed', err));

      return purchase;
    }));

    // 8. Send notifications asynchronously
    createdPurchases.forEach((purchase, idx) => {
      const book = bookDocs[idx];
      NotificationService.createNotification({
        type: 'success',
        title: { en: `Purchase Confirmed: ${book.title?.en}`, ta: `கொள்முதல் உறுதி: ${book.title?.ta || book.title?.en}` },
        message: { 
          en: `You successfully purchased ${items[idx].quantity} × ${book.title?.en}. Your order is being processed.`, 
          ta: `நீங்கள் வெற்றிகரமாக ${items[idx].quantity} × ${book.title?.ta || book.title?.en} வாங்கியுள்ளீர்கள். உங்கள் ஆர்டர் செயலாக்கப்படுகிறது.` 
        },
        tags: ['event', 'purchase'],
        targetAudience: 'specific',
        userRef: user._id,
        priority: 'high',
        sendEmail: false,
        actionUrl: '/account/purchases',
        actionText: { en: 'View Purchases', ta: 'கொள்முதல்களைப் பார்க்கவும்' },
        createdBy: user._id
      }).catch(err => console.error('Notification creation failed', err));
    });

    // 9. Send receipt email asynchronously
    sendEmail({
      to: user.email,
      subject: `Order Confirmation - #${createdPurchases[0]._id.toString().slice(-6).toUpperCase()}`,
      template: 'bookPurchaseReceipt',
      data: {
        userName: user.name?.en || 'Valued Member',
        orderId: createdPurchases[0]._id.toString().slice(-6).toUpperCase(),
        items: bookDocs.map((b, i) => ({ title: b.title?.en || 'Book', qty: items[i].quantity, price: perItemTotals[i].unit })),
        subtotal,
        tax,
        shipping: shippingFee,
        total: finalTotal,
        actionUrl: '/account/purchases',
        actionText: 'View Order',
        shippingAddress: `${shippingAddress.fullName}, ${shippingAddress.addressLine1}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}, ${shippingAddress.country}`
      }
    }).then(() => console.log('Receipt email sent')).catch(err => console.error('Email sending failed', err));

    // 10. Return response immediately
    return NextResponse.json({
      success: true,
      message: 'Purchase saved successfully. Receipt email will be sent shortly.',
      purchases: createdPurchases
    });

  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to create purchase';
    const status = (e instanceof Error && /Unauthorized/.test(e.message)) ? 401 : 500;
    return NextResponse.json({ success: false, error }, { status });
  }
}