"use client";
import { useEffect, useMemo, useState } from 'react';

type Bilingual = { en: string; ta: string };
type Book = { _id: string; title: Bilingual; price: number };

export default function BuyNowModal({ book, open, onClose, onPurchased }: {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onPurchased: (result: any) => void;
}) {
  const [settings, setSettings] = useState<any>(null);
  const [method, setMethod] = useState<'epayum' | 'fbx'>('epayum');
  const [qty, setQty] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'Malaysia', phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) fetchSettings(); }, [open]);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const active = data.settings.activePaymentMethods || [];
        if (active.includes('epayum')) setMethod('epayum'); else if (active.includes('fbx')) setMethod('fbx');
      }
    } catch (e) { console.error('Failed to load payment settings', e); }
  }

  const subtotal = useMemo(() => (book?.price || 0) * qty, [book, qty]);
  const tax = useMemo(() => settings ? (subtotal * (settings.taxRate || 0)) / 100 : 0, [subtotal, settings]);
  const shippingFee = useMemo(() => {
    if (!settings) return 0;
    const threshold = settings.shipping?.freeShippingThreshold;
    const fee = settings.shipping?.fee || 0;
    return threshold && subtotal >= threshold ? 0 : fee;
  }, [settings, subtotal]);
  const finalTotal = useMemo(() => subtotal + tax + shippingFee, [subtotal, tax, shippingFee]);

  async function submit() {
    if (!book) return;
    setSubmitting(true);
    try {
      const payload = {
        method,
        items: [{ bookId: book._id, quantity: qty }],
        shippingAddress: shipping,
      };
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Purchase failed');
      onPurchased(data);
      onClose();
    } catch (e) {
      console.error('Buy Now error', e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !book) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="layout-card w-full max-w-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="section-title">Buy Now</h3>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-medium">{book.title?.en || 'Book'}</div>
            <div className="font-semibold">RM {(book.price || 0).toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-2">
            <label>Qty</label>
            <input type="number" className="form-input w-24" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className="form-input" placeholder="Full Name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
            <input className="form-input" placeholder="Phone" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                <input className="form-input col-span-2" placeholder="Address Line 1" value={shipping.addressLine1} onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} />
                <input className="form-input col-span-2" placeholder="Address Line 2" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} />
            <input className="form-input" placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
            <input className="form-input" placeholder="State" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
            <input className="form-input" placeholder="Postal Code" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
            <input className="form-input" placeholder="Country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
          </div>
          <div>
            <label className="block mb-1">Payment Method</label>
            <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value as any)}>
              {(settings?.activePaymentMethods || []).map((m: string) => (
                <option key={m} value={m}>{m.toUpperCase()}</option>
              ))}
            </select>
            {method === 'epayum' && settings?.epayum?.instructions && (
              <div className="text-sm text-gray-600 mt-1">{settings.epayum.instructions}</div>
            )}
            {method === 'fbx' && settings?.fbx?.instructions && (
              <div className="text-sm text-gray-600 mt-1">{settings.fbx.instructions}</div>
            )}
          </div>
          <div className="p-3 rounded bg-gray-50">
            <div className="flex justify-between"><span>Subtotal</span><span>RM {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax ({settings?.taxRate || 0}%)</span><span>RM {tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Shipping</span><span>RM {shippingFee.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span>RM {finalTotal.toFixed(2)}</span></div>
          </div>
          <button className="btn btn-primary w-full" disabled={submitting} onClick={submit}>{submitting ? 'Processing...' : 'Place Order'}</button>
        </div>
      </div>
    </div>
  );
}