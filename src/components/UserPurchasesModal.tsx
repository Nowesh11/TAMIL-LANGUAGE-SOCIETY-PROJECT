"use client";
import { useEffect } from 'react';
import UserPurchases from './UserPurchases';
import '../styles/components/Modal.css';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container purchases-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">My Purchases</h2>
          <button 
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close purchases"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="modal-content">
          <UserPurchases />
        </div>
      </div>
    </div>
  );
}