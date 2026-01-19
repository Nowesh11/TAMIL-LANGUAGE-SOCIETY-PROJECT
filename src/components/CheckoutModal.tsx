"use client";
import { FaTimes, FaShoppingCart } from 'react-icons/fa';
import CartCheckout from './CartCheckout';
import { useTheme } from '../hooks/ThemeContext';

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

  const { isDark } = (() => {
    try { return useTheme(); } catch { return { isDark: false } as any; }
  })();

  return (
    <div className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 ${isDark ? 'bg-background/80' : 'bg-black/60'} backdrop-blur-md animate-fade-in`}>
      <div className="w-full max-w-5xl bg-surface/95 border border-border/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto card-morphism backdrop-blur-xl">
        {/* Modern Modal Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-border/50 bg-surface backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FaShoppingCart className="text-primary" />
              Checkout
            </h2>
            <p className="text-foreground-secondary text-sm mt-1">Complete your purchase</p>
          </div>
          <button 
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-white/10 rounded-full transition-all" 
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
