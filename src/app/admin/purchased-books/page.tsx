'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminTablePagination from '@/components/admin/AdminTablePagination'
import { notifyAdminError, notifyAdminSuccess } from '@/lib/adminNotifications'
import { getSafeText } from '@/components/SafeText';
import { 
  FiPackage, 
  FiTruck, 
  FiCheck, 
  FiX, 
  FiClock, 
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBook,
  FiShoppingCart,
  FiRefreshCw,
  FiMoreVertical,
  FiPrinter,
  FiSend,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiTrendingUp,
  FiBarChart,
  FiPieChart,
  FiCheckSquare,
  FiSquare,
  FiActivity,
  FiUsers,
  FiShoppingBag,
  FiCreditCard,
  FiFileText,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const [editData, setEditData] = useState<Partial<PurchasedBook>>({});

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
    onAdd: () => setShowAddModal(true),
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
      setShowEditModal(false);
      setShowAddModal(false);
    }
  });

  const fetchOrders = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterPaymentStatus !== 'all' && { paymentStatus: filterPaymentStatus }),
        ...(searchQuery && { search: searchQuery })
      })
      const res = await fetch(`/api/admin/purchases?${params}`, { signal })
      const result = await res.json()
      if (result.success) {
        const mapped: PurchasedBook[] = result.data.map((p: any) => ({
          id: p._id,
          orderId: p.orderId,
          bookId: p.bookRef,
          bookTitle: { en: '', ta: '' },
          bookAuthor: { en: '', ta: '' },
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
          trackingNumber: p.shippingDetails?.trackingNumber,
          shippingCarrier: p.shippingDetails?.shippingCarrier,
          estimatedDelivery: p.shippingDetails?.estimatedDelivery,
          actualDelivery: p.shippingDetails?.actualDelivery,
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

    // Calculate top selling books
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

  const handleUpdateOrderStatus = async (orderId: string, status: PurchasedBook['status']) => {
    try {
      const res = await fetch('/api/admin/purchases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, status }) })
      const result = await res.json()
      if (result.success) {
        await fetchOrders()
      } else {
        notifyAdminError('Update Status Failed', result.error || 'Unknown error')
      }
    } catch (error) {
      notifyAdminError('Network Error', 'Could not update order status')
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: PurchasedBook['paymentStatus']) => {
    try {
      const res = await fetch('/api/admin/purchases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, paymentStatus }) })
      const result = await res.json()
      if (result.success) {
        await fetchOrders()
        await notifyAdminSuccess('Payment Updated', `Payment status set to '${paymentStatus}'`)
      } else {
        notifyAdminError('Update Payment Failed', result.error || 'Unknown error')
      }
    } catch (error) {
      notifyAdminError('Network Error', 'Could not update payment status')
    }
  };

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
        const res = await fetch('/api/admin/purchases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: nextStatus }) })
        const result = await res.json()
        if (!result.success) {
          notifyAdminError('Bulk Update Failed', result.error || 'Unknown error')
        }
      }
      await fetchOrders()
      setSelectedOrders([])
      setShowBulkActions(false)
      await notifyAdminSuccess('Orders Updated', `Bulk action '${action}' applied to selected orders`)
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };
  const handleBulkPaymentUpdate = async (paymentStatus: 'paid' | 'unpaid' | 'refunded' | 'pending' | 'failed') => {
    try {
      for (const id of selectedOrders) {
        const res = await fetch('/api/admin/purchases', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, paymentStatus }) })
        const result = await res.json()
        if (!result.success) {
          notifyAdminError('Bulk Payment Update Failed', result.error || 'Unknown error')
        }
      }
      await fetchOrders()
      setSelectedOrders([])
      setShowBulkActions(false)
      await notifyAdminSuccess('Payments Updated', `Set payment status '${paymentStatus}' for selected orders`)
    } catch (error) {
      notifyAdminError('Network Error', 'Could not update payment status for selected orders')
    }
  }

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

  const openDetailModal = (order: PurchasedBook) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openEditModal = (order: PurchasedBook) => {
    setSelectedOrder(order);
    setEditData(order);
    setShowEditModal(true);
  };
  const [addData, setAddData] = useState<any>({});
  const handleCreateOrder = async () => {
    try {
      const payload = {
        userRef: addData.userRef,
        bookRef: addData.bookRef,
        quantity: Number(addData.quantity || 1),
        unitPrice: Number(addData.unitPrice || 0),
        shippingFee: Number(addData.shippingFee || 0),
        paymentDetails: {
          method: addData.paymentMethod || 'fpx',
          amount: Number(addData.paymentAmount || 0),
          currency: (addData.currency || 'RM').toUpperCase(),
          transactionId: addData.transactionId || ''
        },
        shippingAddress: {
          fullName: addData.fullName || '',
          addressLine1: addData.addressLine1 || '',
          addressLine2: addData.addressLine2 || '',
          city: addData.city || '',
          state: addData.state || '',
          postalCode: addData.postalCode || '',
          country: addData.country || 'Malaysia',
          phone: addData.phone || ''
        },
        status: addData.status || 'pending',
        notes: addData.notes || ''
      }
      const res = await fetch('/api/admin/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await res.json()
      if (result.success) {
        setShowAddModal(false)
        setAddData({})
        await fetchOrders()
      } else {
        notifyAdminError('Create Order Failed', result.error || 'Unknown error')
      }
    } catch (e) {
      notifyAdminError('Network Error', 'Could not create order')
    }
  }
  const handleDeleteOrder = async (id: string) => {
    try {
      const ok = confirm('Delete this order?')
      if (!ok) return
      const res = await fetch(`/api/admin/purchases?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        await fetchOrders()
      } else {
        notifyAdminError('Delete Order Failed', result.error || 'Unknown error')
      }
    } catch (e) {
      notifyAdminError('Network Error', 'Could not delete order')
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedOrder || !editData) return;

    try {
      const updatedOrder = {
        ...selectedOrder,
        ...editData,
        updatedAt: new Date().toISOString()
      };

      setOrders(prev =>
        prev.map(order =>
          order.id === selectedOrder.id ? updatedOrder as PurchasedBook : order
        )
      );

      setShowEditModal(false);
      setSelectedOrder(null);
      setEditData({});
      calculateStats();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'confirmed': return 'text-blue-700 bg-blue-100';
      case 'processing': return 'text-purple-700 bg-purple-100';
      case 'shipped': return 'text-indigo-700 bg-indigo-100';
      case 'delivered': return 'text-green-700 bg-green-100';
      case 'cancelled': return 'text-red-700 bg-red-100';
      case 'refunded': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'paid': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      case 'refunded': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
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
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

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
        { title: 'Paid Orders', value: orders.filter(o => o.paymentStatus === 'paid').length, icon: FiCreditCard, color: 'success' },
        { title: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: FiCheckCircle, color: 'info' },
        { title: 'Revenue', value: (stats?.totalRevenue ?? 0), icon: FiDollarSign, color: 'warning' },
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
      <div className="admin-modern-filters-panel">
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
    <div className="admin-content">
      <div className="max-w-7xl mx-auto">

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
                  <h3 className="admin-modern-card-value">{(stat.value || 0).toLocaleString()}</h3>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters block moved to admin-modern-controls above */}

        {/* Bulk Actions */}
        {showBulkActions && selectedOrders.length > 0 && (
          <div className="admin-modern-card">
            <div className="admin-modern-table-actions">
              <span className="admin-modern-card-title">{selectedOrders.length} order(s) selected</span>
              <button onClick={() => handleBulkAction('confirm')} className="admin-modern-btn admin-modern-btn-secondary">
                Confirm
              </button>
              <button onClick={() => handleBulkAction('ship')} className="admin-modern-btn admin-modern-btn-secondary">
                Ship
              </button>
              <button onClick={() => handleBulkAction('deliver')} className="admin-modern-btn admin-modern-btn-secondary">
                Deliver
              </button>
              <button onClick={() => handleBulkAction('cancel')} className="admin-modern-btn admin-modern-btn-secondary">
                Cancel
              </button>
              <button onClick={() => handleBulkPaymentUpdate('paid')} className="admin-modern-btn admin-modern-btn-secondary">
                Set Paid
              </button>
              <button onClick={() => handleBulkPaymentUpdate('unpaid')} className="admin-modern-btn admin-modern-btn-secondary">
                Set Unpaid
              </button>
              <button onClick={() => handleBulkPaymentUpdate('refunded')} className="admin-modern-btn admin-modern-btn-secondary">
                Set Refunded
              </button>
              <button onClick={() => setShowBulkActions(false)} className="admin-modern-btn admin-modern-btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Orders Table */}
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
          <div className="overflow-x-auto">
            <table className="admin-modern-table">
              <thead>
                <tr>
                  {showBulkActions && <th>Select</th>}
                  <th>Order ID</th>
                  <th>Book</th>
                  <th>Customer</th>
                  <th>Qty / Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Order Date</th>
                  <th>Tracking</th>
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
                        />
                      </td>
                    )}
                    <td className="admin-modern-table-cell-title">{order.orderId}</td>
                    <td>
                      <div className="admin-modern-table-cell-title">{getSafeText(order.bookTitle, 'en', '')}</div>
                      <div className="admin-modern-table-cell-meta">by {getSafeText(order.bookAuthor, 'en', '')}</div>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-title">{order.customerName}</div>
                      <div className="admin-modern-table-cell-meta">{order.customerEmail}</div>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-meta">Qty: {order.quantity} × ₹{order.bookPrice}</div>
                      <div className="admin-modern-table-cell-meta">Total: ₹{order.totalAmount}</div>
                    </td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>{order.status.toUpperCase()}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus.toUpperCase()}</span>
                      <div className="admin-modern-table-cell-meta"><FiCreditCard /> {order.paymentMethod.replace('_', ' ')}</div>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-meta"><FiCalendar /> {new Date(order.orderDate).toLocaleDateString()}</div>
                    </td>
                    <td>
                      {order.trackingNumber ? (
                        <div className="admin-modern-table-cell-meta"><FiTruck /> {order.trackingNumber}</div>
                      ) : (
                        <div className="admin-modern-table-cell-meta">-</div>
                      )}
                    </td>
                    <td>
                      <div className="admin-modern-table-actions">
                        <button onClick={() => openDetailModal(order)} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm" title="View Details">
                          <FiEye />
                        </button>
                        <button onClick={() => openEditModal(order)} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm" title="Edit Order">
                          <FiEdit />
                        </button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm" title="Delete Order">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
                  let page = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      page = currentPage - 2 + i;
                    }
                    if (page > totalPages) {
                      page = totalPages - (4 - i);
                    }
                  }
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

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="modern-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modern-modal-container max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="modern-modal-header">
              <h2 className="modern-modal-title">Order Details - {selectedOrder.orderId}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="modern-close-button"
              >
                <FiX />
              </button>
            </div>
            
            <div className="modern-modal-body">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="modern-form-section">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Order Information</h4>
                  <div className="space-y-3">
                    <div className="modern-field-group">
                      <label className="modern-label">Order ID</label>
                      <p className="text-gray-900">{selectedOrder.orderId}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Status</label>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Payment Status</label>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                        {selectedOrder.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Order Date</label>
                      <p className="text-gray-900">{new Date(selectedOrder.orderDate).toLocaleString()}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Payment Method</label>
                      <p className="text-gray-900 capitalize">{selectedOrder.paymentMethod.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
                
                {/* Customer Information */}
                <div className="modern-form-section">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="modern-field-group">
                      <label className="modern-label">Name</label>
                      <p className="text-gray-900">{selectedOrder.customerName}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Email</label>
                      <p className="text-gray-900">{selectedOrder.customerEmail}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Phone</label>
                      <p className="text-gray-900">{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Shipping Address</label>
                      <div className="text-gray-900">
                        <p>{selectedOrder.shippingAddress.street}</p>
                        <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                        <p>{selectedOrder.shippingAddress.postalCode}, {selectedOrder.shippingAddress.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Book Information */}
              <div className="modern-form-section mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Book Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="modern-field-group">
                      <label className="modern-label">Title (English)</label>
                      <p className="text-gray-900">{getSafeText(selectedOrder.bookTitle, 'en', '')}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Title (Tamil)</label>
                      <p className="text-gray-900">{getSafeText(selectedOrder.bookTitle, 'ta', '')}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Author (English)</label>
                      <p className="text-gray-900">{getSafeText(selectedOrder.bookAuthor, 'en', '')}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Author (Tamil)</label>
                      <p className="text-gray-900">{getSafeText(selectedOrder.bookAuthor, 'ta', '')}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Price</label>
                      <p className="text-gray-900">₹{selectedOrder.bookPrice}</p>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Quantity</label>
                      <p className="text-gray-900">{selectedOrder.quantity}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-900">Total Amount</span>
                      <span className="text-lg font-bold text-green-600">₹{selectedOrder.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Shipping Information */}
              {(selectedOrder.trackingNumber || selectedOrder.estimatedDelivery) && (
                <div className="modern-form-section mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Shipping Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedOrder.trackingNumber && (
                        <div className="modern-field-group">
                          <label className="modern-label">Tracking Number</label>
                          <p className="text-gray-900">{selectedOrder.trackingNumber}</p>
                        </div>
                      )}
                      {selectedOrder.shippingCarrier && (
                        <div className="modern-field-group">
                          <label className="modern-label">Shipping Carrier</label>
                          <p className="text-gray-900">{editData.shippingCarrier ?? selectedOrder.shippingCarrier ?? ''}</p>
                        </div>
                      )}
                      {selectedOrder.estimatedDelivery && (
                        <div className="modern-field-group">
                          <label className="modern-label">Estimated Delivery</label>
                          <p className="text-gray-900">{new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedOrder.actualDelivery && (
                        <div className="modern-field-group">
                          <label className="modern-label">Actual Delivery</label>
                          <p className="text-gray-900">{new Date(selectedOrder.actualDelivery).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notes */}
              {selectedOrder.notes && (
                <div className="modern-form-section mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modern-modal-footer">
              <button
                onClick={() => setShowDetailModal(false)}
                className="admin-modern-btn admin-modern-btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedOrder);
                }}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="modern-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modern-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modern-modal-header">
              <h2 className="modern-modal-title">Edit Order - {selectedOrder.orderId}</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="modern-close-button"
              >
                <FiX />
              </button>
            </div>
            
            <div className="modern-modal-body">
              <div className="modern-form-section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="modern-field-group">
                    <label className="modern-label">Status</label>
                    <select
                      value={editData.status ?? selectedOrder.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="modern-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                  
                  <div className="modern-field-group">
                    <label className="modern-label">Payment Status</label>
                    <select
                      value={editData.paymentStatus ?? selectedOrder.paymentStatus}
                      onChange={(e) => setEditData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                      className="modern-select"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="modern-field-group">
                    <label className="modern-label">Tracking Number</label>
                    <input
                      type="text"
                      value={editData.trackingNumber ?? selectedOrder.trackingNumber ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                      className="modern-input"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  
                  <div className="modern-field-group">
                    <label className="modern-label">Shipping Carrier</label>
                    <input
                      type="text"
                      value={editData.shippingCarrier ?? selectedOrder.shippingCarrier ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, shippingCarrier: e.target.value }))}
                      className="modern-input"
                      placeholder="Enter shipping carrier"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="modern-field-group">
                    <label className="modern-label">Estimated Delivery</label>
                    <input
                      type="date"
                      value={editData.estimatedDelivery ? editData.estimatedDelivery.split('T')[0] : selectedOrder.estimatedDelivery?.split('T')[0] ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, estimatedDelivery: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                      className="modern-input"
                    />
                  </div>
                  
                  <div className="modern-field-group">
                    <label className="modern-label">Actual Delivery</label>
                    <input
                      type="date"
                      value={editData.actualDelivery ? editData.actualDelivery.split('T')[0] : selectedOrder.actualDelivery?.split('T')[0] ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, actualDelivery: e.target.value ? new Date(e.target.value).toISOString() : undefined }))}
                      className="modern-input"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="modern-field-group">
                    <label className="modern-label">Notes</label>
                    <textarea
                      value={editData.notes ?? selectedOrder.notes ?? ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="modern-input"
                      placeholder="Add order notes..."
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modern-modal-footer">
              <button
                onClick={() => setShowEditModal(false)}
                className="admin-modern-btn admin-modern-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="modern-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modern-modal-container max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="modern-modal-header">
              <h2 className="modern-modal-title">Add Order</h2>
              <button onClick={() => setShowAddModal(false)} className="modern-close-button">
                <FiX />
              </button>
            </div>
            <div className="modern-modal-body">
              <div className="modern-form-section">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="modern-field-group">
                    <label className="modern-label">User ID</label>
                    <input className="modern-input" value={addData.userRef || ''} onChange={e => setAddData((p: any) => ({ ...p, userRef: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Book ID</label>
                    <input className="modern-input" value={addData.bookRef || ''} onChange={e => setAddData((p: any) => ({ ...p, bookRef: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Quantity</label>
                    <input type="number" className="modern-input" value={addData.quantity || 1} onChange={e => setAddData((p: any) => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Unit Price</label>
                    <input type="number" className="modern-input" value={addData.unitPrice || 0} onChange={e => setAddData((p: any) => ({ ...p, unitPrice: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Shipping Fee</label>
                    <input type="number" className="modern-input" value={addData.shippingFee || 0} onChange={e => setAddData((p: any) => ({ ...p, shippingFee: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Payment Method</label>
                    <select className="modern-select" value={addData.paymentMethod || 'fpx'} onChange={e => setAddData((p: any) => ({ ...p, paymentMethod: e.target.value }))}>
                      <option value="fpx">FPX</option>
                      <option value="epayum">E-PAY UM</option>
                    </select>
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Payment Amount</label>
                    <input type="number" className="modern-input" value={addData.paymentAmount || 0} onChange={e => setAddData((p: any) => ({ ...p, paymentAmount: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Currency</label>
                    <input className="modern-input" value={addData.currency || 'RM'} onChange={e => setAddData((p: any) => ({ ...p, currency: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 modern-field-group">
                    <label className="modern-label">Full Name</label>
                    <input className="modern-input" value={addData.fullName || ''} onChange={e => setAddData((p: any) => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 modern-field-group">
                    <label className="modern-label">Address Line 1</label>
                    <input className="modern-input" value={addData.addressLine1 || ''} onChange={e => setAddData((p: any) => ({ ...p, addressLine1: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2 modern-field-group">
                    <label className="modern-label">Address Line 2</label>
                    <input className="modern-input" value={addData.addressLine2 || ''} onChange={e => setAddData((p: any) => ({ ...p, addressLine2: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">City</label>
                    <input className="modern-input" value={addData.city || ''} onChange={e => setAddData((p: any) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">State</label>
                    <input className="modern-input" value={addData.state || ''} onChange={e => setAddData((p: any) => ({ ...p, state: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Postal Code</label>
                    <input className="modern-input" value={addData.postalCode || ''} onChange={e => setAddData((p: any) => ({ ...p, postalCode: e.target.value }))} />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Country</label>
                    <input className="modern-input" value={addData.country || 'Malaysia'} onChange={e => setAddData((p: any) => ({ ...p, country: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>
            <div className="modern-modal-footer">
              <button onClick={() => setShowAddModal(false)} className="admin-modern-btn admin-modern-btn-secondary">
                Cancel
              </button>
              <button onClick={handleCreateOrder} className="admin-modern-btn admin-modern-btn-primary">
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
};

export default PurchasedBooksManagement;
