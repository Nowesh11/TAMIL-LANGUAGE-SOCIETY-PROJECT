import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheckCircle, FiTruck, FiClock, FiAlertCircle } from 'react-icons/fi';
import '../../styles/admin/modals.css';

interface PurchaseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSave: (data: any) => Promise<void>;
}

const PurchaseReviewModal: React.FC<PurchaseReviewModalProps> = ({ isOpen, onClose, order, onSave }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    status: '',
    trackingNumber: '',
    shippingCarrier: '',
    estimatedDelivery: '',
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (order) {
      setData({
        status: order.status || 'pending',
        trackingNumber: order.trackingNumber || '',
        shippingCarrier: order.shippingCarrier || '',
        estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().split('T')[0] : '',
        notes: order.notes || ''
      });
    }
  }, [order]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen || !order) return null;

  return createPortal(
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '600px' }}>
        
        {/* Header */}
        <div className="modern-modal-header">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
              <FiCheckCircle className="text-xl" />
            </div>
            <div>
              <h2 className="modern-modal-title">Review Order #{order.orderId}</h2>
              <p className="modal-subtitle">Update status and shipping details</p>
            </div>
          </div>
          <button onClick={onClose} className="modern-close-button">
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="modern-modal-body">
          
          {/* Status Selection */}
          <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
            <label className="modern-label">Order Status</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'pending', label: 'Pending', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20', icon: FiClock },
                { value: 'paid', label: 'Paid', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20', icon: FiCheckCircle },
                { value: 'processing', label: 'Processing', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20', icon: FiClock },
                { value: 'shipped', label: 'Shipped', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20', icon: FiTruck },
                { value: 'delivered', label: 'Delivered', color: 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20', icon: FiCheckCircle },
                { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20', icon: FiAlertCircle }
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setData({ ...data, status: opt.value })}
                    className={`relative px-4 py-4 rounded-2xl border text-left transition-all duration-200 group ${
                      data.status === opt.value 
                        ? `${opt.color} ring-1 ring-inset shadow-inner` 
                        : 'bg-[var(--background-secondary)] border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface)] hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Icon className={data.status === opt.value ? "" : "opacity-50"} />
                         <span className={`font-bold text-sm ${data.status === opt.value ? '' : 'group-hover:text-[var(--foreground)]'}`}>{opt.label}</span>
                      </div>
                      {data.status === opt.value && <FiCheckCircle className="text-lg" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shipping Details (Conditional) */}
          {(data.status === 'shipped' || data.status === 'delivered') && (
            <div className="modern-form-section animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)', marginTop: '1.5rem' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-4 flex items-center gap-2">
                <FiTruck /> Shipping Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="modern-label required">Tracking Number</label>
                    <input
                      type="text"
                      value={data.trackingNumber}
                      onChange={(e) => setData({ ...data, trackingNumber: e.target.value })}
                      placeholder="e.g. MY123456789"
                      className="modern-input"
                    />
                  </div>
                  <div>
                    <label className="modern-label">Carrier</label>
                    <input
                      type="text"
                      value={data.shippingCarrier}
                      onChange={(e) => setData({ ...data, shippingCarrier: e.target.value })}
                      placeholder="e.g. PosLaju, J&T"
                      className="modern-input"
                    />
                  </div>
                </div>

                <div>
                   <label className="modern-label">Estimated Delivery Date</label>
                   <input
                     type="date"
                     value={data.estimatedDelivery}
                     onChange={(e) => setData({ ...data, estimatedDelivery: e.target.value })}
                     className="modern-input"
                   />
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes */}
          <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)', marginTop: '1.5rem' }}>
            <label className="modern-label">Internal Notes</label>
            <textarea
              rows={3}
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Add notes about this order..."
              className="modern-textarea"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="modern-modal-footer">
          <div className="modal-footer-left">
             {/* Optional status text */}
          </div>
          <div className="modal-footer-right">
            <button onClick={onClose} className="modern-btn modern-btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="modern-btn modern-btn-primary">
              {loading ? 'Saving...' : 'Update Order'}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default PurchaseReviewModal;