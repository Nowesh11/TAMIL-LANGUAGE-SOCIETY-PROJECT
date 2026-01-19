import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUser, FiMapPin, FiCreditCard, FiPackage, FiDownload, FiTruck, FiCalendar, FiBook, FiDollarSign } from 'react-icons/fi';
import '../../styles/admin/modals.css';

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onEdit: (order: any) => void;
}

const PurchaseDetailModal: React.FC<PurchaseDetailModalProps> = ({ isOpen, onClose, order, onEdit }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen || !order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      case 'shipped': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      case 'cancelled': return 'bg-rose-100 text-rose-700';
      case 'refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-amber-100 text-amber-700'; // pending
    }
  };

  // Helper to handle file URLs (similar to recruitment modal)
  const getFileUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    if (cleanPath.startsWith('uploads/')) {
       return `/api/files/serve?path=${encodeURIComponent(cleanPath)}`;
    }
    return `/${cleanPath}`;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100000] p-4 animate-fade-in">
      <div className="w-full max-w-6xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col relative overflow-hidden text-white animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f] relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-inner border border-indigo-500/30">
              <FiPackage />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Order #{order.orderId}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  {new Date(order.orderDate).toLocaleString()}
                </p>
                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  order.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  order.status === 'shipped' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  order.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  order.status === 'refunded' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-transparent hover:border-white/10"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar: Customer & Shipping */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Customer Info */}
              <div className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiUser className="text-indigo-400" /> Customer Details
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Full Name</span>
                    <span className="text-sm font-bold text-white">{order.customerName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Email Address</span>
                    <span className="text-sm font-bold text-white">{order.customerEmail}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Phone Number</span>
                    <span className="text-sm font-bold text-white">{order.customerPhone || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiMapPin className="text-indigo-400" /> Shipping Address
                </h3>
                <div className="p-4 bg-black/20 rounded-xl border border-white/10 text-sm text-gray-200 leading-relaxed">
                  <p className="font-bold text-white">{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                  <p>{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                </div>
              </div>

              {/* Shipping Status (if shipped) */}
              {(order.trackingNumber || order.shippingCarrier) && (
                <div className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                    <FiTruck className="text-emerald-400" /> Shipment Info
                  </h3>
                  <div className="space-y-3">
                     {order.trackingNumber && (
                       <div>
                         <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Tracking Number</span>
                         <p className="text-lg font-mono font-bold text-white tracking-wider">{order.trackingNumber}</p>
                       </div>
                     )}
                     {order.shippingCarrier && (
                       <div>
                         <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Carrier</span>
                         <p className="text-sm font-bold text-white">{order.shippingCarrier}</p>
                       </div>
                     )}
                  </div>
                </div>
              )}

            </div>

            {/* Main Content: Items & Payment */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Order Items */}
              <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">
                    <FiBook />
                  </div>
                  Order Items
                </h3>
                
                <div className="bg-black/20 rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-4 flex items-start gap-4 border-b border-white/10">
                    <div className="w-16 h-20 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-gray-500">
                       <FiBook size={24} />
                       {/* If we had cover image, show it here */}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-lg">{order.bookTitle?.en}</h4>
                      <p className="text-xs text-gray-400 mb-2">{order.bookTitle?.ta}</p>
                      <p className="text-sm text-gray-400">by <span className="text-gray-300 font-medium">{order.bookAuthor?.en}</span></p>
                    </div>
                    <div className="text-right">
                       <p className="text-sm text-gray-400">Qty: <span className="font-bold text-white">{order.quantity}</span></p>
                       <p className="text-sm text-gray-400">Price: <span className="font-bold text-white">RM {order.bookPrice}</span></p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white/5 flex flex-col items-end gap-2">
                     <div className="flex justify-between w-full max-w-xs text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="font-medium text-white">RM {order.totalAmount}</span>
                     </div>
                     <div className="w-full max-w-xs border-t border-white/10 my-1"></div>
                     <div className="flex justify-between w-full max-w-xs text-lg font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-emerald-400">RM {order.totalAmount}</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">
                    <FiCreditCard />
                  </div>
                  Payment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Payment Method</span>
                        <p className="text-sm font-bold text-white capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Payment Status</span>
                        <div className="mt-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full border ${
                             order.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                             order.paymentStatus === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {order.paymentStatus?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                   </div>

                   {/* Payment Proof Download */}
                   {(order.paymentDetails?.proofOfPayment || order.paymentDetails?.receiptPath) && (
                     <div className="flex flex-col justify-center items-start p-4 bg-black/20 rounded-xl border border-white/10">
                        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Payment Proof</p>
                        <a 
                          href={getFileUrl(order.paymentDetails.proofOfPayment || order.paymentDetails.receiptPath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-emerald-500/10 text-white hover:text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded-lg transition-all shadow-sm hover:shadow-lg"
                        >
                           <FiDownload />
                           <span className="font-bold text-sm">Download Receipt</span>
                        </a>
                     </div>
                   )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-white/10 bg-[#0a0a0f] sticky bottom-0">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 hover:text-white transition-all"
            >
              Close
            </button>
            <button 
              onClick={() => { onClose(); onEdit(order); }} 
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/20 transition-all"
            >
              Review / Update Order
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PurchaseDetailModal;