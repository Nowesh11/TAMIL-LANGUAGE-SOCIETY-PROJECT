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
      <div className="flex flex-col items-center justify-center py-16 rounded-3xl border border-border bg-surface shadow-2xl card-morphism mx-4 my-8">
        <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6 border border-error/20 animate-pulse">
          <FaTimesCircle className="h-10 w-10 text-error" />
        </div>
        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">Authentication Required</h3>
        <p className="mt-3 text-foreground-secondary max-w-md mx-auto text-center font-medium">
          Please log in to view your private purchase history and track your orders.
        </p>
        <button 
          onClick={() => window.location.href = '/auth/login'}
          className="mt-8 px-10 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/25 transform hover:-translate-y-1"
        >
          Log In Now
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 md:p-6">
      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-glow"></div>
        </div>
      )}
      
      {!loading && !items.length && (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-border bg-surface card-morphism">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
            <FaShoppingBag className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter">No purchases yet</h3>
          <p className="mt-2 text-foreground-secondary font-medium">Start exploring our collection to see your orders here.</p>
          <button 
            onClick={() => window.location.href = '/books'}
            className="mt-8 px-8 py-3 bg-surface border border-primary/30 text-primary rounded-xl font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
          >
            Browse Books
          </button>
        </div>
      )}

      {!!items.length && (
        <div className="space-y-8">
          {items.map((it) => (
            <div key={it._id} className="overflow-hidden rounded-[2rem] border border-border hover:border-primary/40 transition-all duration-500 bg-surface shadow-lg hover:shadow-2xl group card-morphism">
              {/* Order Header */}
              <div className="bg-surface-hover/50 px-8 py-6 border-b border-border flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <FaBoxOpen size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">Order Reference</div>
                    <div className="font-mono text-sm font-black text-foreground uppercase">#{it._id.slice(-8)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">Purchase Date</div>
                  <div className="text-sm font-bold text-foreground">{new Date(it.createdAt || Date.now()).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">Total Amount</div>
                  <div className="text-lg font-black text-primary">MYR {Number(it.finalAmount || 0).toFixed(2)}</div>
                </div>
                <div className="ml-auto">
                   <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border shadow-sm ${statusClass(it.status)}`}>
                     {statusIcon(it.status)}
                     {statusLabel(it.status)}
                   </span>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Book Details */}
                  <div className="flex-1 space-y-6">
                    <div className="flex gap-6 items-start">
                       <div className="w-24 h-32 bg-background rounded-2xl flex-shrink-0 flex items-center justify-center text-foreground-muted border border-border shadow-inner group-hover:scale-105 transition-transform duration-500">
                          <FaShoppingBag size={40} className="opacity-20" />
                       </div>
                       <div>
                         <h4 className="font-black text-2xl text-foreground mb-2 leading-tight tracking-tight">
                           {typeof it.bookRef?.title === 'string' 
                             ? it.bookRef.title 
                             : it.bookRef?.title?.[lang] || it.bookRef?.title?.en || 'Book Title Unavailable'}
                         </h4>
                         <div className="flex items-center gap-4 text-sm">
                            <span className="px-3 py-1 bg-surface-hover rounded-lg border border-border font-bold text-foreground-secondary">Qty: {it.quantity}</span>
                            <span className="text-primary font-black">MYR {Number(it.unitPrice || 0).toFixed(2)} / unit</span>
                         </div>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em] border-b border-border pb-2">Billing Summary</h5>
                        <div className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span className="text-foreground-muted font-bold">Subtotal</span>
                             <span className="text-foreground font-black">MYR {(it.quantity * (it.unitPrice || 0)).toFixed(2)}</span>
                           </div>
                           <div className="flex justify-between text-sm">
                             <span className="text-foreground-muted font-bold">Payment</span>
                             <span className="text-primary font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                               <FaCreditCard /> {it.paymentDetails?.method || 'N/A'}
                             </span>
                           </div>
                        </div>
                      </div>
                      
                      {/* Shipping Info */}
                      {it.shippingAddress && (
                         <div className="space-y-4">
                           <h5 className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em] border-b border-border pb-2">Shipping Details</h5>
                           <div className="p-4 bg-surface-hover/50 rounded-2xl border border-border/50">
                             <div className="flex items-start gap-3">
                               <FaMapMarkerAlt className="text-primary mt-1 flex-shrink-0" />
                               <div className="text-xs text-foreground-secondary font-bold leading-relaxed">
                                 <div className="text-foreground font-black mb-1">{it.shippingAddress.fullName}</div>
                                 {it.shippingAddress.addressLine1}, {it.shippingAddress.addressLine2 && it.shippingAddress.addressLine2 + ','}<br/>
                                 {it.shippingAddress.city}, {it.shippingAddress.state} {it.shippingAddress.postalCode}<br/>
                                 {it.shippingAddress.country}
                               </div>
                             </div>
                           </div>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Status / Tracking */}
                  {it.trackingNumber && (
                    <div className="lg:w-72 space-y-4">
                       <h5 className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.3em] border-b border-border pb-2">Delivery Progress</h5>
                       <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 relative overflow-hidden group/tracking">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover/tracking:bg-primary/20 transition-all"></div>
                          <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-glow">
                                   <FaTruck />
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-primary">In Transit</div>
                             </div>
                             <div>
                                <div className="text-[10px] font-black text-foreground-muted uppercase tracking-widest mb-1">Tracking ID</div>
                                <div className="font-mono text-sm font-black text-foreground">{it.trackingNumber}</div>
                             </div>
                             {it.shippingCarrier && (
                               <div>
                                  <div className="text-[10px] font-black text-foreground-muted uppercase tracking-widest mb-1">Carrier</div>
                                  <div className="text-xs font-bold text-foreground-secondary">{it.shippingCarrier}</div>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}
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
