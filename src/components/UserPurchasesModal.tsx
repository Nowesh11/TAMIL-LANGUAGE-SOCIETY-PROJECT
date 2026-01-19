"use client";
import { useEffect } from 'react';
import UserPurchases from './UserPurchases';

interface UserPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserPurchasesModal({ isOpen, onClose }: UserPurchasesModalProps) {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-surface/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FaHistory className="text-primary" />
              {lang === 'en' ? 'My Purchases' : 'எனது கொள்முதல்'}
            </h2>
            <p className="text-foreground-secondary text-sm mt-1">
              {lang === 'en' ? 'Track your orders' : 'உங்கள் ஆர்டர்களைக் கண்காணிக்கவும்'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-foreground-secondary hover:text-error hover:bg-error/10 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-background/50">
          <UserPurchases />
        </div>
      </div>
    </div>
  );
}