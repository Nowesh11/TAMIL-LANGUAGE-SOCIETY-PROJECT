"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/CartCheckout.css';
// Using unified modern modal styles (imported globally in layout)

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
      <div className="form-section">
        <h3 className="section-title flex items-center gap-2">
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
          <span>Shopping Cart</span>
        </h3>
        
        {!items.length && (
          <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
        )}
        
        {!!items.length && (
          <div className="space-y-4">
            {items.map((it, idx) => (
              <div key={idx} className="p-4 bg-white border-2 border-gray-200 rounded-12 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gray-800">
                    {typeof it.title === 'string' 
                      ? it.title 
                      : (it.title as any)?.[lang] || it.title?.en || 'Book'
                    }
                  </div>
                  <div className="text-sm text-gray-500">RM {it.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min={1} 
                    value={it.quantity} 
                    className="modern-input w-20" 
                    onChange={(e) => updateQty(idx, Number(e.target.value))} 
                  />
                  <button 
                    className="modern-button secondary-button" 
                    onClick={() => onItemsChange(items.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
         
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="form-section">
          <h4 className="section-title">Shipping Address</h4>
          <div className="space-y-4">
            <div className="modern-field-group">
              <input 
                className="modern-input" 
                placeholder="Full Name" 
                value={shipping.fullName} 
                onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} 
              />
            </div>
            <div className="modern-field-group">
              <input 
                className="modern-input" 
                placeholder="Address Line 1" 
                value={shipping.addressLine1} 
                onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} 
              />
            </div>
            <div className="modern-field-group">
              <input 
                className="modern-input" 
                placeholder="Address Line 2" 
                value={shipping.addressLine2} 
                onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="modern-field-group">
                <input 
                  className="modern-input" 
                  placeholder="City" 
                  value={shipping.city} 
                  onChange={(e) => setShipping({ ...shipping, city: e.target.value })} 
                />
              </div>
              <div className="modern-field-group">
                <input 
                  className="modern-input" 
                  placeholder="State" 
                  value={shipping.state} 
                  onChange={(e) => setShipping({ ...shipping, state: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="modern-field-group">
                <input 
                  className="modern-input" 
                  placeholder="Postal Code" 
                  value={shipping.postalCode} 
                  onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} 
                />
              </div>
              <div className="modern-field-group">
                <input 
                  className="modern-input" 
                  placeholder="Country" 
                  value={shipping.country} 
                  onChange={(e) => setShipping({ ...shipping, country: e.target.value })} 
                />
              </div>
            </div>
            <div className="modern-field-group">
              <input 
                className="modern-input" 
                placeholder="Phone" 
                value={shipping.phone} 
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} 
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h4 className="section-title">Payment</h4>
          <div className="space-y-4">
            <div className="modern-field-group">
              <select 
                className="modern-input" 
                value={method} 
                onChange={(e) => setMethod(e.target.value as any)}
              >
                {(settings?.activePaymentMethods || []).map((m: string) => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
            </div>
             
            {method === 'epayum' && settings?.epayum && (
              <div className="field-hint p-4 bg-blue-50 border border-blue-200 rounded-12">
                <h5 className="font-semibold text-blue-800 mb-2">E-PAY UM Payment Details</h5>
                {settings.epayum.link && (
                  <div className="mb-2">
                    <strong>Payment Link: </strong>
                    <a 
                      href={settings.epayum.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {settings.epayum.link}
                    </a>
                  </div>
                )}
                {settings.epayum.instructions && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Instructions: </span>
                    {settings.epayum.instructions}
                  </div>
                )}
              </div>
            )}

            {method === 'fpx' && settings?.fpx && (
              <div className="field-hint p-4 bg-green-50 border border-green-200 rounded-12">
                <h5 className="font-semibold text-green-800 mb-2">Bank Transfer Details</h5>
                <div className="space-y-1 text-sm">
                  <div><strong>Bank Name:</strong> {settings.fpx.bankName}</div>
                  <div><strong>Account Number:</strong> {settings.fpx.accountNumber}</div>
                  <div><strong>Account Holder:</strong> {settings.fpx.accountHolder}</div>
                </div>
                {settings.fpx.image && (
                  <div className="mt-2">
                    <img src={settings.fpx.image} alt="QR Code" className="max-w-32 h-auto rounded" />
                  </div>
                )}
                {settings.fpx.instructions && (
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Instructions: </span>
                    {settings.fpx.instructions}
                  </div>
                )}
              </div>
            )}

            <div className="modern-field-group">
              <label className="modern-label required">Upload Transaction Proof</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  className="modern-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="field-hint">
                  Upload your payment receipt (JPG, PNG, or PDF, max 5MB)
                </p>
                {receiptFile && (
                  <div className="success-message">
                    Selected: {receiptFile.name}
                  </div>
                )}
                {uploadStatus === 'uploading' && (
                  <div className="text-sm text-blue-600">Uploading...</div>
                )}
                {uploadStatus === 'success' && (
                  <div className="success-message">✓ Upload successful</div>
                )}
                {uploadStatus === 'error' && (
                  <div className="error-message">✗ Upload failed</div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h4 className="section-title">Order Summary</h4>
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-12">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal</span>
                    <span className="font-semibold">RM {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Tax ({settings?.taxRate || 0}%)</span>
                    <span className="font-semibold">RM {tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className="font-semibold">RM {shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t-2 border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-blue-600">RM {finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="modern-button primary-button w-full flex items-center justify-center gap-2" 
              disabled={submitting || !items.length} 
              onClick={checkout}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="w-5 h-5"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{submitting ? 'Processing...' : 'Complete Purchase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
