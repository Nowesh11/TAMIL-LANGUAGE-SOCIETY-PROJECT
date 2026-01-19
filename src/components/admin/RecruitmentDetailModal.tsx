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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100000] p-4 animate-fade-in">
      <div className="w-full max-w-6xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col relative overflow-hidden text-white animate-scale-in">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10 bg-[#0a0a0f] relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl shadow-inner border border-indigo-500/30">
              {response.submitterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{response.submitterName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-400 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  {response.formTitle}
                </p>
                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  response.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  response.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  response.status === 'shortlisted' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                  'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>{response.status}</span>
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
            
            {/* Sidebar Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Info */}
              <div className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiUsers className="text-indigo-400" /> Contact Details
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors border border-indigo-500/20">
                      <FiMail size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Email Address</p>
                      <a href={`mailto:${response.submitterEmail}`} className="text-sm font-bold text-white hover:text-indigo-400 transition-colors truncate block">
                        {response.submitterEmail}
                      </a>
                    </div>
                  </div>
                  {response.submitterPhone && (
                    <div className="flex items-start gap-3 group">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors border border-indigo-500/20">
                        <FiPhone size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Phone Number</p>
                        <a href={`tel:${response.submitterPhone}`} className="text-sm font-bold text-white hover:text-indigo-400 transition-colors block">
                          {response.submitterPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors border border-indigo-500/20">
                      <FiCalendar size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Submitted On</p>
                      <p className="text-sm font-bold text-white">
                        {new Date(response.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Card */}
              <div className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                  <FiCheckCircle className="text-indigo-400" /> Application Status
                </h3>
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-black/20 border border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Current Status</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        response.status === 'approved' ? 'text-emerald-400' :
                        response.status === 'rejected' ? 'text-rose-400' :
                        response.status === 'shortlisted' ? 'text-indigo-400' :
                        'text-amber-400'
                      }`}>{response.status}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        response.status === 'approved' ? 'bg-emerald-500 w-full shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                        response.status === 'rejected' ? 'bg-rose-500 w-full shadow-[0_0_10px_rgba(244,63,94,0.4)]' :
                        response.status === 'shortlisted' ? 'bg-indigo-500 w-3/4 shadow-[0_0_10px_rgba(99,102,241,0.4)]' :
                        'bg-amber-500 w-1/4 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      }`}></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Priority Level</p>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map((p) => (
                        <div key={p} className={`flex-1 h-2 rounded-full transition-all ${
                          response.priority === p 
                            ? (p === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : p === 'medium' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]')
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                    <p className="text-right text-[10px] font-bold uppercase mt-1 text-gray-300">{response.priority} Priority</p>
                  </div>

                  {response.reviewNotes && (
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[10px] text-gray-400 font-medium mb-2 uppercase tracking-wide">Review Notes</p>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 relative">
                        <div className="absolute top-0 left-4 -translate-y-1/2 w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
                        <p className="text-xs text-amber-200/90 italic leading-relaxed">"{response.reviewNotes}"</p>
                        {response.rating && (
                          <div className="flex items-center gap-1 mt-3 text-amber-400">
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
              <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 pb-4 border-b border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">
                    <FiFileText />
                  </div>
                  Application Responses
                </h3>
                
                <div className="space-y-8">
                  {Object.entries(response.responses).map(([key, value], index) => (
                    <div key={key} className="group relative pl-6 border-l-2 border-white/10 hover:border-indigo-500 transition-colors">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#0a0a0f] border-2 border-white/10 group-hover:border-indigo-500 transition-colors"></div>
                      <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">
                        {key}
                      </p>
                      <div className="p-5 bg-black/20 rounded-2xl border border-white/10 text-gray-200 text-sm group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition-all duration-300 group-hover:-translate-y-1">
                        {typeof value === 'object' ? (
                          <div className="grid grid-cols-1 gap-2">
                             {Object.entries(value).map(([subKey, subVal]) => (
                               <div key={subKey} className="flex justify-between border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                 <span className="font-medium text-xs text-gray-500">{subKey}:</span>
                                 <span className="font-semibold text-xs text-gray-300">{String(subVal)}</span>
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
                <div className="p-8 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-sm shadow-lg shadow-emerald-500/20">
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
                        className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all bg-black/20 hover:bg-black/40 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                          <FiFileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-200 truncate group-hover:text-emerald-400 transition-colors">Attachment {idx + 1}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold group-hover:text-gray-400">Click to view</p>
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
        <div className="flex items-center justify-end gap-4 p-6 border-t border-white/10 bg-[#0a0a0f] sticky bottom-0">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 hover:text-white transition-all"
            >
              Close
            </button>
            <button 
              onClick={() => {
                onClose();
                onReview(response);
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/20 transition-all"
            >
              Review Application
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RecruitmentDetailModal;