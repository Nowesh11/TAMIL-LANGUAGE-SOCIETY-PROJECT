"use client";

import React, { useEffect, useState, useRef } from 'react';
import AdminLayout from '../../../components/admin/AdminLayout';
import AdminHeader from '../../../components/admin/AdminHeader';
import ProjectItemModal, { ProjectItemForm } from '../../../components/admin/ProjectItemModal';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiStar, FiCheckCircle, FiAlertCircle, 
  FiCalendar, FiDollarSign, FiFolder, FiTrendingUp, FiTrendingDown, FiUsers, 
  FiBriefcase, FiActivity, FiUpload, FiEye, FiCopy, FiMoreVertical,
  FiRefreshCw, FiDownload, FiSettings, FiBarChart2, FiPieChart, FiDatabase,
  FiImage, FiMapPin, FiXCircle, FiClock
} from 'react-icons/fi';
import AdminTablePagination from '../../../components/admin/AdminTablePagination';
import { getSafeText } from '@/components/SafeText';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import '../../../styles/admin/modals.css';

interface BilingualText { en: string; ta: string; }

interface ProjectItem {
  _id: string;
  type: 'project' | 'activity' | 'initiative';
  bureau?: 'sports_leadership' | 'education_intellectual' | 'arts_culture' | 'social_welfare_voluntary' | 'language_literature';
  title: BilingualText;
  shortDesc: BilingualText;
  fullDesc: BilingualText;
  images: string[];
  heroImagePath?: string;
  goals: BilingualText;
  achievement: BilingualText;
  directorName: BilingualText;
  recruitmentFormId?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: BilingualText;
  participants?: number;
  featured: boolean;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStats {
  total: number;
  active: number;
  featured: number;
  planning: number;
  completed: number;
  totalBudget: number;
}

export default function ProjectItemsPage() {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [bureauFilter, setBureauFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [featuredFilter, setFeaturedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    active: 0,
    featured: 0,
    planning: 0,
    completed: 0,
    totalBudget: 0
  });
  
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, typeFilter, bureauFilter, activeFilter, featuredFilter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useAdminShortcuts({
    onAdd: () => { setEditingItem(null); setIsModalOpen(true); },
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchInput('');
      setStatusFilter('all');
      setTypeFilter('all');
      setBureauFilter('all');
      setActiveFilter('all');
      setFeaturedFilter('all');
      setPagination(p => ({ ...p, page: 1 }));
    },
    onCloseModal: () => setIsModalOpen(false)
  });

