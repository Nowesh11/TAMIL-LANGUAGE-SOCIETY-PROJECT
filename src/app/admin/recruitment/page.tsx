'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminTablePagination from '../../../components/admin/AdminTablePagination';
import dynamic from 'next/dynamic';
import RecruitmentFormModal from '../../../components/admin/RecruitmentFormModal';
import RecruitmentChartsModal from '../../../components/admin/RecruitmentChartsModal';
import { 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiCopy,
  FiSettings,
  FiUsers,
  FiCalendar,
  FiClock,
  FiCheck,
  FiX,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiFileText,
  FiToggleLeft,
  FiToggleRight,
  FiMove,
  FiType,
  FiList,
  FiCheckSquare,
  FiCircle,
  FiUpload,
  FiMail,
  FiPhone,
  FiCalendar as FiDate,
  FiHash,
  FiAlignLeft,
  FiTrendingUp,
  FiTrendingDown,
  FiBriefcase,
  FiActivity,
  FiBarChart2,
  FiPieChart,
  FiRefreshCw,
  FiDownload,
  FiDatabase,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
  FiXCircle
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { useAuth } from '../../../hooks/useAuth';
import '../../../styles/admin/modals.css';

interface BilingualText {
  en: string;
  ta: string;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'file';
  label: BilingualText;
  placeholder?: BilingualText;
  required: boolean;
  options?: { en: string; ta: string; value: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  order: number;
}

interface RecruitmentForm {
  id: string;
  title: BilingualText;
  description: BilingualText;
  fields: FormField[];
  image?: string;
  isActive: boolean;
  isPublic: boolean;
  allowMultipleSubmissions: boolean;
  submissionDeadline?: string;
  maxSubmissions?: number;
  currentSubmissions: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  projectItemId?: string;
  role?: 'crew' | 'participants' | 'volunteer';
  _id?: string;
}

import { notifyAdminSuccess, notifyAdminError } from '@/lib/adminNotifications';

const RecruitmentFormsManagement = () => {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [forms, setForms] = useState<RecruitmentForm[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [selectedForm, setSelectedForm] = useState<RecruitmentForm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalSubmissions: 0,
    avgFields: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const fetchForms = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' ? 'true' : 'false' })
      });

      const res = await fetch(`/api/admin/recruitment-forms?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        signal
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to fetch recruitment forms');
      
      const list: RecruitmentForm[] = result.data.map((f: any) => ({
        id: f._id,
        _id: f._id,
        title: f.title || { en: 'Untitled', ta: '' },
        description: f.description || { en: '', ta: '' },
        fields: (f.fields || []).map((fld: any) => ({
          id: fld.id,
          type: fld.type,
          label: fld.label || { en: '', ta: '' },
          placeholder: fld.placeholder,
          required: !!fld.required,
          options: fld.options,
          validation: fld.validation,
          order: fld.order || 1
        })),
        image: f.image,
        isActive: !!f.isActive,
        isPublic: true,
        allowMultipleSubmissions: false,
        submissionDeadline: f.endDate || '',
        maxSubmissions: f.maxResponses,
        currentSubmissions: f.currentResponses || 0,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        createdBy: 'Admin',
        projectItemId: f.projectItemId || '',
        role: f.role || 'participants'
      }));
      setForms(list);
      setTotalItems(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 1);
      if (result.stats) setStats(result.stats);
    } catch (error: any) {
      const msg = String(error?.message || '');
      const name = String(error?.name || '');
      if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return;
      console.error('Error fetching forms:', error);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchForms(controller.signal);
    return () => controller.abort();
  }, [currentPage, itemsPerPage, searchQuery, filterStatus]);

  useEffect(() => { 
    const t = setTimeout(() => setSearchQuery(searchInput), 250); 
    return () => clearTimeout(t) 
  }, [searchInput]);

  useAdminShortcuts({
    onAdd: () => {
      setSelectedForm(null);
      setShowCreateModal(true);
    },
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchInput('');
      setFilterStatus('all');
    },
    onCloseModal: () => {
      setShowCreateModal(false);
      setShowEditorModal(false);
    }
  });

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         form.description.en.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && form.isActive) ||
                         (filterStatus === 'inactive' && !form.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const statCards = [
    { 
      title: 'Total Forms', 
      value: stats.total, 
      icon: FiFileText, 
      iconColor: 'primary', 
      change: '+12%', 
      changeType: 'positive' as const 
    },
    { 
      title: 'Active Forms', 
      value: stats.active, 
      icon: FiCheckCircle, 
      iconColor: 'success', 
      change: '+8%', 
      changeType: 'positive' as const 
    },
    { 
      title: 'Total Submissions', 
      value: stats.totalSubmissions, 
      icon: FiUsers, 
      iconColor: 'warning', 
      change: '+25%', 
      changeType: 'positive' as const 
    },
    { 
      title: 'Avg Fields/Form', 
      value: stats.avgFields, 
      icon: FiList, 
      iconColor: 'info', 
      change: '+5%', 
      changeType: 'positive' as const 
    }
  ];

  const handleToggleFormStatus = async (formId: string) => {
    try {
      const target = forms.find(f => f.id === formId);
      if (!target) return;
      const res = await fetch('/api/admin/recruitment-forms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ _id: target._id || target.id, isActive: !target.isActive })
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to toggle status');
      setForms(prev => prev.map(form => form.id === formId ? { ...form, isActive: !form.isActive, updatedAt: new Date().toISOString() } : form));
    } catch (error) {
      console.error('Error toggling form status:', error);
      setError('Failed to toggle status');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      const res = await fetch(`/api/admin/recruitment-forms?id=${encodeURIComponent(formId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to delete form');
      setForms(prev => prev.filter(form => form.id !== formId));
      if (selectedForm?.id === formId) setSelectedForm(null);
    } catch (error) {
      console.error('Error deleting form:', error);
      setError('Failed to delete form');
    }
  };

  if (loading && forms.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading recruitment forms...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader
          title="Recruitment Forms"
          subtitle="Create and manage dynamic recruitment forms linked to projects"
          actions={
            <>
              <button className="admin-modern-btn admin-modern-btn-secondary" onClick={() => fetchForms()}>
                <FiRefreshCw className={loading ? 'admin-modern-spin' : ''} /> Refresh
              </button>
              <button onClick={() => { setSelectedForm(null); setShowCreateModal(true); }} className="admin-modern-btn admin-modern-btn-primary">
                <FiPlus /> New Form
              </button>
            </>
          }
        />

        <div className="admin-modern-stats-grid">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`admin-modern-card ${stat.iconColor} admin-modern-slide-up`}>
                <div className="admin-modern-card-header">
                  <div className={`admin-modern-card-icon ${stat.iconColor}`}>
                    <Icon />
                  </div>
                  <div className={`admin-modern-card-change ${stat.changeType}`}>
                    {stat.changeType === 'positive' ? <FiTrendingUp /> : <FiTrendingDown />}
                    {stat.change}
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

        <div className="admin-modern-card">
          <div className="admin-modern-controls">
            <div className="admin-modern-controls-row">
              <div className="admin-modern-search-container">
                <FiSearch className="admin-modern-search-icon" />
                <input
                  type="text"
                  placeholder="Search forms..."
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
                  <FiSettings /> Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="all">All Forms</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="admin-modern-error">
            <FiXCircle />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="admin-modern-error-close">
              <FiXCircle />
            </button>
          </div>
        )}

        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2>
              <FiFileText />
              Forms ({filteredForms.length})
            </h2>
          </div>

          {filteredForms.length === 0 ? (
            <div className="admin-modern-empty-state">
              <FiFileText />
              <h3>No Forms Found</h3>
              <p>Start by creating your first recruitment form.</p>
              <button
                onClick={() => { setSelectedForm(null); setShowCreateModal(true); }}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                <FiPlus /> Create Form
              </button>
            </div>
          ) : (
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Fields</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map((form) => (
                  <tr key={form.id} className="admin-modern-table-row">
                    <td>
                      <div className="admin-modern-table-cell-content">
                        <div className="admin-modern-table-cell-title">{form.title.en}</div>
                        <div className="admin-modern-table-cell-meta">
                          {form.description.en.length > 60 ? `${form.description.en.substring(0, 60)}...` : form.description.en}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-status-container">
                        <span className={`admin-modern-badge admin-modern-badge-${form.isActive ? 'success' : 'warning'}`}>
                          {form.isActive ? <FiCheckCircle /> : <FiXCircle />}
                          {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-modern-badge admin-modern-badge-info">
                        <FiUsers /> {form.currentSubmissions}
                      </span>
                    </td>
                    <td>{form.fields.length}</td>
                    <td>
                      <div className="admin-modern-table-cell-meta">
                        <FiCalendar /> {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-table-actions">
                        <button
                          onClick={() => {
                            setSelectedForm(form);
                            setShowChartsModal(true);
                          }}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="View Analytics & Charts"
                        >
                          <FiPieChart />
                        </button>
                        <button
                          onClick={() => {
                            if (form.currentSubmissions > 0) {
                                router.push(`/admin/recruitment-responses?formId=${encodeURIComponent(form.id)}`);
                            } else {
                                alert('No submissions to view yet.');
                            }
                          }}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="View Responses List"
                        >
                          <FiList />
                        </button>
                        <button
                          onClick={() => handleToggleFormStatus(form.id)}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title={form.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {form.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button
                          onClick={() => { setSelectedForm(form); setShowEditorModal(true); }}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="Edit Form"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm"
                          title="Delete Form"
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
            <AdminTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      <RecruitmentFormModal
        isOpen={showCreateModal || showEditorModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditorModal(false);
          setSelectedForm(null);
        }}
        onSuccess={() => {
          fetchForms();
        }}
        form={selectedForm as any}
        mode={showCreateModal ? 'create' : 'edit'}
      />

      <RecruitmentChartsModal
        isOpen={showChartsModal}
        onClose={() => {
          setShowChartsModal(false);
          setSelectedForm(null);
        }}
        formId={selectedForm?.id || ''}
        formTitle={selectedForm?.title.en || ''}
      />
    </AdminLayout>
  );
};

export default RecruitmentFormsManagement;
