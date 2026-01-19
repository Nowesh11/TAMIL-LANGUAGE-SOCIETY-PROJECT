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
        className={`w-full ${sizeClasses[size]} bg-surface/95 border border-border/50 rounded-2xl shadow-2xl backdrop-blur-xl animate-slide-in-up flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-surface sticky top-0 z-10">
          <h2 id={titleId} className="text-xl font-bold text-foreground">
            {title}
          </h2>
          <button 
            aria-label="Close" 
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-hover hover:bg-white/10 text-foreground-secondary hover:text-white transition-colors"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar text-foreground-secondary">
          {children}
        </div>
      </div>
    </div>
  );
  return createPortal(overlay, document.body);
}