  const fetchProjects = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(bureauFilter !== 'all' && { bureau: bureauFilter }),
        ...(activeFilter !== 'all' && { active: activeFilter }),
        ...(featuredFilter !== 'all' && { featured: featuredFilter })
      });

      const res = await fetch(`/api/admin/project-items?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const result = await res.json();
      
      if (result.success) {
        setItems(result.data || []);
        setPagination(result.pagination || pagination);
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        setError(result.error || 'Failed to fetch projects');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => { setEditingItem(null); setIsModalOpen(true); };
  const handleEdit = (item: ProjectItem) => { setEditingItem(item); setIsModalOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project item?')) return;
    try {
      const response = await fetch(`/api/admin/project-items?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const result = await response.json();
      if (result.success) {
        fetchProjects();
      } else {
        alert('Failed to delete project item: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting project item:', error);
      alert('Error deleting project item. Please try again.');
    }
  };

  const handleModalSaved = async () => {
    await fetchProjects();
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDuplicate = async (item: ProjectItem) => {
    if (!confirm(`Duplicate "${getSafeText(item.title)}"?`)) return;
    
    try {
      const duplicatedItem = {
        ...item,
        title: { en: `${item.title.en} (Copy)`, ta: `${item.title.ta} (Copy)` },
        active: false,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      delete (duplicatedItem as any)._id;
      
      const response = await fetch('/api/admin/project-items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}` 
        },
        body: JSON.stringify(duplicatedItem)
      });
      
      const result = await response.json();
      if (result.success) {
        fetchProjects();
      } else {
        alert('Failed to duplicate project item: ' + result.error);
      }
    } catch (error) {
      console.error('Error duplicating project item:', error);
      alert('Error duplicating project item. Please try again.');
    }
  };

  if (loading && items.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading projects...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader 
          title="Projects & Activities" 
          subtitle="Manage all society projects, events and initiatives"
          actions={
            <button onClick={handleCreate} className="admin-modern-btn admin-modern-btn-primary">
              <FiPlus /> New Project
            </button>
          }
        />

        {/* Stats Grid */}
        <div className="admin-modern-stats-grid">
          {[
            { title: 'Total Projects', value: stats.total, icon: FiFolder, color: 'primary' },
            { title: 'Active', value: stats.active, icon: FiCheckCircle, color: 'success' },
            { title: 'Planning', value: stats.planning, icon: FiCalendar, color: 'info' },
            { title: 'Completed', value: stats.completed, icon: FiCheckCircle, color: 'success' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
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
                placeholder="Search projects..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                ref={searchRef}
                className="admin-modern-search-input"
              />
            </div>
            <div className="admin-modern-controls-actions">
              <button onClick={() => {
                setSearchInput('');
                setStatusFilter('all');
                setTypeFilter('all');
                setBureauFilter('all');
                setActiveFilter('all');
                setFeaturedFilter('all');
                setPagination(p => ({ ...p, page: 1 }));
              }} className="admin-modern-btn admin-modern-btn-secondary">
                <FiFilter /> Clear Filters
              </button>
            </div>
          </div>
          
          <div className="admin-modern-filters-panel">
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiBriefcase /> Type</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Types</option>
                <option value="project">Project</option>
                <option value="activity">Activity</option>
                <option value="initiative">Initiative</option>
              </select>
            </div>
            
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiActivity /> Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiUsers /> Bureau</label>
              <select value={bureauFilter} onChange={(e) => setBureauFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Bureaus</option>
                <option value="sports_leadership">Sports & Leadership</option>
                <option value="education_intellectual">Education & Intellectual</option>
                <option value="arts_culture">Arts & Culture</option>
                <option value="social_welfare_voluntary">Social Welfare</option>
                <option value="language_literature">Language & Literature</option>
              </select>
            </div>

            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiCheckCircle /> Active</label>
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiStar /> Featured</label>
              <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All</option>
                <option value="true">Featured</option>
                <option value="false">Not Featured</option>
              </select>
            </div>
          </div>
        </div>

        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2><FiFolder /> Project List</h2>
            <div className="admin-modern-table-actions">
              <button className="admin-modern-btn admin-modern-btn-ghost" onClick={() => fetchProjects()}>
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Project Info</th>
                  <th>Bureau & Type</th>
                  <th>Status</th>
                  <th>Timeline</th>
                  <th>Budget & Stats</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">
                      <div className="admin-modern-empty-state">
                        <FiFolder />
                        <h3>No projects found</h3>
                        <p>Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item._id} className="admin-modern-table-row">
                      <td>
                        <div className="admin-modern-table-cell-title">{getSafeText(item.title)}</div>
                        <div className="admin-modern-table-cell-subtitle">{getSafeText(item.directorName) || 'No Director'}</div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <span className="admin-modern-badge admin-modern-badge-secondary">
                            {item.bureau?.replace(/_/g, ' ') || 'General'}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-modern-badge ${
                          item.status === 'active' ? 'admin-modern-badge-success' :
                          item.status === 'planning' ? 'admin-modern-badge-info' :
                          item.status === 'completed' ? 'admin-modern-badge-primary' :
                          item.status === 'cancelled' ? 'admin-modern-badge-danger' :
                          'admin-modern-badge-warning'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm">
                          {item.startDate && <div className="flex items-center gap-1"><FiCalendar className="w-3 h-3" /> {new Date(item.startDate).toLocaleDateString()}</div>}
                          {item.endDate && <div className="flex items-center gap-1 text-gray-500"><FiClock className="w-3 h-3" /> {new Date(item.endDate).toLocaleDateString()}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {item.budget && <div className="font-medium text-green-600"><FiDollarSign className="inline w-3 h-3" /> {item.budget.toLocaleString()}</div>}
                          {item.participants && <div className="text-gray-500"><FiUsers className="inline w-3 h-3" /> {item.participants}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {item.active ? 
                            <span className="text-green-600" title="Active"><FiCheckCircle /></span> : 
                            <span className="text-gray-400" title="Inactive"><FiXCircle /></span>
                          }
                          {item.featured && <span className="text-yellow-500" title="Featured"><FiStar /></span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-modern-table-actions">
                          <button onClick={() => handleEdit(item)} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm" title="Edit">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDuplicate(item)} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm" title="Duplicate">
                            <FiCopy />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm" title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <AdminTablePagination 
            currentPage={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            pageSize={pagination.limit}
            onPageChange={(page) => setPagination(p => ({ ...p, page }))}
          />
        </div>

        <ProjectItemModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleModalSaved}
          item={editingItem}
          mode={editingItem ? 'edit' : 'create'}
        />
      </div>
    </AdminLayout>
  );
}
