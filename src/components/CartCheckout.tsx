"use client";
import { useEffect, useMemo, useState } from 'react';

type CartItem = { bookId: string; title: { en: string; ta: string }; price: number; quantity: number };

export default function CartCheckout({ items, onItemsChange, onOrderPlaced }: {
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (result: any) => void;
}) {
  const [settings, setSettings] = useState<any>(null);
  const [method, setMethod] = useState<'epayum' | 'fbx'>('epayum');
  const [shipping, setShipping] = useState({
    fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'Malaysia', phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

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

  const subtotal = useMemo(() => items.reduce((sum, it) => sum + (it.price * it.quantity), 0), [items]);
  const tax = useMemo(() => settings ? (subtotal * (settings.taxRate || 0)) / 100 : 0, [subtotal, settings]);
  const shippingFee = useMemo(() => {
    if (!settings) return 0;
    const threshold = settings.shipping?.freeShippingThreshold;
    const fee = settings.shipping?.fee || 0;
    return threshold && subtotal >= threshold ? 0 : fee;
  }, [settings, subtotal]);
  const finalTotal = useMemo(() => subtotal + tax + shippingFee, [subtotal, tax, shippingFee]);

  function updateQty(index: number, qty: number) {
    const next = [...items];
    next[index] = { ...next[index], quantity: Math.max(1, qty) };
    onItemsChange(next);
  }

  async function checkout() {
    if (!items.length) return;
    setSubmitting(true);
    try {
      const payload = {
        method,
        items: items.map((it) => ({ bookId: it.bookId, quantity: it.quantity })),
        shippingAddress: shipping,
      };
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Checkout failed');
      onOrderPlaced(data);
    } catch (e) {
      console.error('Checkout error', e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="layout-card">
      <h3 className="section-title flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="w-5 h-5"
        >
          <path
            d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-2-8H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>Cart</span>
      </h3>
      {!items.length && <p>Your cart is empty.</p>}
      {!!items.length && (
        <div className="section-stack">
          <div className="divide-y">
            {items.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium">{it.title?.en || 'Book'}</div>
                  <div className="text-sm text-gray-500">RM {it.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={1} value={it.quantity} className="form-input w-20" onChange={(e) => updateQty(idx, Number(e.target.value))} />
                  <button className="btn btn-secondary" onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className="divider-glow" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Shipping Address</h4>
              <div className="grid grid-cols-1 gap-2">
                <input className="form-input" placeholder="Full Name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
                <input className="form-input" placeholder="Address Line 1" value={shipping.addressLine1} onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} />
                <input className="form-input" placeholder="Address Line 2" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className="form-input" placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                  <input className="form-input" placeholder="State" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input className="form-input" placeholder="Postal Code" value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />
                  <input className="form-input" placeholder="Country" value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
                </div>
                <input className="form-input" placeholder="Phone" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Payment</h4>
              <div className="grid grid-cols-1 gap-3">
                <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                  {(settings?.activePaymentMethods || []).map((m: string) => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>
                {method === 'epayum' && settings?.epayum?.instructions && (
                  <div className="text-sm text-gray-600">{settings.epayum.instructions}</div>
                )}
                {method === 'fbx' && settings?.fbx?.instructions && (
                  <div className="text-sm text-gray-600">{settings.fbx.instructions}</div>
                )}
                <div className="p-3 rounded bg-gray-50">
                  <div className="flex justify-between"><span>Subtotal</span><span>RM {subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Tax ({settings?.taxRate || 0}%)</span><span>RM {tax.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Shipping</span><span>RM {shippingFee.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total</span><span>RM {finalTotal.toFixed(2)}</span></div>
                </div>
                <button className="btn btn-primary flex items-center gap-2" disabled={submitting || !items.length} onClick={checkout}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="w-5 h-5"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{submitting ? 'Processing...' : 'Checkout'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}