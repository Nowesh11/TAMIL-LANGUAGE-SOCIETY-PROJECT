"use client";
import { useMemo, useState, useEffect } from 'react';
import '../styles/components/MiniCart.css';
import { FaShoppingCart, FaShoppingBag, FaTimes, FaMinus, FaPlus, FaTrash } from 'react-icons/fa';

type CartItem = { bookId: string; title: { en: string; ta?: string }; price: number; quantity: number };

export default function MiniCart({ items, onItemsChange, onGoToCheckout, onOpenPurchases }: {
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onGoToCheckout?: () => void;
  onOpenPurchases?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const count = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);

  useEffect(() => {
    // Fetch purchase count
    const fetchPurchases = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const res = await fetch('/api/purchases', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setPurchasesCount(data.items.length);
        }
      } catch (e) {
        console.error('Failed to fetch purchase count', e);
      }
    };
    fetchPurchases();
  }, []);

  function inc(bookId: string) {
    onItemsChange(items.map((it) => it.bookId === bookId ? { ...it, quantity: it.quantity + 1 } : it));
  }
  function dec(bookId: string) {
    onItemsChange(items.map((it) => it.bookId === bookId ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
  }
  function remove(bookId: string) {
    onItemsChange(items.filter((it) => it.bookId !== bookId));
  }

  return (
    <div style={{ position: 'relative', zIndex: 9999 }}>
      {/* Floating Action Buttons */}
      <div 
        className="fixed flex flex-col gap-5" 
        style={{ 
          bottom: '40px', 
          right: '40px', 
          zIndex: 9999,
          pointerEvents: 'auto' 
        }}
      >
        {/* Purchases Button */}
        <button
          onClick={onOpenPurchases}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 text-white shadow-2xl hover:scale-110 hover:shadow-violet-500/50 transition-all duration-300 flex items-center justify-center border border-white/20 relative group backdrop-blur-sm"
          title="My Purchases"
        >
          <FaShoppingBag size={24} className="drop-shadow-sm" />
          {purchasesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-bounce">
              {purchasesCount}
            </span>
          )}
          <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-transform border border-white/10">
            My Purchases
          </span>
        </button>

        {/* Cart Button */}
        <button
          onClick={() => setOpen(true)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl hover:scale-110 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center border border-white/20 relative group backdrop-blur-sm"
          title="View Cart"
        >
          <FaShoppingCart size={24} className="drop-shadow-sm" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-bounce">
              {count}
            </span>
          )}
          <span className="absolute right-full mr-4 bg-black/80 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl transform translate-x-2 group-hover:translate-x-0 transition-transform border border-white/10">
            View Cart
          </span>
        </button>
      </div>

      {/* Mini Cart Modal */}
      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)}>
          <div 
            className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden card-morphism" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FaShoppingCart className="text-primary" />
                  Your Cart
                </h2>
                <p className="text-gray-400 text-sm">{items.length} items in cart</p>
              </div>
              <button 
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all" 
                onClick={() => setOpen(false)}
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {!items.length ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600 border border-white/10">
                    <FaShoppingCart size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Your cart is empty</h3>
                  <p className="text-gray-400 mb-6 text-sm">Looks like you haven't added any books yet.</p>
                  <button 
                    onClick={() => setOpen(false)}
                    className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((it) => (
                    <div key={it.bookId} className="bg-white/5 p-4 rounded-xl flex gap-4 items-center border border-white/10 hover:border-primary/30 transition-colors group">
                      <div className="w-12 h-16 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 border border-white/5">
                        <FaShoppingCart size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white truncate text-sm mb-1 group-hover:text-primary transition-colors">
                          {typeof it.title === 'string' ? it.title : it.title?.en || 'Book'}
                        </h4>
                        <div className="text-primary font-bold text-sm">
                          RM {(it.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                            <button onClick={() => dec(it.bookId)} className="p-1.5 hover:text-primary text-gray-400 transition-colors"><FaMinus size={8} /></button>
                            <span className="text-xs font-bold text-white w-4 text-center">{it.quantity}</span>
                            <button onClick={() => inc(it.bookId)} className="p-1.5 hover:text-primary text-gray-400 transition-colors"><FaPlus size={8} /></button>
                         </div>
                         <button onClick={() => remove(it.bookId)} className="text-red-400 hover:text-red-300 p-1 transition-colors" title="Remove">
                           <FaTrash size={12} />
                         </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-md">
                <div className="flex justify-between items-center w-full mb-4">
                  <span className="text-gray-400 font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-primary">RM {subtotal.toFixed(2)}</span>
                </div>
                <button 
                  className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  onClick={() => { setOpen(false); onGoToCheckout && onGoToCheckout(); }}
                >
                  <FaShoppingCart />
                  Checkout Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}