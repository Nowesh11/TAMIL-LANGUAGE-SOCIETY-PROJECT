"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { FaShoppingCart, FaTrash, FaCreditCard, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

type CartItem = { 
  bookId: string; 
  title: { en: string; ta?: string }; 
  price: number; 
  quantity: number 
};

export default function CartCheckout({ 
  items, 
  onItemsChange, 
  onOrderPlaced 
}: {
  items: CartItem[];
  onItemsChange: (items: CartItem[]) => void;
  onOrderPlaced: (result: any) => void;
}) {
  const { lang } = useLanguage();
  const [settings, setSettings] = useState<any>(null);
  const [method, setMethod] = useState<'epayum' | 'fpx'>('epayum');
  const [shipping, setShipping] = useState({
    fullName: '', 
    addressLine1: '', 
    addressLine2: '', 
    city: '', 
    state: '', 
    postalCode: '', 
    country: 'Malaysia', 
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  useEffect(() => { 
    fetchSettings(); 
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        const active = data.settings.activePaymentMethods || [];
        if (active.includes('epayum')) {
          setMethod('epayum');
        } else if (active.includes('fpx')) {
          setMethod('fpx');
        }
      }
    } catch (e) { 
      console.error('Failed to load payment settings', e); 
    }
  }

  const subtotal = useMemo(() => 
    items.reduce((sum, it) => sum + (it.price * it.quantity), 0), 
    [items]
  );
  
  const tax = useMemo(() => 
    settings ? (subtotal * (settings.taxRate || 0)) / 100 : 0, 
    [subtotal, settings]
  );
  
  const shippingFee = useMemo(() => {
    if (!settings) return 0;
    const threshold = settings.shipping?.freeShippingThreshold;
    const fee = settings.shipping?.fee || 0;
    return threshold && subtotal >= threshold ? 0 : fee;
  }, [settings, subtotal]);
  
  const finalTotal = useMemo(() => 
    subtotal + tax + shippingFee, 
    [subtotal, tax, shippingFee]
  );

  function updateQty(index: number, qty: number) {
    const next = [...items];
    next[index] = { ...next[index], quantity: Math.max(1, qty) };
    onItemsChange(next);
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

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

  async function uploadReceipt(): Promise<string | null> {
    if (!receiptFile) return null;

    setUploadStatus('uploading');
    const formData = new FormData();
    formData.append('file', receiptFile);
    
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
      const response = await fetch('/api/upload/checkout', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setUploadStatus('success');
        return data.filePath;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      return null;
    }
  }

  async function checkout() {
    if (!items.length) return;
    
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) {
      alert('Please log in to complete your purchase');
      window.location.href = '/auth/login';
      return;
    }
    
    setSubmitting(true);
    try {
      let receiptPath = null;
      if ((method === 'epayum' || method === 'fpx') && !receiptFile) {
         alert('Please upload a proof of payment/receipt to proceed.');
         setSubmitting(false);
         return;
      }
      
      if (receiptFile) {
        receiptPath = await uploadReceipt();
        if (!receiptPath) {
          alert('Failed to upload receipt. Please try again.');
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        method,
        items: items.map((it) => ({ bookId: it.bookId, quantity: it.quantity })),
        shippingAddress: shipping,
        receiptPath,
      };
      
      const res = await fetch('/api/purchases', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Checkout failed');
      onOrderPlaced(data);
    } catch (e) {
      console.error('Checkout error', e);
      const errorMessage = (e as Error).message;
      if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
        alert('Please log in to complete your purchase');
        window.location.href = '/auth/login';
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Items Section */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
          <FaShoppingCart className="text-purple-400" />
          <span>Shopping Cart</span>
        </h3>
        
        {!items.length && (
          <p className="text-gray-400 text-center py-8">Your cart is empty.</p>
        )}
        
        {!!items.length && (
          <div className="space-y-4">
            {items.map((it, idx) => (
              <div key={idx} className="bg-black/20 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm hover:border-purple-500/30 transition-all">
                <div>
                  <div className="font-medium text-lg text-white">
                    {typeof it.title === 'string' 
                      ? it.title 
                      : (it.title as any)?.[lang] || it.title?.en || 'Book'
                    }
                  </div>
                  <div className="text-sm text-purple-400 font-bold">RM {it.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min={1} 
                    value={it.quantity} 
                    className="w-16 px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-center text-white focus:ring-2 focus:ring-purple-500/50 outline-none" 
                    onChange={(e) => updateQty(idx, Number(e.target.value))} 
                  />
                  <button 
                    className="text-red-400 hover:text-red-500 p-2 transition-colors hover:bg-white/5 rounded-lg" 
                    onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
                    title="Remove Item"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
         
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shipping Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <h4 className="text-lg font-bold mb-4 text-white">Shipping Address</h4>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-300">Full Name <span className="text-red-500">*</span></label>
              <input 
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                placeholder="Full Name" 
                value={shipping.fullName} 
                onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-300">Address Line 1 <span className="text-red-500">*</span></label>
              <input 
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                placeholder="Address Line 1" 
                value={shipping.addressLine1} 
                onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-300">Address Line 2</label>
              <input 
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                placeholder="Address Line 2" 
                value={shipping.addressLine2} 
                onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-300">City <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                  placeholder="City" 
                  value={shipping.city} 
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-300">State <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                  placeholder="State" 
                  value={shipping.state} 
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-300">Postal Code <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                  placeholder="Postal Code" 
                  value={shipping.postalCode} 
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-300">Country <span className="text-red-500">*</span></label>
                <input 
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                  placeholder="Country" 
                  value={shipping.country} 
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-300">Phone <span className="text-red-500">*</span></label>
              <input 
                className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all focus:border-purple-500/50" 
                placeholder="Phone" 
                value={shipping.phone} 
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} 
              />
            </div>
          </div>
        </div>
        
        {/* Payment Section */}
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-white">
              <FaCreditCard className="text-purple-400" />
              <span>Payment</span>
            </h4>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-300">Payment Method <span className="text-red-500">*</span></label>
                <select 
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all appearance-none" 
                  value={method} 
                  onChange={(e) => setMethod(e.target.value as any)}
                >
                  {(settings?.activePaymentMethods || []).map((m: string) => (
                    <option key={m} value={m} className="bg-[#0a0a0f] text-white">{m.toUpperCase()}</option>
                  ))}
                </select>
              </div>
               
              {method === 'epayum' && settings?.epayum && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <h5 className="font-semibold text-purple-300 mb-2">E-PAY UM Payment Details</h5>
                  {settings.epayum.link && (
                    <div className="mb-2">
                      <strong className="text-gray-300">Payment Link: </strong>
                      <a 
                        href={settings.epayum.link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-purple-400 hover:text-purple-300 underline break-all"
                      >
                        {settings.epayum.link}
                      </a>
                    </div>
                  )}
                  {settings.epayum.instructions && (
                    <div className="text-sm text-gray-300">
                      <span className="font-medium">Instructions: </span>
                      {settings.epayum.instructions}
                    </div>
                  )}
                </div>
              )}

              {method === 'fpx' && settings?.fpx && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h5 className="font-semibold text-green-300 mb-2">Bank Transfer Details</h5>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div><strong>Bank Name:</strong> {settings.fpx.bankName}</div>
                    <div><strong>Account Number:</strong> {settings.fpx.accountNumber}</div>
                    <div><strong>Account Holder:</strong> {settings.fpx.accountHolder}</div>
                  </div>
                  {settings.fpx.image && (
                    <div className="mt-2">
                      <img src={settings.fpx.image} alt="QR Code" className="max-w-32 h-auto rounded-lg shadow-sm" />
                    </div>
                  )}
                  {settings.fpx.instructions && (
                    <div className="mt-2 text-sm text-gray-300">
                      <span className="font-medium">Instructions: </span>
                      {settings.fpx.instructions}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Upload Transaction Proof <span className="text-red-500">*</span></label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-500/10 file:text-purple-400 hover:file:bg-purple-500/20 transition-all"
                  />
                  <p className="text-xs text-gray-400">
                    Upload your payment receipt (JPG, PNG, or PDF, max 5MB)
                  </p>
                  {receiptFile && (
                    <div className="text-sm text-green-400 flex items-center gap-2 font-medium">
                      <FaCheckCircle />
                      Selected: {receiptFile.name}
                    </div>
                  )}
                  {uploadStatus === 'uploading' && (
                    <div className="text-sm text-purple-400 flex items-center gap-2 font-medium">
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {uploadStatus === 'success' && (
                    <div className="text-sm text-green-400 flex items-center gap-2 font-medium">
                      <FaCheckCircle />
                      Upload successful
                    </div>
                  )}
                  {uploadStatus === 'error' && (
                    <div className="text-sm text-red-400 flex items-center gap-2 font-medium">
                      <FaExclamationTriangle />
                      Upload failed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h4 className="text-lg font-bold mb-4 text-white">Order Summary</h4>
            <div className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-3">
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
              <div className="border-t border-white/10 pt-3 mt-1">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-purple-400">RM {finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              className="w-full px-6 py-4 rounded-xl mt-6 flex items-center justify-center gap-2 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              disabled={submitting || !items.length} 
              onClick={checkout}
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Complete Purchase
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
