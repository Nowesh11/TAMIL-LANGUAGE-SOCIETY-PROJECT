import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Star, AlertCircle, Clock, FileText } from 'lucide-react';

interface RecruitmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: any;
  onSave: (data: any) => Promise<void>;
}

const RecruitmentReviewModal: React.FC<RecruitmentReviewModalProps> = ({ isOpen, onClose, response, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    status: 'pending',
    priority: 'medium',
    rating: 0,
    notes: ''
  });

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

  if (!isOpen || !response) return null;

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

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <CheckCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Review Application</h2>
              <p className="text-sm text-gray-400 mt-0.5">Update status and add internal notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Application Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 'pending', label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                { value: 'approved', label: 'Approved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                { value: 'rejected', label: 'Rejected', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                { value: 'shortlisted', label: 'Shortlist', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setData({ ...data, status: opt.value })}
                  className={`px-3 py-3 rounded-xl border text-center transition-all duration-200 ${
                    data.status === opt.value 
                      ? `${opt.color} ring-1 ring-inset shadow-inner` 
                      : 'bg-black/40 border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span className="font-semibold text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Priority Level</label>
              <div className="flex flex-col gap-2">
                {['low', 'medium', 'high'].map((p) => (
                  <label key={p} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    data.priority === p 
                      ? 'bg-purple-500/10 border-purple-500/50' 
                      : 'bg-black/40 border-white/10 hover:bg-white/5'
                  }`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      data.priority === p ? 'border-purple-400' : 'border-gray-500'
                    }`}>
                      {data.priority === p && <div className="w-2 h-2 rounded-full bg-purple-400"></div>}
                    </div>
                    <input 
                      type="radio" 
                      name="priority" 
                      value={p} 
                      checked={data.priority === p}
                      onChange={(e) => setData({ ...data, priority: e.target.value })}
                      className="hidden"
                    />
                    <span className={`text-sm font-medium capitalize ${data.priority === p ? 'text-purple-300' : 'text-gray-400'}`}>
                      {p} Priority
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Candidate Rating</label>
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center h-[164px]">
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setData({ ...data, rating: star })}
                      className={`text-3xl transition-all hover:scale-110 p-1 focus:outline-none ${
                        star <= data.rating ? 'text-yellow-400 drop-shadow-lg shadow-yellow-500/20' : 'text-gray-700 hover:text-yellow-500/50'
                      }`}
                    >
                      <Star size={32} fill={star <= data.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  {data.rating > 0 ? `${data.rating} out of 5 stars` : 'Not rated'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Internal Notes</label>
            <textarea
              rows={4}
              value={data.notes}
              onChange={(e) => setData({ ...data, notes: e.target.value })}
              placeholder="Add private notes about this application..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
          >
            {loading ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RecruitmentReviewModal;
