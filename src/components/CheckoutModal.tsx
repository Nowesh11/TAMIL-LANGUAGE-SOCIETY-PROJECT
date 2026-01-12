"use client";
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import CartCheckout from './CartCheckout';
// Using unified modern modal styles (imported globally in layout)

type CartItem = { bookId: string; title: { en: string; ta?: string }; price: number; quantity: number };

export default function CheckoutModal({
  open,
  onClose,
  items,
  onItemsChange,
  onOrderPlaced,
}: {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (result: any) => void;
}) {
  if (!open) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '900px' }}>
        {/* Modern Modal Header */}
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              <FaShoppingCart className="inline mr-3" />
              Checkout
            </h2>
            <p className="modal-subtitle">Complete your purchase</p>
          </div>
          <button className="modern-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="modern-modal-body">
          <CartCheckout 
            items={items} 
            onItemsChange={onItemsChange}
            onOrderPlaced={onOrderPlaced}
          />
        </div>
      </div>
    </div>
  );
}