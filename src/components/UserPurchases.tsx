"use client";
import { useEffect, useState } from 'react';

export default function UserPurchases() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => { verifyAndFetch(); }, []);

  async function verifyAndFetch() {
    try {
      const me = await fetch('/api/auth/me');
      if (me.status !== 200) { setAuthorized(false); setLoading(false); return; }
      setAuthorized(true);
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch (e) { console.error('Failed to fetch purchases', e); }
    finally { setLoading(false); }
  }

  if (authorized === false) return null;

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
            d="M6 2h12a2 2 0 0 1 2 2v16l-4-3H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>My Purchases</span>
      </h3>
      {loading && <p>Loading...</p>}
      {!loading && !items.length && <p>No purchases yet.</p>}
      {!!items.length && (
        <div className="divide-y">
          {items.map((it) => (
            <div key={it._id} className="py-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <div>
                <div className="font-medium">{it.bookRef?.title?.en || 'Book'}</div>
                <div className="text-sm text-gray-500">Qty: {it.quantity}</div>
              </div>
              <div>
                <div className="text-sm">Unit: RM {Number(it.unitPrice || 0).toFixed(2)}</div>
                <div className="text-sm">Total: RM {Number(it.finalAmount || 0).toFixed(2)}</div>
              </div>
              <div>
                <span className={`inline-block px-2 py-1 rounded text-sm ${statusClass(it.status)}`}>{statusLabel(it.status)}</span>
              </div>
              <div className="text-sm text-gray-500">{it.paymentDetails?.method?.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case 'pending': return 'Pending';
    case 'paid': return 'Approved';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Rejected';
    case 'refunded': return 'Refunded';
    default: return s;
  }
}

function statusClass(s: string) {
  switch (s) {
    case 'pending': return 'bg-yellow-100 text-yellow-700';
    case 'paid': return 'bg-green-100 text-green-700';
    case 'processing': return 'bg-blue-100 text-blue-700';
    case 'shipped': return 'bg-indigo-100 text-indigo-700';
    case 'delivered': return 'bg-emerald-100 text-emerald-700';
    case 'cancelled': return 'bg-red-100 text-red-700';
    case 'refunded': return 'bg-orange-100 text-orange-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}