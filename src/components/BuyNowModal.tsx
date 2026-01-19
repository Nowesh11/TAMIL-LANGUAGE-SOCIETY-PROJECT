"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { FaTimes, FaShoppingCart, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useTheme } from '../hooks/ThemeContext';

type Bilingual = { en: string; ta: string };
type Book = { _id: string; title: Bilingual; price: number };

export default function BuyNowModal({ book, open, onClose, onPurchased }: {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onPurchased: (result: any) => void;
}) {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [method, setMethod] = useState<'epayum' | 'fpx'>('epayum');
  const [qty, setQty] = useState(1);
  const [shipping, setShipping] = useState({
    fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'Malaysia', phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  useEffect(() => { if (open) fetchSettings(); }, [open]);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const active = data.settings.activePaymentMethods || [];
        if (active.includes('epayum')) setMethod('epayum'); else if (active.includes('fpx')) setMethod('fpx');
      }
    } catch (e) { console.error('Failed to load payment settings', e); }
  }

  const subtotal = useMemo(() => (book?.price || 0) * qty, [book, qty]);
  const tax = useMemo(() => settings ? (subtotal * (settings.taxRate || 0)) / 100 : 0, [subtotal, settings]);
  const shippingFee = useMemo(() => {
    if (!settings) return 0;
    const threshold = settings.shipping?.freeShippingThreshold;
    const fee = settings.shipping?.fee || 0;
    return threshold && subtotal >= threshold ? 0 : fee;
  }, [settings, subtotal]);
  const finalTotal = useMemo(() => subtotal + tax + shippingFee, [subtotal, tax, shippingFee]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setReceiptFile(file);
      setUploadStatus('idle');
    }
  };

  async function uploadReceipt(file: File): Promise<string | null> {
    if (!file) return null;
    
    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('accessToken');
    let userId = 'anonymous';
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.userId || 'anonymous';
      } catch (e) {
        console.warn('Could not parse user ID from token');
      }
    }
    formData.append('userId', userId);
    
    const tempOrderId = `temp_${Date.now()}`;
    formData.append('orderId', tempOrderId);
    
    try {
      const response = await fetch('/api/upload/buynow', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        setUploadStatus('success');
        return result.filePath;
      } else {
        setUploadStatus('error');
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setUploadStatus('error');
      console.error('File upload error:', error);
      throw error;
    }
  }

  async function submit() {
    if (!book) return;
    setSubmitting(true);
    try {
      let receiptPath = null;
      if (receiptFile) {
        receiptPath = await uploadReceipt(receiptFile);
      }

      const payload = {
        method,
        items: [{ bookId: book._id, quantity: qty }],
        shippingAddress: shipping,
        receiptPath,
      };
      
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch('/api/purchases', { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Purchase failed');
      onPurchased(data);
      onClose();
    } catch (e) {
      console.error('Buy Now error', e);
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open || !book) return null;
  const { isDark } = (() => {
    try { return useTheme(); } catch { return { isDark: false } as any; }
  })();
  return (
    <div className={`fixed inset-0 z-[100000] flex items-center justify-center p-4 ${isDark ? 'bg-background/80' : 'bg-black/60'} backdrop-blur-md animate-fade-in`} onClick={onClose}>
      <div 
        className="w-full max-w-4xl bg-surface/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FaShoppingCart className="text-primary" />
              {lang === 'en' ? 'Complete Your Purchase' : 'உங்கள் கொள்முதலை முடிக்கவும்'}
            </h2>
            <p className="text-foreground-secondary text-sm mt-1">
              {lang === 'en' ? 'Secure checkout process' : 'பாதுகாப்பான கட்டணம் செலுத்துதல்'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-foreground-secondary hover:text-error hover:bg-error/10 transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Book Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Order Details</h3>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
              <div className="font-medium text-white text-lg">{
                typeof book.title === 'string' 
                  ? book.title 
                  : book.title?.[lang] || book.title?.en || 'Book'
              }</div>
              <div className="font-bold text-xl text-purple-400">RM {(book.price || 0).toFixed(2)}</div>
            </div>
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium text-gray-300">Quantity</label>
              <input 
                type="number" 
                className="w-32 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                min={1} 
                value={qty} 
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} 
              />
            </div>
          </div>

          {/* Shipping Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Shipping Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Full Name <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="Enter your full name" 
                    value={shipping.fullName} 
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Phone <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="Enter your phone number" 
                    value={shipping.phone} 
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Address Line 1 <span className="text-red-400">*</span></label>
                <input 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                  placeholder="Street address, P.O. box, company name" 
                  value={shipping.addressLine1} 
                  onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Address Line 2</label>
                <input 
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                  placeholder="Apartment, suite, unit, building, floor, etc." 
                  value={shipping.addressLine2} 
                  onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">City <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="City" 
                    value={shipping.city} 
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">State <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="State/Province" 
                    value={shipping.state} 
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Postal Code <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="Postal/ZIP code" 
                    value={shipping.postalCode} 
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Country <span className="text-red-400">*</span></label>
                  <input 
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                    placeholder="Country" 
                    value={shipping.country} 
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Payment Method</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Select Payment Method <span className="text-red-400">*</span></label>
              <select 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors" 
                value={method} 
                onChange={(e) => setMethod(e.target.value as any)}
              >
                {(settings?.activePaymentMethods || []).map((m: string) => (
                  <option key={m} value={m} className="bg-gray-900 text-white">{m.toUpperCase()}</option>
                ))}
              </select>
              
              {/* E-PAY UM Payment Details */}
              {method === 'epayum' && settings?.epayum && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <h4 className="font-semibold text-purple-300 mb-2">E-PAY UM Payment</h4>
                  {settings.epayum.link && (
                    <div className="mb-2">
                      <strong className="text-gray-300">Payment Link:</strong>{' '}
                      <a 
                        href={settings.epayum.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline"
                      >
                        {settings.epayum.link}
                      </a>
                    </div>
                  )}
                  <div className="text-sm text-gray-300">
                    {settings.epayum.instructions}
                  </div>
                </div>
              )}
              
              {/* FPX Bank Transfer Details */}
              {method === 'fpx' && settings?.fpx && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h4 className="font-semibold text-green-300 mb-3">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div><strong className="text-gray-400">Bank Name:</strong> {settings.fpx.bankName}</div>
                    <div><strong className="text-gray-400">Account Number:</strong> {settings.fpx.accountNumber}</div>
                    <div><strong className="text-gray-400">Account Holder:</strong> {settings.fpx.accountHolder}</div>
                  </div>
                  {settings.fpx.image && (
                    <div className="mt-3">
                      <img src={settings.fpx.image} alt="QR Code" className="max-w-[200px] h-auto rounded-lg" />
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-300">
                    {settings.fpx.instructions}
                  </div>
                </div>
              )}
            </div>

            {/* File Upload for Transaction Proof */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Upload Transaction Proof <span className="text-red-400">*</span></label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                />
                <div className="text-xs text-gray-400">
                  Upload your payment receipt or transaction proof (JPG, PNG, or PDF, max 5MB)
                </div>
                {receiptFile && (
                  <div className="text-sm text-green-400 font-medium flex items-center">
                    <span className="mr-2">✓</span> File selected: {receiptFile.name}
                  </div>
                )}
                {uploadStatus === 'uploading' && (
                  <div className="text-sm text-purple-400 animate-pulse">
                    Uploading file...
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="text-sm text-green-400">
                    ✓ File uploaded successfully
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="text-sm text-red-400">
                    ✗ File upload failed. Please try again.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Order Summary</h3>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span className="font-semibold text-white">RM {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax ({settings?.taxRate || 0}%)</span>
                <span className="font-semibold text-white">RM {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Shipping</span>
                <span className="font-semibold text-white">RM {shippingFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-purple-400">RM {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-[#0a0a0f]/95 sticky bottom-0">
          <button 
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors font-medium" 
            onClick={onClose} 
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 shadow-lg shadow-purple-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
            disabled={submitting} 
            onClick={submit}
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaShoppingCart />
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
