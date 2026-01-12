'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout'
import AdminHeader from '@/components/admin/AdminHeader'
import { notifyAdminError } from '@/lib/adminNotifications'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiDollarSign, FiSettings, FiCreditCard, FiShield, FiMail, FiPhone, FiGlobe, FiTruck, FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiFilter, FiCheckCircle } from 'react-icons/fi';

interface PaymentSettings {
  _id: string;
  epayum: {
    link: string;
    instructions: string;
    isActive: boolean;
  };
  fpx: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions: string;
    image?: string;
    isActive: boolean;
  };
  shipping: {
    fee: number;
    currency: string;
    freeShippingThreshold?: number;
    estimatedDays: number;
    availableCountries: string[];
  };
  taxRate: number;
  currency: string;
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  supportEmail: string;
  supportPhone?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentSettingsFormData {
  epayum: {
    link: string;
    instructions: string;
    isActive: boolean;
  };
  fpx: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions: string;
    image?: string;
    isActive: boolean;
  };
  shipping: {
    fee: number;
    currency: string;
    freeShippingThreshold?: number;
    estimatedDays: number;
    availableCountries: string[];
  };
  taxRate: number;
  currency: string;
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
  supportEmail: string;
  supportPhone?: string;
  termsAndConditions?: string;
  privacyPolicy?: string;
  refundPolicy?: string;
}

interface ApiResponse {
  success: boolean;
  data: PaymentSettings[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

const PaymentSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [maintenanceModeFilter, setMaintenanceModeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSettings, setEditingSettings] = useState<PaymentSettings | null>(null);
  const [formData, setFormData] = useState<PaymentSettingsFormData>({
    epayum: {
      link: '',
      instructions: '',
      isActive: true
    },
    fpx: {
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      instructions: '',
      image: '',
      isActive: true
    },
    shipping: {
      fee: 0,
      currency: 'RM',
      freeShippingThreshold: 0,
      estimatedDays: 7,
      availableCountries: ['Malaysia']
    },
    taxRate: 6,
    currency: 'RM',
    isMaintenanceMode: false,
    maintenanceMessage: '',
    supportEmail: '',
    supportPhone: '',
    termsAndConditions: '',
    privacyPolicy: '',
    refundPolicy: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);

  const currencies = [
    { value: 'RM', label: 'Malaysian Ringgit (RM)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'SGD', label: 'Singapore Dollar (SGD)' },
    { value: 'EUR', label: 'Euro (EUR)' }
  ];

  const countries = [
    'Malaysia', 'Singapore', 'Thailand', 'Indonesia', 'Philippines', 
    'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Brunei'
  ];

  useEffect(() => {
    const controller = new AbortController();
    fetchSettings(controller.signal);
    return () => controller.abort();
  }, [currentPage, searchTerm, maintenanceModeFilter, paymentMethodFilter]);
  useEffect(() => { const t = setTimeout(() => setSearchTerm(searchInput), 250); return () => clearTimeout(t) }, [searchInput])

  const fetchSettings = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(maintenanceModeFilter !== 'all' && { maintenanceMode: maintenanceModeFilter }),
        ...(paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter })
      });

      const response = await fetch(`/api/admin/payment-settings?${params}`, { signal });
      const result: ApiResponse = await response.json();

