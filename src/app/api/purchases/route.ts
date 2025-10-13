import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import { getUserFromAccessToken } from '../../../lib/auth';
import PaymentSettings from '../../../models/PaymentSettings';
import Purchase from '../../../models/Purchase';
import Book from '../../../models/Book';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = await getUserFromAccessToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const purchases = await Purchase.getByUser(user._id, status || undefined);

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
    const method: 'epayum' | 'fbx' | 'cash' | 'card' = body.method;
    const notes: string | undefined = body.notes;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'No items provided' }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode || !shippingAddress.country) {
      return NextResponse.json({ success: false, error: 'Invalid shipping address' }, { status: 400 });
    }
    if (!method || (method !== 'epayum' && method !== 'fbx' && method !== 'cash' && method !== 'card')) {
      return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
    }

    const settings = await PaymentSettings.getCurrentSettings();
    if (!settings) {
      return NextResponse.json({ success: false, error: 'Payment settings not configured' }, { status: 500 });
    }

    // Fetch books and validate stock
    const bookDocs = await Promise.all(items.map(async (it) => {
      const b = await Book.findById(it.bookId);
      if (!b || !b.active) throw new Error('Book not found or inactive');
      if (it.quantity <= 0) throw new Error('Invalid quantity');
      if (b.stock < it.quantity) throw new Error(`Insufficient stock for ${b.title?.en || 'book'}`);
      return b;
    }));

    // Compute subtotal
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

    // Distribute tax and shipping proportionally across items
    const distributions = perItemTotals.map((it) => {
      const share = subtotal > 0 ? it.total / subtotal : 0;
      const taxShare = tax * share;
      const shipShare = shippingFee * share;
      const finalAmount = it.total + taxShare + shipShare;
      return { taxShare, shipShare, finalAmount };
    });

    // Create purchase documents per item
    const created: any[] = [];
    for (let i = 0; i < bookDocs.length; i++) {
      const book = bookDocs[i];
      const { unit, qty, total } = perItemTotals[i];
      const { shipShare, finalAmount } = distributions[i];

      const p = await Purchase.create({
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
          notes
        },
        shippingAddress
      });
      created.push(p);

      // Reduce stock
      await book.reduceStock(qty);
    }

    return NextResponse.json({ success: true, order: { subtotal, tax, shippingFee, finalTotal }, purchases: created });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Failed to create purchase';
    const status = (e instanceof Error && /Unauthorized/.test(e.message)) ? 401 : 500;
    return NextResponse.json({ success: false, error }, { status });
  }
}