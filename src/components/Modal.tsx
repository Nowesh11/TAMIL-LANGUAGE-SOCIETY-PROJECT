"use client";
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../hooks/ThemeContext';

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  dismissOnBackdrop = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  dismissOnBackdrop?: boolean;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { isDark } = (() => {
    try { return useTheme(); } catch { return { isDark: false } as any; }
  })();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full m-4'
  };

  const overlay = (
    <div
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 ${isDark ? 'bg-background/80' : 'bg-black/60'} backdrop-blur-md animate-fade-in`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={dismissOnBackdrop ? onClose : undefined}
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-surface border-2 border-border rounded-3xl shadow-2xl backdrop-blur-2xl animate-slide-in-up flex flex-col max-h-[95vh] overflow-hidden card-morphism`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-surface-hover/50 sticky top-0 z-10">
          <h2 id={titleId} className="text-2xl font-black text-foreground uppercase tracking-tighter">
            {title}
          </h2>
          <button 
            aria-label="Close" 
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface hover:bg-error/10 text-foreground-secondary hover:text-error transition-all border border-border shadow-sm active:scale-95"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar text-foreground-secondary font-medium">
          {children}
        </div>
      </div>
    </div>
  );
  return createPortal(overlay, document.body);
}
