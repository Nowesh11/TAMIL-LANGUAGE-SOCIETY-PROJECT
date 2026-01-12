"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { FaTimes, FaShoppingCart, FaSpinner } from 'react-icons/fa';
// Using unified modern modal styles (imported globally in layout)

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
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a valid file (JPG, PNG, or PDF)');
        return;
      }
      // Validate file size (max 5MB)
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
    
    // Get user ID from localStorage if available
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
    
    // Generate temporary order ID for file organization
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
      // Upload receipt file if provided
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
      
      // Get the access token from localStorage for authentication
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add Authorization header if token exists
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
  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '600px' }}>
        {/* Modern Modal Header */}
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              <FaShoppingCart className="inline mr-3" />
              Buy Now
            </h2>
            <p className="modal-subtitle">Complete your purchase</p>
          </div>
          <button className="modern-close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modern-modal-body">
          {/* Book Information */}
          <div className="form-section">
            <h3 className="section-title">Order Details</h3>
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-12">
              <div className="font-semibold text-lg text-gray-800">{
                typeof book.title === 'string' 
                  ? book.title 
                  : book.title?.[lang] || book.title?.en || 'Book'
              }</div>
              <div className="font-bold text-xl text-blue-600">RM {(book.price || 0).toFixed(2)}</div>
            </div>
            <div className="modern-field-group">
              <label className="modern-label">Quantity</label>
              <input 
                type="number" 
                className="modern-input" 
                style={{ width: '120px' }}
                min={1} 
                value={qty} 
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} 
              />
            </div>
          </div>

          {/* Shipping Information */}
          <div className="form-section">
            <h3 className="section-title">Shipping Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="modern-field-group">
                  <label className="modern-label required">Full Name</label>
                  <input 
                    className="modern-input" 
                    placeholder="Enter your full name" 
                    value={shipping.fullName} 
                    onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} 
                  />
                </div>
                <div className="modern-field-group">
                  <label className="modern-label required">Phone</label>
                  <input 
                    className="modern-input" 
                    placeholder="Enter your phone number" 
                    value={shipping.phone} 
                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} 
                  />
                </div>
              </div>
              <div className="modern-field-group">
                <label className="modern-label required">Address Line 1</label>
                <input 
                  className="modern-input" 
                  placeholder="Street address, P.O. box, company name" 
                  value={shipping.addressLine1} 
                  onChange={(e) => setShipping({ ...shipping, addressLine1: e.target.value })} 
                />
              </div>
              <div className="modern-field-group">
                <label className="modern-label optional">Address Line 2</label>
                <input 
                  className="modern-input" 
                  placeholder="Apartment, suite, unit, building, floor, etc." 
                  value={shipping.addressLine2} 
                  onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="modern-field-group">
                  <label className="modern-label required">City</label>
                  <input 
                    className="modern-input" 
                    placeholder="City" 
                    value={shipping.city} 
                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })} 
                  />
                </div>
                <div className="modern-field-group">
                  <label className="modern-label required">State</label>
                  <input 
                    className="modern-input" 
                    placeholder="State/Province" 
                    value={shipping.state} 
                    onChange={(e) => setShipping({ ...shipping, state: e.target.value })} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="modern-field-group">
                  <label className="modern-label required">Postal Code</label>
                  <input 
                    className="modern-input" 
                    placeholder="Postal/ZIP code" 
                    value={shipping.postalCode} 
                    onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} 
                  />
                </div>
                <div className="modern-field-group">
                  <label className="modern-label required">Country</label>
                  <input 
                    className="modern-input" 
                    placeholder="Country" 
                    value={shipping.country} 
                    onChange={(e) => setShipping({ ...shipping, country: e.target.value })} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="form-section">
            <h3 className="section-title">Payment Method</h3>
            <div className="modern-field-group">
              <label className="modern-label required">Select Payment Method</label>
              <select className="modern-select" value={method} onChange={(e) => setMethod(e.target.value as any)}>
                {(settings?.activePaymentMethods || []).map((m: string) => (
                  <option key={m} value={m}>{m.toUpperCase()}</option>
                ))}
              </select>
              
              {/* E-PAY UM Payment Details */}
              {method === 'epayum' && settings?.epayum && (
                <div className="field-hint mt-2 p-4 bg-blue-50 border border-blue-200 rounded-12">
                  <h4 className="font-semibold text-blue-800 mb-2">E-PAY UM Payment</h4>
                  {settings.epayum.link && (
                    <div className="mb-2">
                      <strong>Payment Link:</strong>{' '}
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
                  <div className="text-sm text-gray-700">
                    {settings.epayum.instructions}
                  </div>
                </div>
              )}
              
              {/* FPX Bank Transfer Details */}
              {method === 'fpx' && settings?.fpx && (
                <div className="field-hint mt-2 p-4 bg-green-50 border border-green-200 rounded-12">
                  <h4 className="font-semibold text-green-800 mb-3">Bank Transfer Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Bank Name:</strong> {settings.fpx.bankName}</div>
                    <div><strong>Account Number:</strong> {settings.fpx.accountNumber}</div>
                    <div><strong>Account Holder:</strong> {settings.fpx.accountHolder}</div>
                  </div>
                  {settings.fpx.image && (
                    <div className="mt-3">
                      <img src={settings.fpx.image} alt="QR Code" className="max-w-48 h-auto rounded" />
                    </div>
                  )}
                  <div className="mt-3 text-sm text-gray-700">
                    {settings.fpx.instructions}
                  </div>
                </div>
              )}
            </div>

            {/* File Upload for Transaction Proof */}
            <div className="modern-field-group">
              <label className="modern-label required">Upload Transaction Proof</label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileUpload}
                  className="modern-input"
                  style={{ padding: '0.75rem' }}
                />
                <div className="field-hint">
                  Upload your payment receipt or transaction proof (JPG, PNG, or PDF, max 5MB)
                </div>
                {receiptFile && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ File selected: {receiptFile.name}
                  </div>
                )}
                {uploadStatus === 'uploading' && (
                  <div className="text-sm text-blue-600">
                    Uploading file...
                  </div>
                )}
                {uploadStatus === 'success' && (
                  <div className="text-sm text-green-600">
                    ✓ File uploaded successfully
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="text-sm text-red-600">
                    ✗ File upload failed. Please try again.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="form-section">
            <h3 className="section-title">Order Summary</h3>
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
        </div>

        {/* Modal Footer */}
        <div className="modern-modal-footer">
          <button className="modern-button secondary-button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="modern-button primary-button" disabled={submitting} onClick={submit}>
            {submitting ? (
              <>
                <FaSpinner className="spinner" />
                Processing...
              </>
            ) : (
              <>
                <FaShoppingCart />
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
