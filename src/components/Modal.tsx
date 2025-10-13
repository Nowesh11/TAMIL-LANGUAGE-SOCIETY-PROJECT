"use client";
import { useEffect, useId } from 'react';

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
  size?: 'sm' | 'md' | 'lg';
  dismissOnBackdrop?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
  };

  function handleBackdropClick() {
    if (dismissOnBackdrop) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />
      <div
        className={`relative w-full ${sizes[size]} mx-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="layout-card shadow-2xl transition-all duration-200 ease-out translate-y-0 opacity-100">
          {title && (
            <div className="flex items-center justify-between mb-2">
              <h3 id={titleId} className="section-title">{title}</h3>
              <button aria-label="Close" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          )}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}