      if (result.success) {
        setSettings(result.data);
        setTotalPages(result.pagination.pages);
        setTotalItems(result.pagination.total);
      } else {
        notifyAdminError('Payment Settings Fetch Failed', result.error || 'Unknown error');
      }
    } catch (error: any) {
      const msg = String(error?.message || '');
      const name = String(error?.name || '');
      if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return;
      notifyAdminError('Payment Settings Error', 'Error fetching payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleQRUpload = async (file: File) => {
    setUploadingQR(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('paymentMethod', 'fpx');

      const response = await fetch('/api/upload/payment-qr', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          fpx: {
            ...prev.fpx,
            image: result.url
          }
        }));
      } else {
        setFormErrors({ qrUpload: result.error || 'Upload failed' });
      }
    } catch (error) {
      notifyAdminError('QR Upload Error', 'Failed to upload payment QR');
      setFormErrors({ qrUpload: 'Upload failed' });
    } finally {
      setUploadingQR(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setSubmitting(true);

    try {
      const url = '/api/admin/payment-settings';
      const method = editingSettings ? 'PUT' : 'POST';
      const body = editingSettings 
        ? { id: editingSettings._id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        await fetchSettings();
        handleCloseModal();
      } else {
        setFormErrors({ general: result.error || 'Operation failed' });
        notifyAdminError('Payment Settings Save Failed', result.error || 'Operation failed');
      }
    } catch (error) {
      setFormErrors({ general: 'Network error occurred' });
      notifyAdminError('Network Error', 'Could not save payment settings');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (setting: PaymentSettings) => {
    setEditingSettings(setting);
    setFormData({
      epayum: setting.epayum,
      fpx: setting.fpx,
      shipping: setting.shipping,
      taxRate: setting.taxRate,
      currency: setting.currency,
      isMaintenanceMode: setting.isMaintenanceMode,
      maintenanceMessage: setting.maintenanceMessage || '',
      supportEmail: setting.supportEmail,
      supportPhone: setting.supportPhone || '',
      termsAndConditions: setting.termsAndConditions || '',
      privacyPolicy: setting.privacyPolicy || '',
      refundPolicy: setting.refundPolicy || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete these payment settings?')) return;

    try {
      const response = await fetch(`/api/admin/payment-settings?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchSettings();
      } else {
        alert('Failed to delete payment settings: ' + result.error);
      }
    } catch (error) {
      alert('Error deleting payment settings');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSettings(null);
    setFormData({
      epayum: {
        link: '',
        instructions: '',
        isActive: true
      },
      fpx: {
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        instructions: '',
        image: '',
        isActive: true
      },
      shipping: {
        fee: 0,
        currency: 'RM',
        freeShippingThreshold: 0,
        estimatedDays: 7,
        availableCountries: ['Malaysia']
      },
      taxRate: 6,
      currency: 'RM',
      isMaintenanceMode: false,
      maintenanceMessage: '',
      supportEmail: '',
      supportPhone: '',
      termsAndConditions: '',
      privacyPolicy: '',
      refundPolicy: ''
    });
    setFormErrors({});
  };
  useEffect(() => {
    if (showModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showModal]);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivePaymentMethods = (setting: PaymentSettings) => {
    const methods = [];
    if (setting.epayum.isActive) methods.push('E-PAY UM');
    if (setting.fpx.isActive) methods.push('FPX');
    return methods;
  };

  const addCountry = (country: string) => {
    if (country && !formData.shipping.availableCountries.includes(country)) {
      setFormData(prev => ({
        ...prev,
        shipping: {
          ...prev.shipping,
          availableCountries: [...prev.shipping.availableCountries, country]
        }
      }));
    }
  };

  const removeCountry = (country: string) => {
    setFormData(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        availableCountries: prev.shipping.availableCountries.filter(c => c !== country)
      }
    }));
  };

  return (
    <AdminLayout title="Payment Settings" subtitle="Configure payment, shipping and system settings">
    <div className="admin-content">
      <div className="max-w-7xl mx-auto">
        <AdminHeader
          title="Payment Settings"
          subtitle="Configure payment methods, shipping, and system settings"
          actions={
            <>
              <button onClick={() => fetchSettings()} className="admin-modern-btn admin-modern-btn-secondary">
                <FiRefreshCw /> Refresh
              </button>
              <button onClick={() => setShowModal(true)} className="admin-modern-btn admin-modern-btn-primary">
                <FiPlus /> Add Settings
              </button>
            </>
          }
        />

        <div className="admin-modern-stats-grid">
          {[
            { title: 'Total Configs', value: totalItems, icon: FiSettings, color: 'primary' },
            { title: 'Active Methods', value: settings.filter(s => s.epayum.isActive || s.fpx.isActive).length, icon: FiCheckCircle, color: 'success' },
            { title: 'Maintenance On', value: settings.filter(s => s.isMaintenanceMode).length, icon: FiAlertTriangle, color: 'warning' },
            { title: 'Shipping Countries', value: settings.reduce((acc, s) => acc + (s.shipping.availableCountries?.length || 0), 0), icon: FiGlobe, color: 'info' },
          ].map((stat, idx) => {
            const Icon = stat.icon as any;
            return (
              <div key={idx} className={`admin-modern-card ${stat.color}`}>
                <div className="admin-modern-card-header">
                  <div className={`admin-modern-card-icon ${stat.color}`}>
                    <Icon />
                  </div>
                </div>
                <div className="admin-modern-card-content">
                  <p className="admin-modern-card-title">{stat.title}</p>
                  <h3 className="admin-modern-card-value">{(stat.value || 0).toLocaleString()}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <div className="admin-modern-controls admin-sticky-toolbar">
          <div className="admin-modern-controls-row">
            <div className="admin-modern-search-container">
              <FiSearch className="admin-modern-search-icon" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="admin-modern-search-input"
              />
            </div>
            <div className="admin-modern-controls-actions">
              <button onClick={() => {
                setSearchTerm('');
                setMaintenanceModeFilter('all');
                setPaymentMethodFilter('all');
                setCurrentPage(1);
              }} className="admin-modern-btn admin-modern-btn-secondary">
                <FiFilter /> Clear Filters
              </button>
            </div>
          </div>
          <div className="admin-modern-filters-panel">
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiAlertTriangle /> Maintenance</label>
              <select value={maintenanceModeFilter} onChange={(e) => setMaintenanceModeFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Modes</option>
                <option value="true">Maintenance On</option>
                <option value="false">Maintenance Off</option>
              </select>
            </div>
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiCreditCard /> Method</label>
              <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Methods</option>
                <option value="epayum">E-PAY UM</option>
                <option value="fpx">FPX</option>
              </select>
            </div>
          </div>
        </div>

        

        {/* Settings List */}
        <div className="admin-modern-table-container">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="admin-modern-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : settings.length === 0 ? (
            <div className="text-center py-12">
              <FiSettings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payment settings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-modern-table">
                <thead>
                  <tr>
                    <th>Currency/System</th>
                    <th>Tax / Shipping / Support</th>
                    <th>Methods</th>
                    <th>Status</th>
                    <th>Created / Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => {
                    const activeMethods = getActivePaymentMethods(setting);
                    return (
                      <tr key={setting._id} className="admin-modern-table-row">
                        <td>
                          <div className="admin-modern-table-cell-title">{setting.currency} System</div>
                        </td>
                        <td>
                          <div className="admin-modern-table-cell-meta"><FiDollarSign /> {setting.taxRate}%</div>
                          <div className="admin-modern-table-cell-meta"><FiTruck /> {formatCurrency(setting.shipping.fee, setting.shipping.currency)}</div>
                          <div className="admin-modern-table-cell-meta"><FiMail /> {setting.supportEmail}</div>
                        </td>
                        <td>
                          <div className="admin-modern-table-cell-meta"><FiCreditCard /> {activeMethods.length > 0 ? activeMethods.join(', ') : 'None'}</div>
                        </td>
                        <td>
                          <span className={`admin-modern-badge admin-modern-badge-${setting.isMaintenanceMode ? 'warning' : 'success'}`}>
                            {setting.isMaintenanceMode ? <><FiAlertTriangle /> Maintenance</> : <><FiCheck /> Active</>}
                          </span>
                        </td>
                        <td>
                          <div className="admin-modern-table-cell-meta">{formatDate(setting.createdAt)}</div>
                          <div className="admin-modern-table-cell-meta">{formatDate(setting.updatedAt)}</div>
                        </td>
                        <td>
                          <div className="admin-modern-table-actions">
                            <button onClick={() => handleEdit(setting)} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm">
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDelete(setting._id)} className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm">
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-modern-pagination">
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="admin-modern-btn admin-modern-btn-secondary"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="admin-modern-btn admin-modern-btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modern-modal-overlay" onClick={handleCloseModal}>
          <div className="modern-modal-container" onClick={e => e.stopPropagation()}>
            <div className="modern-modal-header">
              <h2 className="modern-modal-title">
                {editingSettings ? 'Edit Payment Settings' : 'Add Payment Settings'}
              </h2>
              <button onClick={handleCloseModal} className="modern-close-button">
                <FiX />
              </button>
            </div>

            <div className="modern-modal-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {formErrors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                    {formErrors.general}
                  </div>
                )}

                {/* Basic Settings */}
                <div className="modern-form-section">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiSettings className="w-5 h-5" />
                    Basic Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Currency
                      </label>
                      <select
                        required
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="modern-select"
                      >
                        {currencies.map(curr => (
                          <option key={curr.value} value={curr.value}>{curr.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={formData.taxRate}
                        onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Support Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.supportEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, supportEmail: e.target.value }))}
                        className="modern-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="modern-field-group">
                      <label className="modern-label">
                        Support Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.supportPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, supportPhone: e.target.value }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-checkbox-group pt-8">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.isMaintenanceMode}
                          onChange={(e) => setFormData(prev => ({ ...prev, isMaintenanceMode: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                      </label>
                    </div>
                  </div>

                  {formData.isMaintenanceMode && (
                    <div className="modern-field-group mt-4">
                      <label className="modern-label">
                        Maintenance Message
                      </label>
                      <textarea
                        rows={3}
                        value={formData.maintenanceMessage}
                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                        className="modern-textarea"
                        placeholder="The system is currently under maintenance..."
                      />
                    </div>
                  )}
                </div>

                {/* E-PAY UM Settings */}
                <div className="modern-form-section">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiCreditCard className="w-5 h-5" />
                      E-PAY UM Settings
                    </h3>
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.epayum.isActive}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            epayum: { ...prev.epayum, isActive: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Payment Link
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.epayum.link}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          epayum: { ...prev.epayum, link: e.target.value }
                        }))}
                        className="modern-input"
                        placeholder="https://epayum.com/payment/..."
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Instructions
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={formData.epayum.instructions}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          epayum: { ...prev.epayum, instructions: e.target.value }
                        }))}
                        className="modern-textarea"
                        placeholder="Instructions for customers using E-PAY UM..."
                      />
                    </div>
                  </div>
                </div>

                {/* FPX Banking Settings */}
                <div className="modern-form-section">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FiShield className="w-5 h-5" />
                      FPX Banking Settings
                    </h3>
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.fpx.isActive}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            fpx: { ...prev.fpx, isActive: e.target.checked }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fpx.bankName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fpx: { ...prev.fpx, bankName: e.target.value }
                        }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Account Number
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fpx.accountNumber}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fpx: { ...prev.fpx, accountNumber: e.target.value }
                        }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Account Holder
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fpx.accountHolder}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fpx: { ...prev.fpx, accountHolder: e.target.value }
                        }))}
                        className="modern-input"
                      />
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label required">
                      Instructions
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.fpx.instructions}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fpx: { ...prev.fpx, instructions: e.target.value }
                      }))}
                      className="modern-textarea"
                      placeholder="Instructions for bank transfer..."
                    />
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">
                      QR Code Image (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleQRUpload(file);
                        }
                      }}
                      disabled={uploadingQR}
                      className="modern-input disabled:opacity-50"
                    />
                    {uploadingQR && (
                      <p className="text-sm text-blue-600 mt-2">
                        Uploading QR code...
                      </p>
                    )}
                    {formErrors.qrUpload && (
                      <p className="text-sm text-red-600 mt-2">
                        {formErrors.qrUpload}
                      </p>
                    )}
                    {formData.fpx.image && !uploadingQR && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Current QR code:</p>
                        <img 
                          src={formData.fpx.image} 
                          alt="FPX QR Code" 
                          className="w-32 h-32 object-contain border border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Settings */}
                <div className="modern-form-section">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiTruck className="w-5 h-5" />
                    Shipping Settings
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Shipping Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.shipping.fee}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shipping: { ...prev.shipping, fee: parseFloat(e.target.value) || 0 }
                        }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Currency
                      </label>
                      <select
                        required
                        value={formData.shipping.currency}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shipping: { ...prev.shipping, currency: e.target.value }
                        }))}
                        className="modern-select"
                      >
                        {currencies.map(curr => (
                          <option key={curr.value} value={curr.value}>{curr.value}</option>
                        ))}
                      </select>
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label">
                        Free Shipping Threshold
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.shipping.freeShippingThreshold ?? ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shipping: { ...prev.shipping, freeShippingThreshold: parseFloat(e.target.value) || undefined }
                        }))}
                        className="modern-input"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Estimated Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        required
                        value={formData.shipping.estimatedDays}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shipping: { ...prev.shipping, estimatedDays: parseInt(e.target.value) || 7 }
                        }))}
                        className="modern-input"
                      />
                    </div>
                  </div>

                  {/* Available Countries */}
                  <div className="modern-field-group">
                    <label className="modern-label">
                      Available Countries
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.shipping.availableCountries.map((country, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {country}
                          <button
                            type="button"
                            onClick={() => removeCountry(country)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addCountry(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="modern-select"
                    >
                      <option value="">Add a country...</option>
                      {countries
                        .filter(country => !formData.shipping.availableCountries.includes(country))
                        .map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Policies */}
                <div className="modern-form-section">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Policies & Terms
                  </h3>

                  <div className="space-y-4">
                    <div className="modern-field-group">
                      <label className="modern-label">
                        Terms and Conditions
                      </label>
                      <textarea
                        rows={4}
                        value={formData.termsAndConditions}
                        onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                        className="modern-textarea"
                        placeholder="Terms and conditions..."
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label">
                      Privacy Policy
                    </label>
                    <textarea
                      rows={4}
                      value={formData.privacyPolicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Privacy policy..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Policy
                    </label>
                    <textarea
                      rows={4}
                      value={formData.refundPolicy}
                      onChange={(e) => setFormData(prev => ({ ...prev, refundPolicy: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Refund policy..."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingSettings ? 'Update Settings' : 'Create Settings')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default PaymentSettingsPage;
