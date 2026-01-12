"use client";
import { useEffect } from 'react';
import CartCheckout from './CartCheckout';
import '../styles/components/Modal.css';

type CartItem = { 
  bookId: string; 
  title: { en: string; ta?: string }; 
  price: number; 
  quantity: number 
};

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (res: any) => void;
}

export default function CartModal({ 
  isOpen, 
  onClose, 
  items, 
  onItemsChange, 
  onOrderPlaced 
}: CartModalProps) {
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

  const handleOrderPlaced = (res: any) => {
    onOrderPlaced(res);
    onClose(); // Close modal after successful order
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container cart-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Shopping Cart & Checkout</h2>
          <button 
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close cart"
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
          <CartCheckout 
            items={items} 
            onItemsChange={onItemsChange} 
            onOrderPlaced={handleOrderPlaced} 
          />
        </div>
      </div>
    </div>
  );
}