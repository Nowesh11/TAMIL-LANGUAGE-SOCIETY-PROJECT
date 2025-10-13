"use client";
import { useMemo, useState } from 'react';

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
    <>
      <button
        aria-label="Open cart"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-black/80 text-white shadow-lg hover:shadow-xl transition-all px-5 py-4 flex items-center gap-2 backdrop-blur"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="w-5 h-5"
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
        <span className="text-sm font-semibold">{count}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="font-semibold">Your Cart</div>
              <button className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!items.length && (
                <div className="p-4 text-sm text-slate-500">Your cart is empty.</div>
              )}
              {items.map((it) => (
                <div key={it.bookId} className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{it.title?.en || 'Book'}</div>
                    <div className="text-xs text-slate-500">RM {(it.price || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800" onClick={() => dec(it.bookId)}>-</button>
                    <div className="w-7 text-center text-sm">{it.quantity}</div>
                    <button className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800" onClick={() => inc(it.bookId)}>+</button>
                    <button className="text-red-600 text-sm" onClick={() => remove(it.bookId)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-sm mb-3">
                <span>Subtotal</span>
                <span className="font-semibold">RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <button className="flex-1 px-3 py-2 rounded bg-slate-100 dark:bg-slate-800" onClick={() => setOpen(false)}>Continue</button>
                <button className="flex-1 px-3 py-2 rounded bg-black text-white" onClick={() => { setOpen(false); onGoToCheckout && onGoToCheckout(); }}>Checkout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}