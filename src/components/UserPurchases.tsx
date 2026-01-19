"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { FaShoppingBag, FaBoxOpen, FaTruck, FaCheckCircle, FaTimesCircle, FaUndo, FaClock, FaCreditCard, FaMapMarkerAlt } from 'react-icons/fa';

export default function UserPurchases() {
  const { lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => { verifyAndFetch(); }, []);

  async function verifyAndFetch() {
    try {
      // Get the access token from localStorage
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {};
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const me = await fetch('/api/auth/me', { headers });
      if (me.status !== 200) { setAuthorized(false); setLoading(false); return; }
      setAuthorized(true);
      const res = await fetch('/api/purchases', { headers });
      const data = await res.json();
      if (data.success) setItems(data.items || []);
    } catch (e) { console.error('Failed to fetch purchases', e); }
    finally { setLoading(false); }
  }

  if (authorized === false) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-lg">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
          <FaTimesCircle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Authentication Required</h3>
        <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto text-center">
          Please log in to view your purchase history.
        </p>
        <button 
          onClick={() => window.location.href = '/auth/login'}
          className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25"
        >
          Log In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {!loading && !items.length && (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-white/10 bg-[#0a0a0f]">
          <FaShoppingBag className="h-12 w-12 text-gray-500 mb-4" />
          <h3 className="text-lg font-bold text-white">No purchases yet</h3>
          <p className="mt-1 text-sm text-gray-400">Start shopping to see your orders here.</p>
        </div>
      )}

      {!!items.length && (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it._id} className="overflow-hidden rounded-2xl border border-white/10 hover:border-purple-500/30 transition-colors bg-[#0a0a0f]">
              {/* Order Header */}
              <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</div>
                  <div className="font-mono text-sm font-medium text-white">#{it._id.slice(-8)}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</div>
                  <div className="text-sm text-white">{new Date(it.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</div>
                  <div className="text-sm font-bold text-purple-400">RM {Number(it.finalAmount || 0).toFixed(2)}</div>
                </div>
                <div>
                   <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${statusClass(it.status)}`}>
                     {statusIcon(it.status)}
                     {statusLabel(it.status)}
                   </span>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Book Image Placeholder */}
                  <div className="w-20 h-28 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 border border-white/10">
                     <FaBoxOpen size={32} />
                  </div>

                  {/* Order Details */}
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-white mb-2">
                      {typeof it.bookRef?.title === 'string' 
                        ? it.bookRef.title 
                        : it.bookRef?.title?.[lang] || it.bookRef?.title?.en || 'Book Title Unavailable'}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-gray-400">Quantity</span>
                          <span className="font-medium text-white">{it.quantity}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-gray-400">Unit Price</span>
                          <span className="font-medium text-white">RM {Number(it.unitPrice || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-gray-400">Payment Method</span>
                          <div className="flex items-center gap-2 font-medium text-white uppercase">
                            <FaCreditCard className="text-purple-400" />
                            {it.paymentDetails?.method || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Shipping Info */}
                      {it.shippingAddress && (
                         <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                           <h5 className="font-bold text-white mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                             <FaMapMarkerAlt className="text-purple-400" />
                             Shipping To
                           </h5>
                           <p className="text-gray-300 leading-relaxed text-xs">
                             {it.shippingAddress.fullName}<br/>
                             {it.shippingAddress.addressLine1} {it.shippingAddress.addressLine2}<br/>
                             {it.shippingAddress.city}, {it.shippingAddress.state} {it.shippingAddress.postalCode}<br/>
                             {it.shippingAddress.country}
                           </p>
                           {it.trackingNumber && (
                             <div className="mt-3 pt-3 border-t border-white/10">
                               <span className="text-xs font-bold text-purple-400 uppercase flex items-center gap-2">
                                 <FaTruck /> Tracking Number:
                               </span>
                               <span className="ml-2 font-mono text-white font-medium">{it.trackingNumber}</span>
                               {it.shippingCarrier && <span className="ml-2 text-xs text-gray-400">({it.shippingCarrier})</span>}
                             </div>
                           )}
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function statusLabel(s: string) {
  switch (s) {
    case 'pending': return 'Pending Approval';
    case 'paid': return 'Approved & Paid';
    case 'processing': return 'Processing';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Rejected';
    case 'refunded': return 'Refunded';
    default: return s;
  }
}

function statusIcon(s: string) {
  switch (s) {
    case 'pending': return <FaClock />;
    case 'paid': return <FaCheckCircle />;
    case 'processing': return <FaBoxOpen />;
    case 'shipped': return <FaTruck />;
    case 'delivered': return <FaCheckCircle />;
    case 'cancelled': return <FaTimesCircle />;
    case 'refunded': return <FaUndo />;
    default: return <FaClock />;
  }
}

function statusClass(s: string) {
  switch (s) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
    case 'paid': return 'bg-green-500/10 text-green-400 border-green-500/30';
    case 'processing': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'shipped': return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'refunded': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  }
}
