'use client';

import React, { useState, useEffect } from 'react';
// Using unified modern admin styles via AdminLayout
import AdminLayout from '../../../components/admin/AdminLayout';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminTablePagination from '../../../components/admin/AdminTablePagination';
import ComponentModal from '../../../components/admin/ComponentModal';
import { 
  FiGrid, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiEdit, 
  FiTrash2, 
  FiEye, 
  FiEyeOff,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiFolder,
  FiImage,
  FiCode,
  FiLayers,
  FiRefreshCw,
  FiDownload,
  FiUpload,
  FiSettings,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCalendar,
  FiUser,
  FiTag
} from 'react-icons/fi';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';

// Types
interface BilingualText {
  en: string;
  ta: string;
}

interface SafeContent {
  title: BilingualText;
  description: BilingualText;
  content: BilingualText;
}

interface Component {
  _id: string;
  type: string;
  content: SafeContent;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  version?: string;
  author?: string;
}

interface ComponentStats {
  total: number;
  active: number;
  inactive: number;
  recentlyAdded: number;
  categories: { [key: string]: number };
  types: { [key: string]: number };
}

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ComponentType;
  iconColor: 'primary' | 'success' | 'warning' | 'info';
}

const ComponentsAdmin: React.FC = () => {
  // State management
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComponents, setTotalComponents] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [stats, setStats] = useState<ComponentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    recentlyAdded: 0,
    categories: {},
    types: {}
  });

  useEffect(() => {
    fetchComponents();
  }, [currentPage, searchTerm, filterType, filterStatus, filterCategory]);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useAdminShortcuts({
    onAdd: () => { setSelectedComponent(null); setIsModalOpen(true); },
    onClearFilters: () => {
      setSearchInput('');
      setFilterType('all');
      setFilterStatus('all');
      setFilterCategory('all');
      setCurrentPage(1);
    },
    onCloseModal: () => setIsModalOpen(false)
  });

  const fetchComponents = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterCategory !== 'all' && { category: filterCategory })
      });

      const response = await fetch(`/api/admin/components?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      if (!response.ok) throw new Error(`Failed to fetch components: ${response.status}`);
      const result = await response.json();

      if (result.success) {
        setComponents(result.data || []);
        setTotalPages(result.pagination?.pages || 1);
        setTotalComponents(result.pagination?.total || 0);
        if (result.stats) {
          setStats({
            total: result.stats.totalActive + result.stats.totalInactive,
            active: result.stats.totalActive,
            inactive: result.stats.totalInactive,
            recentlyAdded: 0,
            categories: result.stats.categories?.reduce((acc: any, item: any) => {
              acc[item._id] = item.count;
              return acc;
            }, {}) || {},
            types: result.stats.topTypes?.reduce((acc: any, item: any) => {
              acc[item._id] = item.count;
              return acc;
            }, {}) || {}
          });
        }
      } else {
        setError(result.error || 'Failed to fetch components');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching components:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete component
  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    try {
      const response = await fetch(`/api/admin/components/${componentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete component: ${response.status}`);
      }

      await fetchComponents();
    } catch (error) {
      console.error('Error deleting component:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete component');
    }
  };

  // Toggle component status
  const handleToggleStatus = async (componentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/components/${componentId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isActive: !currentStatus 
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to update component status`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await fetchComponents();
    } catch (error) {
      console.error('Error updating component:', error);
      setError(error instanceof Error ? error.message : 'Failed to update component');
    }
  };

  // Modal handlers
  const handleOpenModal = (component?: Component) => {
    setSelectedComponent(component || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedComponent(null);
  };

  const handleSaveComponent = async (componentData: any) => {
    try {
      const url = selectedComponent 
        ? `/api/admin/components/${selectedComponent._id}` 
        : '/api/admin/components';
      
      const method = selectedComponent ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(componentData)
      });

      if (!response.ok) {
        let errorMessage = `Failed to ${selectedComponent ? 'update' : 'create'} component`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      await fetchComponents();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving component:', error);
      setError(error instanceof Error ? error.message : 'Failed to save component');
      throw error;
    }
  };

  // Generate stat cards
  const statCards: StatCard[] = [
    {
      title: 'Total Components',
      value: stats.total || 0,
      change: '+12%',
      changeType: 'positive',
      icon: FiGrid,
      iconColor: 'primary'
    },
    {
      title: 'Active Components',
      value: stats.active || 0,
      change: '+8%',
      changeType: 'positive',
      icon: FiCheckCircle,
      iconColor: 'success'
    },
    {
      title: 'Inactive Components',
      value: stats.inactive || 0,
      change: '-5%',
      changeType: 'negative',
      icon: FiXCircle,
      iconColor: 'warning'
    },
    {
      title: 'Recently Added',
      value: stats.recentlyAdded || 0,
      change: '+15%',
      changeType: 'positive',
      icon: FiClock,
      iconColor: 'info'
    }
  ];

  // Get unique values for filters
  const uniqueTypes = Object.keys(stats.types).length > 0 
    ? Object.keys(stats.types) 
    : [...new Set(components.map(c => c.type))];
    
  const uniqueCategories = Object.keys(stats.categories).length > 0
    ? Object.keys(stats.categories)
    : [...new Set(components.map(c => c.category).filter(Boolean) as string[])];

  if (loading && components.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading components...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader
          title="Components Management"
          subtitle="Manage and organize your website components with powerful tools and insights."
          actions={
            <>
              <button
                onClick={() => fetchComponents()}
                className="admin-modern-btn admin-modern-btn-secondary"
                disabled={loading}
              >
                <FiRefreshCw className={loading ? 'admin-modern-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => handleOpenModal()}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                <FiPlus />
                Add Component
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
                  <div className={`admin-modern-card-change ${stat.changeType}`}>
                    {stat.changeType === 'positive' ? (
                      <FiTrendingUp />
                    ) : (
                      <FiTrendingDown />
                    )}
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

        {/* Controls Section */}
        <div className="admin-modern-card">
          <div className="admin-modern-controls">
            {/* Search and Add Button */}
            <div className="admin-modern-controls-row">
              <div className="admin-modern-search-container">
                <FiSearch className="admin-modern-search-icon" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="admin-modern-search-input"
                />
              </div>
              <div className="admin-modern-controls-actions">
                <button onClick={() => {
                  setSearchInput('');
                  setFilterType('all');
                  setFilterStatus('all');
                  setFilterCategory('all');
                  setCurrentPage(1);
                }} className="admin-modern-btn admin-modern-btn-secondary">
                  <FiRefreshCw /> Reset
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-modern-filters-panel">
              <div className="admin-modern-filter-group">
                <label className="admin-modern-filter-label">
                  <FiFilter />
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="all">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="admin-modern-filter-group">
                <label className="admin-modern-filter-label">
                  <FiSettings />
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="admin-modern-filter-group">
                <label className="admin-modern-filter-label">
                  <FiTag />
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="admin-modern-error">
            <FiXCircle />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="admin-modern-error-close">
              <FiXCircle />
            </button>
          </div>
        )}

        {/* Components Table */}
        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2>
              <FiGrid />
              Components ({totalComponents})
            </h2>
          </div>

          {loading ? (
            <div className="admin-modern-loading">
              <div className="admin-modern-spinner"></div>
              <p>Loading components...</p>
            </div>
          ) : components.length === 0 ? (
            <div className="admin-modern-empty-state">
              <FiGrid />
              <h3>No Components Found</h3>
              <p>Start by creating your first component or adjust your search filters.</p>
              <button
                onClick={() => handleOpenModal()}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                <FiPlus />
                Create Component
              </button>
            </div>
          ) : (
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {components.map((component) => (
                  <tr key={component._id} className="admin-modern-table-row">
                    <td>
                      <div className="admin-modern-table-cell-content">
                        <div className="admin-modern-table-cell-title">
                          {component.content?.title?.en || 'Untitled Component'}
                        </div>
                        <div className="admin-modern-table-cell-subtitle">
                          {component.content?.description?.en || 'No description'}
                        </div>
                        {component.imageUrl && (
                          <img 
                            src={component.imageUrl} 
                            alt="Component" 
                            className="admin-modern-table-image"
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-modern-badge admin-modern-badge-secondary">
                        <FiCode />
                        {component.type}
                      </span>
                    </td>
                    <td>
                      <span className="admin-modern-badge admin-modern-badge-info">
                        <FiFolder />
                        {component.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleStatus(component._id, component.isActive)}
                        className={`admin-modern-badge admin-modern-badge-${component.isActive ? 'success' : 'warning'}`}
                      >
                        {component.isActive ? <FiCheckCircle /> : <FiXCircle />}
                        {component.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-meta">
                        <FiCalendar />
                        {new Date(component.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-table-actions">
                        <button
                          onClick={() => handleOpenModal(component)}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="Edit Component"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteComponent(component._id)}
                          className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm"
                          title="Delete Component"
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
              totalItems={totalComponents}
              pageSize={10}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* Component Modal */}
      {isModalOpen && (
        <ComponentModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveComponent}
          component={selectedComponent as any}
          mode={selectedComponent ? 'edit' : 'create'}
        />
      )}
    </AdminLayout>
  );
};

export default ComponentsAdmin;
