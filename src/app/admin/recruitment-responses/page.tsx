'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/admin/AdminLayout'
import AdminHeader from '@/components/admin/AdminHeader'
import AdminTablePagination from '@/components/admin/AdminTablePagination'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  FiEye, 
  FiDownload, 
  FiSearch,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiStar,
  FiMessageSquare,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiBarChart,
  FiPieChart,
  FiX,
  FiMail,
  FiPhone,
  FiCheck,
  FiFilter,
  FiMoreVertical,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiArrowLeft,
  FiArrowRight
} from 'react-icons/fi';
import { notifyAdminSuccess, notifyAdminError } from '@/lib/adminNotifications';
import '../../../styles/admin/modals.css';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { useAuth } from '@/hooks/useAuth';
import RecruitmentDetailModal from '@/components/admin/RecruitmentDetailModal';
import RecruitmentReviewModal from '@/components/admin/RecruitmentReviewModal';

interface FormResponse {
  id: string;
  formId: string;
  formTitle: string;
  submittedAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'shortlisted';
  priority: 'low' | 'medium' | 'high';
  rating?: number;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  responses: Record<string, any>;
  attachments?: string[];
  ipAddress?: string;
  userAgent?: string;
}

interface RecruitmentForm {
  id: string;
  title: string;
  fields: any[];
}

