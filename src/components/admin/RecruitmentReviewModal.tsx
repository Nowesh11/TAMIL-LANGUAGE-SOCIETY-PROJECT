import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiCheckCircle, FiStar } from 'react-icons/fi';
import '../../styles/admin/modals.css';

interface RecruitmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: any;
  onSave: (data: any) => Promise<void>;
}

const RecruitmentReviewModal: React.FC<RecruitmentReviewModalProps> = ({ isOpen, onClose, response, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState({
    status: 'pending',
    priority: 'medium',
    rating: 0,
    notes: ''
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (response) {
      setData({
        status: response.status || 'pending',
        priority: response.priority || 'medium',
        rating: response.rating || 0,
        notes: response.reviewNotes || ''
      });
    }
  }, [response]);

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

  if (!mounted || !isOpen || !response) return null;

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
              <h2 className="modern-modal-title">Review Application</h2>
              <p className="modal-subtitle">Update status and add internal notes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="modern-close-button"
          >
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="modern-modal-body">
          {/* Status Selection */}
          <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
            <label className="modern-label">Application Status</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'pending', label: 'Pending', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' },
                { value: 'approved', label: 'Approved', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20' },
                { value: 'rejected', label: 'Rejected', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20' },
                { value: 'shortlisted', label: 'Shortlisted', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500/20' }
              ].map((opt) => (
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
                    <span className={`font-bold text-sm ${data.status === opt.value ? '' : 'group-hover:text-[var(--foreground)]'}`}>{opt.label}</span>
                    {data.status === opt.value && <FiCheckCircle className="text-lg" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Priority */}
            <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)', margin: 0 }}>
              <label className="modern-label">Priority Level</label>
              <div className="flex flex-col gap-3">
                {['low', 'medium', 'high'].map((p) => (
                  <label key={p} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    data.priority === p 
                      ? 'bg-[var(--background-secondary)] border-indigo-500 shadow-sm' 
                      : 'border-transparent hover:bg-[var(--background-secondary)]'
                  }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      data.priority === p 
                        ? 'border-indigo-500' 
                        : 'border-[var(--foreground-muted)]'
                    }`}>
                      {data.priority === p && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p} 
                      checked={data.priority === p}
                      onChange={(e) => setData({ ...data, priority: e.target.value })}
                      className="hidden"
                    />
                    <span className="text-sm font-bold capitalize text-[var(--foreground)]">{p} Priority</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)', margin: 0 }}>
              <label className="modern-label">Candidate Rating</label>
              <div className="flex flex-col items-center justify-center h-full pb-2">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setData({ ...data, rating: star })}
                      className={`text-3xl transition-all hover:scale-110 p-1 ${
                        star <= data.rating ? 'text-amber-400 drop-shadow-sm' : 'text-[var(--border)] hover:text-amber-200'
                      }`}
                    >
                      <FiStar className={star <= data.rating ? "fill-current" : ""} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-3 py-1 rounded-full">
                  {data.rating > 0 ? `${data.rating} out of 5 stars` : 'Not rated'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
            <label className="modern-label">Internal Notes</label>
            <textarea
              rows={4}
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Add private notes about this application..."
              className="modern-textarea"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modern-modal-footer">
          <div className="modal-footer-left">
            {/* Empty left side */}
          </div>
          <div className="modal-footer-right">
            <button 
              onClick={onClose} 
              className="modern-btn modern-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="modern-btn modern-btn-primary"
            >
              {loading ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecruitmentReviewModal;