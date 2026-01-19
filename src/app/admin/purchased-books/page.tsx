'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout'
import AdminHeader from '@/components/admin/AdminHeader'
import { notifyAdminError, notifyAdminSuccess } from '@/lib/adminNotifications'
import { getSafeText } from '@/components/SafeText';
import { 
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiBook,
  FiShoppingCart,
  FiCreditCard,
  FiClock,
  FiTrendingUp,
  FiCheckCircle,
  FiDollarSign,
  FiCalendar,
  FiTruck,
  FiCheckSquare,
  FiSquare,
  FiXCircle
} from 'react-icons/fi';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import PurchaseDetailModal from '@/components/admin/PurchaseDetailModal';
import PurchaseReviewModal from '@/components/admin/PurchaseReviewModal';

interface PurchasedBook {
  id: string;
  orderId: string;
  bookId: string;
  bookTitle: {
    en: string;
    ta: string;
  };
  bookAuthor: {
    en: string;
    ta: string;
  };
  bookPrice: number;
  quantity: number;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  orderDate: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
  paymentDetails?: any;
}

interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  topSellingBooks: Array<{
    bookId: string;
    title: string;
    quantity: number;
    revenue: number;
  }>;
}

const PurchasedBooksManagement = () => {
  const [orders, setOrders] = useState<PurchasedBook[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<PurchasedBook | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('orderDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const run = async () => {
      try { await fetchOrders(signal); } finally {}
    };
    run();
    return () => controller.abort();
  }, [searchQuery, filterStatus, filterPaymentStatus, currentPage]);
  
  useEffect(() => { const t = setTimeout(() => setSearchQuery(searchInput), 250); return () => clearTimeout(t) }, [searchInput])
  
  useAdminShortcuts({
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchQuery('');
      setFilterStatus('all');
      setFilterPaymentStatus('all');
      setDateRange('all');
      setSortBy('orderDate');
      setSortOrder('desc');
    },
    onCloseModal: () => {
      setShowDetailModal(false);
      setShowReviewModal(false);
    }
  });

  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      // Retrieve token securely from storage or context (assuming localStorage here based on pattern)
      const token = localStorage.getItem('accessToken'); 
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPaymentStatus !== 'all' && { paymentStatus: filterPaymentStatus }),
        ...(searchQuery && { search: searchQuery })
      })
      const res = await fetch(`/api/admin/purchases?${params}`, { signal, headers })
      
      if (res.status === 401) {
        notifyAdminError('Unauthorized', 'Please log in again');
        // Optional: Redirect to login
        return;
      }

      const result = await res.json()
      if (result.success) {
        const mapped: PurchasedBook[] = result.data.map((p: any) => ({
          id: p._id,
          orderId: p.orderId,
          bookId: p.bookRef,
          bookTitle: p.bookTitle || { en: 'Unknown', ta: '' },
          bookAuthor: p.bookAuthor || { en: 'Unknown', ta: '' },
          bookPrice: p.unitPrice,
          quantity: p.quantity,
          totalAmount: p.totalAmount,
          customerName: p.shippingAddress?.fullName || '',
          customerEmail: p.shippingAddress?.email || '',
          customerPhone: p.shippingAddress?.phone || '',
          shippingAddress: {
            street: p.shippingAddress?.addressLine1 || '',
            city: p.shippingAddress?.city || '',
            state: p.shippingAddress?.state || '',
            postalCode: p.shippingAddress?.postalCode || '',
            country: p.shippingAddress?.country || ''
          },
          orderDate: p.createdAt,
          status: p.status,
          paymentStatus: p.paymentDetails?.status || 'pending',
          paymentMethod: p.paymentDetails?.method || 'bank_transfer',
          paymentDetails: p.paymentDetails,
          trackingNumber: p.trackingNumber,
          shippingCarrier: p.shippingCarrier,
          estimatedDelivery: p.estimatedDelivery,
          actualDelivery: p.actualDelivery,
          notes: p.notes,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
        setOrders(mapped)
        setTotalPages(result.totalPages || 1)
        calculateStats(mapped)
      } else {
        notifyAdminError('Purchases Fetch Failed', result.error || 'Unknown error')
      }
    } catch (error: any) {
      const msg = String(error?.message || '')
      const name = String(error?.name || '')
      if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return
      notifyAdminError('Purchases Error', 'Error fetching orders')
    } finally {
      setLoading(false)
    }
  };

  const calculateStats = (list: PurchasedBook[] = orders) => {
    const totalOrders = list.length;
    const totalRevenue = list
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const pendingOrders = list.filter(order => order.status === 'pending').length;
    const shippedOrders = list.filter(order => order.status === 'shipped').length;
    const deliveredOrders = list.filter(order => order.status === 'delivered').length;
    const cancelledOrders = list.filter(order => order.status === 'cancelled').length;
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const bookSales = list.reduce((acc, order) => {
      if (order.paymentStatus === 'paid') {
        const key = order.bookId;
        if (!acc[key]) {
          acc[key] = {
            bookId: order.bookId,
            title: order.bookTitle.en,
            quantity: 0,
            revenue: 0
          };
        }
        acc[key].quantity += order.quantity;
        acc[key].revenue += order.totalAmount;
      }
      return acc;
    }, {} as Record<string, any>);

    const topSellingBooks = Object.values(bookSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5);

    setStats({
      totalOrders,
      totalRevenue,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue,
      topSellingBooks
    });
  };

  const handleReviewSave = async (data: any) => {
    if (!selectedOrder) return;
    try {
      const payload = {
         id: selectedOrder.id,
         status: data.status,
         trackingNumber: data.trackingNumber,
         shippingCarrier: data.shippingCarrier,
         estimatedDelivery: data.estimatedDelivery,
         notes: data.notes
      };
      
      const token = localStorage.getItem('accessToken'); 
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch('/api/admin/purchases', { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(payload) 
      });
      const result = await res.json();
      
      if (result.success) {
        notifyAdminSuccess('Order Updated', 'Order status and details updated successfully');
        setShowReviewModal(false);
        fetchOrders();
      } else {
        notifyAdminError('Update Failed', result.error);
      }
    } catch (e) {
       notifyAdminError('Network Error', 'Failed to update order');
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      const ok = confirm('Delete this order? This action cannot be undone.')
      if (!ok) return
      const res = await fetch(`/api/admin/purchases?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        notifyAdminSuccess('Order Deleted', 'Order successfully removed');
        await fetchOrders()
      } else {
        notifyAdminError('Delete Order Failed', result.error || 'Unknown error')
      }
    } catch (e) {
      notifyAdminError('Network Error', 'Could not delete order')
    }
  }

  const handleBulkAction = async (action: string) => {
    try {
      for (const id of selectedOrders) {
        let nextStatus = null as any;
        switch (action) {
          case 'confirm': nextStatus = 'confirmed'; break;
          case 'ship': nextStatus = 'shipped'; break;
          case 'deliver': nextStatus = 'delivered'; break;
          case 'cancel': nextStatus = 'cancelled'; break;
        }
        if (!nextStatus) continue;
        await fetch('/api/admin/purchases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) })
      }
      await fetchOrders()
      setSelectedOrders([])
      setShowBulkActions(false)
      notifyAdminSuccess('Orders Updated', `Bulk action '${action}' applied`)
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleExportOrders = () => {
    const csvContent = generateCSV(filteredOrders);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchased_books_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = (data: PurchasedBook[]) => {
    const headers = [
      'Order ID', 'Book Title', 'Customer Name', 'Customer Email', 'Quantity', 
      'Total Amount', 'Status', 'Payment Status', 'Order Date', 'Tracking Number'
    ];
    const rows = data.map(order => [
      order.orderId,
      order.bookTitle.en,
      order.customerName,
      order.customerEmail,
      order.quantity,
      order.totalAmount,
      order.status,
      order.paymentStatus,
      new Date(order.orderDate).toLocaleDateString(),
      order.trackingNumber || ''
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.bookTitle.en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || order.paymentStatus === filterPaymentStatus;
    
    let matchesDateRange = true;
    if (dateRange !== 'all') {
      const orderDate = new Date(order.orderDate);
      const now = new Date();
      switch (dateRange) {
        case 'today':
          matchesDateRange = orderDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDateRange = orderDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDateRange;
  }).sort((a, b) => {
    const aValue = a[sortBy as keyof PurchasedBook];
    const bValue = b[sortBy as keyof PurchasedBook];
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
    return aValue < bValue ? 1 : -1;
  });

  return (
    <AdminLayout title="Purchased Books" subtitle="Manage orders and deliveries">
    <div className="admin-modern-container admin-modern-fade-in">
    <AdminHeader
      title="Purchased Books"
      subtitle="Manage book orders and track deliveries"
      actions={
        <>
          <button onClick={handleExportOrders} className="admin-modern-btn admin-modern-btn-secondary">
            <FiDownload /> Export CSV
          </button>
          <button onClick={() => setShowBulkActions(!showBulkActions)} className="admin-modern-btn admin-modern-btn-primary">
            <FiEdit /> Bulk Actions
          </button>
        </>
      }
    />
    
    <div className="admin-modern-stats-grid">
      {[
        { title: 'Total Orders', value: stats?.totalOrders ?? orders.length, icon: FiShoppingCart, color: 'primary' },
        { title: 'Total Revenue', value: stats?.totalRevenue ?? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), icon: FiDollarSign, color: 'success' },
        { title: 'Pending Orders', value: stats?.pendingOrders ?? orders.filter(o => o.status === 'pending').length, icon: FiClock, color: 'warning' },
        { title: 'Avg Order Value', value: stats?.averageOrderValue ?? ((orders.length ? (orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / orders.length) : 0)), icon: FiTrendingUp, color: 'info' },
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
              <h3 className="admin-modern-card-value">
                {stat.title.includes('Revenue') || stat.title.includes('Value') ? 'RM ' : ''}
                {(stat.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        );
      })}
    </div>

    <div className="admin-modern-card">
      <div className="admin-modern-controls">
        <div className="admin-modern-controls-row">
          <div className="admin-modern-search-container">
            <FiSearch className="admin-modern-search-icon" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="admin-modern-search-input"
            />
          </div>
          <div className="admin-modern-controls-actions">
            <button onClick={() => {
              setSearchQuery('');
              setFilterStatus('all');
              setFilterPaymentStatus('all');
            }} className="admin-modern-btn admin-modern-btn-secondary">
              <FiFilter /> Clear Filters
            </button>
          </div>
        </div>
        <div className="admin-modern-filters-panel admin-sticky-toolbar">
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiBook /> Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiCreditCard /> Payment</label>
            <select value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/* Bulk Actions */}
    {showBulkActions && selectedOrders.length > 0 && (
      <div className="admin-modern-card mb-6">
        <div className="admin-modern-table-actions">
          <span className="admin-modern-card-title">{selectedOrders.length} order(s) selected</span>
          <button onClick={() => handleBulkAction('confirm')} className="admin-modern-btn admin-modern-btn-secondary">Confirm</button>
          <button onClick={() => handleBulkAction('ship')} className="admin-modern-btn admin-modern-btn-secondary">Ship</button>
          <button onClick={() => handleBulkAction('deliver')} className="admin-modern-btn admin-modern-btn-secondary">Deliver</button>
          <button onClick={() => handleBulkAction('cancel')} className="admin-modern-btn admin-modern-btn-secondary">Cancel</button>
          <button onClick={() => setShowBulkActions(false)} className="admin-modern-btn admin-modern-btn-secondary">Close</button>
        </div>
      </div>
    )}

    {/* Orders Table - Using Poster Modal Style classes */}
    <div className="admin-modern-table-container">
      <div className="admin-modern-table-header">
         <h2>
           <FiBook />
           Orders ({filteredOrders.length})
         </h2>
         {showBulkActions && (
          <button onClick={() => setSelectedOrders(selectedOrders.length === filteredOrders.length ? [] : filteredOrders.map(o => o.id))} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm">
            {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? <FiCheckSquare /> : <FiSquare />} Select All
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="admin-modern-loading">
          <div className="admin-modern-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="admin-modern-empty-state">
          <FiShoppingCart />
          <h3>No Orders Found</h3>
          <p>No orders match your current filters.</p>
        </div>
      ) : (
        <table className="admin-modern-table">
          <thead>
            <tr>
              {showBulkActions && <th>Select</th>}
              <th>Book Details</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="admin-modern-table-row">
                {showBulkActions && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedOrders(prev => [...prev, order.id]);
                        else setSelectedOrders(prev => prev.filter(id => id !== order.id));
                      }}
                      className="rounded border-[var(--border)] bg-[var(--surface)]"
                    />
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="admin-modern-table-image-container" style={{ width: '48px', height: '48px', minWidth: '48px' }}>
                      <div className="admin-modern-table-image-placeholder">
                        <FiBook />
                      </div>
                    </div>
                    <div className="admin-modern-table-cell-content">
                      <div className="admin-modern-table-cell-title">{getSafeText(order.bookTitle, 'en', 'Unknown Book')}</div>
                      <div className="admin-modern-table-cell-subtitle">Order #{order.orderId}</div>
                      <div className="admin-modern-table-cell-meta">Qty: {order.quantity}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="admin-modern-table-cell-content">
                    <div className="admin-modern-table-cell-title">{order.customerName}</div>
                    <div className="admin-modern-table-cell-meta">{order.customerEmail}</div>
                  </div>
                </td>
                <td>
                  <span className={`admin-modern-badge admin-modern-badge-${
                    order.status === 'delivered' ? 'success' :
                    order.status === 'shipped' ? 'info' :
                    order.status === 'cancelled' ? 'danger' :
                    'warning'
                  }`}>
                    {order.status === 'delivered' ? <FiCheckCircle /> : 
                     order.status === 'shipped' ? <FiTruck /> :
                     order.status === 'cancelled' ? <FiXCircle /> : <FiClock />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <span className={`admin-modern-badge admin-modern-badge-${
                      order.paymentStatus === 'paid' ? 'success' :
                      order.paymentStatus === 'failed' ? 'danger' :
                      'secondary'
                    }`}>
                      {order.paymentStatus.toUpperCase()}
                    </span>
                    <div className="admin-modern-table-cell-meta">
                      <FiCreditCard /> {order.paymentMethod.replace('_', ' ')}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="admin-modern-table-cell-title" style={{ color: 'var(--success)' }}>
                    RM {order.totalAmount.toFixed(2)}
                  </div>
                </td>
                <td>
                  <div className="admin-modern-table-cell-meta">
                    <FiCalendar />
                    {new Date(order.orderDate).toLocaleDateString()}
                  </div>
                </td>
                <td>
                  <div className="admin-modern-table-actions">
                    <button 
                      onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }} 
                      className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button 
                      onClick={() => { setSelectedOrder(order); setShowReviewModal(true); }} 
                      className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                      title="Review Order"
                    >
                      <FiEdit />
                    </button>
                    <button 
                      onClick={() => handleDeleteOrder(order.id)} 
                      className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm"
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background-secondary)] flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="admin-modern-btn admin-modern-btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--foreground-muted)]">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="admin-modern-btn admin-modern-btn-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </div>
    
    <PurchaseDetailModal 
      isOpen={showDetailModal} 
      onClose={() => setShowDetailModal(false)} 
      order={selectedOrder}
      onEdit={(order) => { setShowDetailModal(false); setSelectedOrder(order); setShowReviewModal(true); }}
    />

    <PurchaseReviewModal
      isOpen={showReviewModal}
      onClose={() => setShowReviewModal(false)}
      order={selectedOrder}
      onSave={handleReviewSave}
    />

    </AdminLayout>
  );
};

export default PurchasedBooksManagement;