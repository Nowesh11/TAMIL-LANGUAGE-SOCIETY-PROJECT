"use client";
import { useMemo, useState } from 'react';
import '../styles/components/MiniCart.css';

type CartItem = { bookId: string; title: { en: string; ta?: string }; price: number; quantity: number };

export default function MiniCart({ items, onItemsChange, onGoToCheckout }: {
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onGoToCheckout?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const count = useMemo(() => items.reduce((sum, it) => sum + it.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.price * it.quantity, 0), [items]);

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
    <div className="mini-cart">
      <button
        aria-label="Open cart"
        onClick={() => setOpen(true)}
        className="mini-cart-trigger fixed bottom-6 right-6 z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="mini-cart-icon"
        >
          <path
            d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-2-8H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
          <circle cx="17" cy="19" r="1" stroke="currentColor" strokeWidth="2" />
        </svg>
        {count > 0 && (
          <span className={`mini-cart-badge ${count > 0 ? 'pulse' : ''}`}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="mini-cart-header">
              <div className="mini-cart-title">Your Cart</div>
              <button className="mini-cart-close" onClick={() => setOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="mini-cart-items">
              {!items.length && (
                <div className="mini-cart-empty">
                  <svg className="mini-cart-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13l-2-8H3" />
                    <circle cx="9" cy="19" r="1" />
                    <circle cx="17" cy="19" r="1" />
                  </svg>
                  <div className="mini-cart-empty-text">Your cart is empty.</div>
                  <a href="/books" className="mini-cart-empty-btn">Browse Books</a>
                </div>
              )}
              {items.map((it) => (
                <div key={it.bookId} className="mini-cart-item">
                  <div className="mini-cart-item-image" style={{ backgroundColor: '#f3f4f6' }}></div>
                  <div className="mini-cart-item-details">
                    <div className="mini-cart-item-title">{
                      typeof it.title === 'string' 
                        ? it.title 
                        : it.title?.en || 'Book'
                    }</div>
                    <div className="mini-cart-item-meta">
                      <span className="mini-cart-item-price">RM {(it.price || 0).toFixed(2)}</span>
                      <span className="mini-cart-item-quantity">Qty: {it.quantity}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800" onClick={() => dec(it.bookId)}>-</button>
                    <div className="w-7 text-center text-sm">{it.quantity}</div>
                    <button className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800" onClick={() => inc(it.bookId)}>+</button>
                    <button className="mini-cart-item-remove" onClick={() => remove(it.bookId)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mini-cart-footer">
              <div className="mini-cart-total">
                <span className="mini-cart-total-label">Subtotal</span>
                <span className="mini-cart-total-amount">RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="mini-cart-actions">
                <button className="mini-cart-btn mini-cart-btn-secondary" onClick={() => setOpen(false)}>Continue Shopping</button>
                <button className="mini-cart-btn mini-cart-btn-primary" onClick={() => { setOpen(false); onGoToCheckout && onGoToCheckout(); }}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}