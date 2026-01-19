"use client";
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import CartCheckout from './CartCheckout';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl bg-[#0a0a0f]/95 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto card-morphism backdrop-blur-xl">
        {/* Modern Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]/95 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FaShoppingCart className="text-cyan-400" />
              Checkout
            </h2>
            <p className="text-gray-400 text-sm mt-1">Complete your purchase</p>
          </div>
          <button 
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all" 
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6">
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