const RecruitmentResponsesContent = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null);
  
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [forms, setForms] = useState<RecruitmentForm[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  
  // Stats State
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    shortlisted: 0
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Filter State
  const [filterForm, setFilterForm] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Bulk Actions State
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // UI State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { accessToken } = useAuth();

  const [reviewData, setReviewData] = useState({
    status: 'pending' as 'pending' | 'reviewed' | 'rejected' | 'approved' | 'shortlisted',
    rating: 0,
    notes: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Initialize from URL params
  useEffect(() => {
    const formId = searchParams?.get('formId');
    if (formId) setFilterForm(formId);
  }, [searchParams]);

  // Debounce Search
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch Data
  useEffect(() => {
    if (accessToken) {
      fetchResponses();
    }
  }, [currentPage, itemsPerPage, filterForm, filterStatus, filterPriority, searchQuery, accessToken]);

  useEffect(() => {
    if (accessToken) {
      fetchForms();
    }
  }, [accessToken]);

  // Admin Shortcuts
  useAdminShortcuts({
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchInput('');
      setFilterForm('all');
      setFilterStatus('all');
      setFilterPriority('all');
      setCurrentPage(1);
    },
    onCloseModal: () => {
      setShowDetailModal(false);
      setShowReviewModal(false);
    }
  });

  const fetchResponses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      if (filterForm && filterForm !== 'all') params.append('formId', filterForm);
      if (filterStatus && filterStatus !== 'all') params.append('status', filterStatus);
      if (filterPriority && filterPriority !== 'all') params.append('priority', filterPriority);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/recruitment-responses?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const result = await res.json();
      if (result.success) {
        const mapped: FormResponse[] = (result.data || []).map((r: any) => ({
          id: r._id,
          formId: r.formId,
          formTitle: r.formTitle?.en || r.formTitle || 'Untitled Form',
          submittedAt: r.createdAt,
          submitterName: r.submitterName || 'Anonymous',
          submitterEmail: r.submitterEmail || '',
          submitterPhone: r.submitterPhone,
          status: r.status || 'pending',
          priority: r.priority || 'medium',
          rating: r.rating,
          reviewNotes: r.reviewNotes,
          reviewedBy: r.reviewedBy,
          reviewedAt: r.reviewedAt,
          responses: r.answers || {},
          attachments: r.attachments || [],
          ipAddress: r.ipAddress,
          userAgent: r.userAgent
        }));
        
        setResponses(mapped);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 1);
        
        if (result.stats) {
          setStats(result.stats);
        }

        // Reset selection on new data fetch
        setSelectedResponses([]);
      } else {
        throw new Error(result.error || 'Failed to fetch responses');
      }
    } catch (error: any) {
      console.error('Error fetching responses:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/admin/recruitment-forms?limit=100', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.success) {
        const mapped: RecruitmentForm[] = (data.data || []).map((f: any) => ({
          id: f._id,
          title: f.title?.en || '',
          fields: f.fields || []
        }));
        setForms(mapped);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const handleReviewResponse = async (data: any) => {
    if (!selectedResponse) return;

    try {
      const payload = {
        id: selectedResponse.id,
        status: data.status,
        rating: data.rating || undefined,
        reviewNotes: data.notes || undefined,
        priority: data.priority
      };

      const res = await fetch('/api/admin/recruitment-responses', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${accessToken}` 
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        fetchResponses();
        setShowReviewModal(false);
        setSelectedResponse(null);
        await notifyAdminSuccess('Response Reviewed', 'Saved review details');
      } else {
        throw new Error(result.error || 'Failed to save review');
      }
    } catch (error) {
      notifyAdminError('Review Failed', 'Could not save review');
    }
  };

  const handleDeleteResponse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    
    try {
      const res = await fetch(`/api/admin/recruitment-responses?id=${encodeURIComponent(id)}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${accessToken}` } 
      });
      
      const result = await res.json();
      if (result.success) {
        fetchResponses();
        await notifyAdminSuccess('Response Deleted', 'Deleted the response');
      } else {
        throw new Error(result.error || 'Failed to delete response');
      }
    } catch (error) {
      notifyAdminError('Delete Failed', 'Could not delete response');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedResponses.length} responses?`)) return;

    try {
      // Execute sequentially or parallel - for now sequentially to be safe
      let successCount = 0;
      for (const id of selectedResponses) {
        const res = await fetch(`/api/admin/recruitment-responses?id=${encodeURIComponent(id)}`, { 
          method: 'DELETE', 
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } 
        });
        const result = await res.json();
        if (result.success) successCount++;
      }
      
      fetchResponses();
      setSelectedResponses([]);
      await notifyAdminSuccess('Bulk Delete', `Deleted ${successCount} responses`);
    } catch (error) {
      notifyAdminError('Bulk Delete Failed', 'Could not delete some responses');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      let successCount = 0;
      for (const id of selectedResponses) {
        const res = await fetch('/api/admin/recruitment-responses', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${accessToken}` 
          },
          body: JSON.stringify({ id, status })
        });
        const result = await res.json();
        if (result.success) successCount++;
      }
      
      fetchResponses();
      setSelectedResponses([]);
      await notifyAdminSuccess('Bulk Update', `Updated ${successCount} responses`);
    } catch (error) {
      notifyAdminError('Bulk Update Failed', 'Could not update some responses');
    }
  };

  const handleExportResponses = () => {
    // Simple CSV export of current view
    const headers = ['Form', 'Submitter Name', 'Email', 'Phone', 'Status', 'Priority', 'Submitted At'];
    const csvContent = [
      headers.join(','),
      ...responses.map(r => [
        `"${r.formTitle}"`,
        `"${r.submitterName}"`,
        `"${r.submitterEmail}"`,
        `"${r.submitterPhone || ''}"`,
        `"${r.status}"`,
        `"${r.priority}"`,
        `"${new Date(r.submittedAt).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `recruitment_responses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetReviewForm = () => {
    setReviewData({
      status: 'pending',
      rating: 0,
      notes: '',
      priority: 'medium'
    });
  };

  const openReviewModal = (response: FormResponse) => {
    setSelectedResponse(response);
    setReviewData({
      status: response.status,
      rating: response.rating || 0,
      notes: response.reviewNotes || '',
      priority: response.priority
    });
    setShowReviewModal(true);
  };

  const openDetailModal = (response: FormResponse) => {
    setSelectedResponse(response);
    setShowDetailModal(true);
  };

  useEffect(() => {
    if (showDetailModal || showReviewModal) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [showDetailModal, showReviewModal]);

  const statCards = [
    { 
      title: 'Total Responses', 
      value: stats.total, 
      icon: FiFileText, 
      iconColor: 'primary',
      change: '+12%', 
      changeType: 'positive' as const
    },
    { 
      title: 'Pending Review', 
      value: stats.pending, 
      icon: FiClock, 
      iconColor: 'warning',
      change: '-5%', 
      changeType: 'positive' as const
    },
    { 
      title: 'Shortlisted', 
      value: stats.shortlisted, 
      icon: FiStar, 
      iconColor: 'info',
      change: '+8%', 
      changeType: 'positive' as const
    },
    { 
      title: 'Approved', 
      value: stats.approved, 
      icon: FiCheckCircle, 
      iconColor: 'success',
      change: '+15%', 
      changeType: 'positive' as const
    }
  ];

  if (loading && responses.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading responses...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader
          title="Recruitment Responses"
          subtitle="Review and manage form submissions"
          actions={
            <>
              <button onClick={() => fetchResponses()} className="admin-modern-btn admin-modern-btn-secondary">
                <FiRefreshCw className={loading ? 'admin-modern-spin' : ''} /> Refresh
              </button>
              <button onClick={handleExportResponses} className="admin-modern-btn admin-modern-btn-secondary">
                <FiDownload /> Export CSV
              </button>
              <button 
                onClick={() => setShowBulkActions(!showBulkActions)} 
                className={`admin-modern-btn ${showBulkActions ? 'admin-modern-btn-primary' : 'admin-modern-btn-secondary'}`}
              >
                <FiEdit /> {showBulkActions ? 'Hide Bulk Actions' : 'Bulk Actions'}
              </button>
            </>
          }
        />

        {/* Statistics Grid */}
        <div className="admin-modern-stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`admin-modern-card ${stat.iconColor} admin-modern-slide-up`}>
                <div className="admin-modern-card-header">
                  <div className={`admin-modern-card-icon ${stat.iconColor}`}>
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

        {/* Bulk Actions Bar */}
        {showBulkActions && selectedResponses.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-medium text-sm">
                {selectedResponses.length} selected
              </span>
              <span className="text-indigo-600 text-sm hidden md:inline">Choose an action to apply to selected items</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('approved')}
                className="px-4 py-2 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiCheckCircle /> Approve
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('rejected')}
                className="px-4 py-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiXCircle /> Reject
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('shortlisted')}
                className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiStar /> Shortlist
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="admin-modern-controls">
          <div className="admin-modern-controls-row">
            <div className="admin-modern-search-container">
              <FiSearch className="admin-modern-search-icon" />
              <input
                type="text"
                placeholder="Search responses..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="admin-modern-search-input"
                ref={searchRef}
              />
            </div>
          </div>
          
          <div className="admin-modern-filters-panel admin-sticky-toolbar">
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label">
                <FiFilter /> Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="admin-modern-filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="shortlisted">Shortlisted</option>
              </select>
            </div>

            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label">
                <FiAlertCircle /> Priority
              </label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="admin-modern-filter-select"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label">
                <FiFileText /> Form
              </label>
              <select
                value={filterForm}
                onChange={(e) => setFilterForm(e.target.value)}
                className="admin-modern-filter-select"
              >
                <option value="all">All Forms</option>
                {forms.map(form => (
                  <option key={form.id} value={form.id}>{form.title}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Responses Table */}
        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2>
              <FiFileText />
              Responses ({totalItems})
            </h2>
          </div>

          {responses.length === 0 ? (
            <div className="admin-modern-empty-state">
              <FiFileText style={{ fontSize: '4rem' }} />
              <h3>No Responses Found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th className="w-12">
                    {showBulkActions && (
                      <input
                        type="checkbox"
                        checked={responses.length > 0 && selectedResponses.length === responses.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResponses(responses.map(r => r.id));
                          } else {
                            setSelectedResponses([]);
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    )}
                  </th>
                  <th>Applicant</th>
                  <th>Form</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response) => (
                  <tr key={response.id} className="admin-modern-table-row">
                    <td>
                      {showBulkActions && (
                        <input
                          type="checkbox"
                          checked={selectedResponses.includes(response.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResponses([...selectedResponses, response.id]);
                            } else {
                              setSelectedResponses(selectedResponses.filter(id => id !== response.id));
                            }
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      )}
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-content">
                        <div className="admin-modern-table-cell-title">{response.submitterName}</div>
                        <div className="admin-modern-table-cell-subtitle">{response.submitterEmail}</div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{response.formTitle}</div>
                    </td>
                    <td>
                      <span className={`admin-modern-badge ${
                        response.status === 'approved' ? 'admin-modern-badge-success' :
                        response.status === 'rejected' ? 'admin-modern-badge-danger' :
                        response.status === 'shortlisted' ? 'admin-modern-badge-primary' :
                        'admin-modern-badge-warning'
                      }`}>
                        {response.status.charAt(0).toUpperCase() + response.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-modern-badge ${
                        response.priority === 'high' ? 'admin-modern-badge-danger' :
                        response.priority === 'medium' ? 'admin-modern-badge-warning' :
                        'admin-modern-badge-success'
                      }`}>
                        {response.priority.charAt(0).toUpperCase() + response.priority.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-meta">
                        <FiCalendar />
                        {new Date(response.submittedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-table-actions">
                        <button
                          onClick={() => openDetailModal(response)}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => openReviewModal(response)}
                          className="admin-modern-btn admin-modern-btn-primary admin-modern-btn-sm"
                          title="Review"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteResponse(response.id)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <AdminTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
              label="Showing"
            />
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <RecruitmentDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        response={selectedResponse}
        onReview={(response) => {
          openReviewModal(response);
        }}
      />

      {/* Review Modal */}
      <RecruitmentReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        response={selectedResponse}
        onSave={handleReviewResponse}
      />
    </AdminLayout>
  );
};

export default function RecruitmentResponsesManagement() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <RecruitmentResponsesContent />
    </React.Suspense>
  );
}
