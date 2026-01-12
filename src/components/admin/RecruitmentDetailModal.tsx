import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiUsers, FiMail, FiPhone, FiCalendar, FiCheckCircle, FiStar, FiFileText, FiDownload } from 'react-icons/fi';
import '../../styles/admin/modals.css';

interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'shortlisted';
  priority: 'low' | 'medium' | 'high';
  rating?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  responses: Record<string, any>;
  attachments?: string[];
  ipAddress?: string;
  userAgent?: string;
}

interface RecruitmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: FormResponse | null;
  onReview: (response: FormResponse) => void;
}

const RecruitmentDetailModal: React.FC<RecruitmentDetailModalProps> = ({ isOpen, onClose, response, onReview }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !isOpen || !response) return null;

  return createPortal(
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '1100px' }}>
        
        {/* Header */}
        <div className="modern-modal-header">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold text-2xl shadow-inner">
              {response.submitterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="modern-modal-title">{response.submitterName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="modal-subtitle bg-[var(--background-secondary)] px-2 py-1 rounded-lg border border-[var(--border)]">
                  {response.formTitle}
                </p>
                <span className="w-1 h-1 rounded-full bg-[var(--foreground-muted)]"></span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  response.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  response.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                  response.status === 'shortlisted' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{response.status}</span>
              </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-5 flex items-center gap-2">
                  <FiUsers className="text-indigo-500" /> Contact Details
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <FiMail size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--foreground-muted)] font-medium">Email Address</p>
                      <a href={`mailto:${response.submitterEmail}`} className="text-xs font-bold text-[var(--foreground)] hover:text-indigo-500 transition-colors truncate block">
                        {response.submitterEmail}
                      </a>
                    </div>
                  </div>
                  {response.submitterPhone && (
                    <div className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <FiPhone size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-[var(--foreground-muted)] font-medium">Phone Number</p>
                        <a href={`tel:${response.submitterPhone}`} className="text-xs font-bold text-[var(--foreground)] hover:text-indigo-500 transition-colors block">
                          {response.submitterPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <FiCalendar size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-[var(--foreground-muted)] font-medium">Submitted On</p>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        {new Date(response.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="modern-form-section" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-5 flex items-center gap-2">
                  <FiCheckCircle className="text-indigo-500" /> Application Status
                </h3>
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)]">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-medium text-[var(--foreground-muted)]">Current Status</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        response.status === 'approved' ? 'text-emerald-500' :
                        response.status === 'rejected' ? 'text-rose-500' :
                        response.status === 'shortlisted' ? 'text-indigo-500' :
                        'text-amber-500'
                      }`}>{response.status}</span>
                    </div>
                    <div className="w-full bg-[var(--border)] rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        response.status === 'approved' ? 'bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                        response.status === 'rejected' ? 'bg-rose-500 w-full shadow-[0_0_10px_rgba(244,63,94,0.4)]' :
                        response.status === 'shortlisted' ? 'bg-indigo-500 w-3/4 shadow-[0_0_10px_rgba(99,102,241,0.4)]' :
                        'bg-amber-500 w-1/4 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      }`}></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-[var(--foreground-muted)] font-medium mb-2">Priority Level</p>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map((p) => (
                        <div key={p} className={`flex-1 h-2 rounded-full ${
                          response.priority === p 
                            ? (p === 'high' ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : p === 'medium' ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'bg-emerald-500 shadow-lg shadow-emerald-500/30')
                            : 'bg-[var(--background-secondary)]'
                        }`} />
                      ))}
                    </div>
                    <p className="text-right text-[10px] font-bold uppercase mt-1 text-[var(--foreground)]">{response.priority} Priority</p>
                  </div>

                  {response.reviewNotes && (
                    <div className="pt-4 border-t border-[var(--border)]">
                      <p className="text-[10px] text-[var(--foreground-muted)] font-medium mb-2">Review Notes</p>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 relative">
                        <div className="absolute top-0 left-4 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full"></div>
                        <p className="text-xs text-amber-600/90 italic leading-relaxed">"{response.reviewNotes}"</p>
                        {response.rating && (
                          <div className="flex items-center gap-1 mt-3 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className={i < (response.rating || 0) ? "fill-current drop-shadow-sm" : "opacity-30"} size={12} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Responses */}
            <div className="lg:col-span-2 space-y-6">
              <div className="modern-form-section" style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
                <h3 className="section-title mb-8 flex items-center gap-3 pb-4 border-b border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
                    <FiFileText />
                  </div>
                  Application Responses
                </h3>
                
                <div className="space-y-8">
                  {Object.entries(response.responses).map(([key, value], index) => (
                    <div key={key} className="group relative pl-6 border-l-2 border-[var(--border)] hover:border-indigo-500 transition-colors">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--background-secondary)] border-2 border-[var(--border)] group-hover:border-indigo-500 transition-colors"></div>
                      <p className="text-xs font-bold text-[var(--foreground-muted)] mb-2 uppercase tracking-wide">
                        {key}
                      </p>
                      <div className="p-5 bg-[var(--background-secondary)] rounded-2xl border border-[var(--border)] text-[var(--foreground)] text-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                        {typeof value === 'object' ? (
                          <div className="grid grid-cols-1 gap-2">
                             {Object.entries(value).map(([subKey, subVal]) => (
                               <div key={subKey} className="flex justify-between border-b border-[var(--border)] last:border-0 pb-1 last:pb-0">
                                 <span className="font-medium text-xs text-[var(--foreground-muted)]">{subKey}:</span>
                                 <span className="font-semibold text-xs text-[var(--foreground)]">{String(subVal)}</span>
                               </div>
                             ))}
                          </div>
                        ) : (
                          String(value).split('\n').map((line, i) => (
                            <p key={i} className="mb-1 last:mb-0 leading-relaxed">{line}</p>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {response.attachments && response.attachments.length > 0 && (
                <div className="modern-form-section" style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '1rem', background: 'var(--surface)' }}>
                  <h3 className="section-title mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
                      <FiDownload />
                    </div>
                    Attachments
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {response.attachments.map((url, idx) => {
                      let fileUrl = url;
                      if (fileUrl.startsWith('uploads/') || fileUrl.startsWith('/uploads/')) {
                        const cleanPath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
                        fileUrl = `/api/files/serve?path=${encodeURIComponent(cleanPath)}`;
                      } else if (!fileUrl.startsWith('http') && !fileUrl.startsWith('/')) {
                        fileUrl = `/${fileUrl}`;
                      }

                      return (
                      <a 
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)] hover:border-emerald-500 hover:shadow-lg transition-all bg-[var(--background-secondary)] hover:bg-[var(--surface)] group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <FiFileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-emerald-600 transition-colors">Attachment {idx + 1}</p>
                          <p className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider font-bold">Click to view</p>
                        </div>
                      </a>
                    )})}
                  </div>
                </div>
              )}
            </div>
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
            >
              Close
            </button>
            <button 
              onClick={() => {
                onClose();
                onReview(response);
              }}
              className="modern-btn modern-btn-primary"
            >
              Review Application
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecruitmentDetailModal;