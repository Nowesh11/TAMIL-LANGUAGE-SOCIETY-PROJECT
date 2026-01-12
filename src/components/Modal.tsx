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
    sm: '520px',
    md: '720px',
    lg: '980px',
  };

  function handleBackdropClick() {
    if (dismissOnBackdrop) onClose();
  }

  return (
    <div
      className="modern-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={handleBackdropClick}
    >
      <div
        className="modern-modal-container"
        style={{ maxWidth: sizes[size], width: 'min(100%, var(--modal-w, 100%))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modern-modal-header">
          <div className="modal-title-section">
            {title && (<h2 id={titleId} className="modern-modal-title">{title}</h2>)}
          </div>
          <button aria-label="Close" className="modern-close-button" onClick={onClose}>✕</button>
        </div>
        <div className="modern-modal-body">{children}</div>
      </div>
    </div>
  );
}