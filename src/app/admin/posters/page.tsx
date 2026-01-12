'use client';

import React, { useState, useEffect, useRef } from 'react';
// Using unified modern admin styles via AdminLayout
import AdminLayout from '../../../components/admin/AdminLayout';
import AdminHeader from '../../../components/admin/AdminHeader';
import AdminTablePagination from '../../../components/admin/AdminTablePagination';
import PosterModal from '../../../components/admin/PosterModal';
import { 
  FiImage, 
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
  FiStar,
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
  FiTag,
  FiGrid,
  FiBarChart
} from 'react-icons/fi';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';

// Types
interface BilingualText {
  en: string;
  ta: string;
}

interface Poster {
  _id: string;
  title: BilingualText;
  description: BilingualText;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  imagePath?: string;
  eventDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PosterStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  byCategory: { [key: string]: number };
  recentlyAdded: number;
}

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ComponentType;
  iconColor: 'primary' | 'success' | 'warning' | 'info';
}

const PostersAdmin: React.FC = () => {
  // State management
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosters, setTotalPosters] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<Poster | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [stats, setStats] = useState<PosterStats>({
    total: 0,
    active: 0,
    inactive: 0,
    featured: 0,
    byCategory: {},
    recentlyAdded: 0
  });

  // Categories
  const POSTER_CATEGORIES = [
    'event',
    'announcement',
    'cultural',
    'educational',
    'festival',
    'workshop',
    'competition',
    'other'
  ];

  // Fetch posters data
  const fetchPosters = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterCategory !== 'all' && { category: filterCategory }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(filterFeatured !== 'all' && { featured: filterFeatured })
      });

      const response = await fetch(`/api/admin/posters?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posters: ${response.status}`);
      }

      const result = await response.json();
      
      setPosters(result.data || []);
      setTotalPages(result.pagination?.pages || 1);
      setTotalPosters(result.pagination?.total || 0);
      
      // Update stats
      if (result.stats) {
        setStats(result.stats);
      }

    } catch (error: any) {
      const msg = String(error?.message || '');
      const name = String(error?.name || '');
      if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return;
      console.error('Error fetching posters:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch posters');
    } finally {
      setLoading(false);
    }
  };

  // Delete poster
  const handleDeletePoster = async (posterId: string) => {
    if (!confirm('Are you sure you want to delete this poster?')) return;

    try {
      const response = await fetch(`/api/admin/posters?id=${posterId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete poster: ${response.status}`);
      }

      await fetchPosters();
    } catch (error) {
      console.error('Error deleting poster:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete poster');
    }
  };

  // Toggle poster status
  const handleToggleStatus = async (posterId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/posters`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          _id: posterId, 
          isActive: !currentStatus 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update poster: ${response.status}`);
      }

      await fetchPosters();
    } catch (error) {
      console.error('Error updating poster:', error);
      setError(error instanceof Error ? error.message : 'Failed to update poster');
    }
  };

  // Modal handlers
  const handleOpenModal = (poster?: Poster) => {
    setSelectedPoster(poster || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPoster(null);
  };

  const handleSavePoster = async () => {
    try {
      await fetchPosters();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving poster:', error);
    }
  };

  // Effects
  useEffect(() => {
    const controller = new AbortController();
    fetchPosters(controller.signal);
    return () => controller.abort();
  }, [currentPage, searchTerm, filterCategory, filterStatus, filterFeatured]);
  useAdminShortcuts({
    onAdd: () => handleOpenModal(),
    onSearchFocus: () => searchRef.current?.focus(),
    onClearFilters: () => {
      setSearchTerm('');
      setFilterCategory('all');
      setFilterStatus('all');
      setFilterFeatured('all');
      setCurrentPage(1);
    },
    onCloseModal: () => setIsModalOpen(false)
  });

  // Generate stat cards
  const statCards: StatCard[] = [
    {
      title: 'Total Posters',
      value: stats.total || 0,
      change: '+18%',
      changeType: 'positive',
      icon: FiImage,
      iconColor: 'primary'
    },
    {
      title: 'Active Posters',
      value: stats.active || 0,
      change: '+12%',
      changeType: 'positive',
      icon: FiCheckCircle,
      iconColor: 'success'
    },
    {
      title: 'Featured Posters',
      value: stats.featured || 0,
      change: '+25%',
      changeType: 'positive',
      icon: FiStar,
      iconColor: 'warning'
    },
    {
      title: 'Recently Added',
      value: stats.recentlyAdded || 0,
      change: '+8%',
      changeType: 'positive',
      icon: FiClock,
      iconColor: 'info'
    }
  ];

  if (loading && posters.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading posters...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader
          title="Posters Management"
          subtitle="Create, manage and showcase posters for events and announcements."
          actions={
            <>
              <button
                onClick={() => fetchPosters()}
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
                Add Poster
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
                  placeholder="Search posters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-modern-search-input"
                  ref={searchRef}
                />
              </div>
              <div className="admin-modern-controls-actions">
                <button
                  onClick={() => fetchPosters()}
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
                  Add Poster
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="admin-modern-filters-panel admin-sticky-toolbar">
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
                  {POSTER_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
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
                  <FiStar />
                  Featured
                </label>
                <select
                  value={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.value)}
                  className="admin-modern-filter-select"
                >
                  <option value="all">All</option>
                  <option value="featured">Featured</option>
                  <option value="not-featured">Not Featured</option>
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

        {/* Posters Table */}
        <div className="admin-modern-table-container">
          <div className="admin-modern-table-header">
            <h2>
              <FiImage />
              Posters ({totalPosters})
            </h2>
          </div>

          {loading ? (
            <div className="admin-modern-loading">
              <div className="admin-modern-spinner"></div>
              <p>Loading posters...</p>
            </div>
          ) : posters.length === 0 ? (
            <div className="admin-modern-empty-state">
              <FiImage />
              <h3>No Posters Found</h3>
              <p>Start by creating your first poster or adjust your search filters.</p>
              <button
                onClick={() => handleOpenModal()}
                className="admin-modern-btn admin-modern-btn-primary"
              >
                <FiPlus />
                Create Poster
              </button>
            </div>
          ) : (
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Poster Details</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Order</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {posters.map((poster) => (
                  <tr key={poster._id} className="admin-modern-table-row">
                    <td>
                      <div className="admin-modern-table-image-container">
                        {poster.imagePath ? (
                          <img 
                            src={`/api/files/serve?path=${encodeURIComponent(poster.imagePath)}`} 
                            alt={poster.title?.en || 'Poster'} 
                            className="admin-modern-table-image admin-modern-poster-image"
                          />
                        ) : (
                          <div className="admin-modern-table-image-placeholder">
                            <FiImage />
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-content">
                        <div className="admin-modern-table-cell-title">
                          {poster.title?.en || 'Untitled Poster'}
                        </div>
                        <div className="admin-modern-table-cell-subtitle">
                          {poster.title?.ta || 'தலைப்பு இல்லை'}
                        </div>
                        <div className="admin-modern-table-cell-meta">
                          {poster.description?.en ? 
                            (poster.description.en.length > 60 ? 
                              `${poster.description.en.substring(0, 60)}...` : 
                              poster.description.en
                            ) : 
                            'No description'
                          }
                        </div>
                        {poster.eventDate && (
                          <div className="admin-modern-table-cell-meta">
                            <FiCalendar />
                            Event: {new Date(poster.eventDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-modern-badge admin-modern-badge-secondary">
                        <FiFolder />
                        {poster.category}
                      </span>
                    </td>
                    <td>
                      <div className="admin-modern-status-container">
                        <button
                          onClick={() => handleToggleStatus(poster._id, poster.isActive)}
                          className={`admin-modern-badge admin-modern-badge-${poster.isActive ? 'success' : 'warning'}`}
                        >
                          {poster.isActive ? <FiCheckCircle /> : <FiXCircle />}
                          {poster.isActive ? 'Active' : 'Inactive'}
                        </button>
                        {poster.isFeatured && (
                          <span className="admin-modern-badge admin-modern-badge-info admin-modern-featured-badge">
                            <FiStar />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="admin-modern-order-badge">
                        {poster.order}
                      </span>
                    </td>
                    <td>
                      <div className="admin-modern-table-cell-meta">
                        <FiCalendar />
                        {new Date(poster.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="admin-modern-table-actions">
                        <button
                          onClick={() => handleOpenModal(poster)}
                          className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm"
                          title="Edit Poster"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeletePoster(poster._id)}
                          className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm"
                          title="Delete Poster"
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
              totalItems={totalPosters}
              pageSize={10}
              onPageChange={setCurrentPage}
              label="Showing"
            />
          )}
        </div>
      </div>

      {/* Poster Modal */}
      {isModalOpen && (
        <PosterModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSavePoster}
          poster={selectedPoster}
          mode={selectedPoster ? 'edit' : 'create'}
        />
      )}
    </AdminLayout>
  );
};

export default PostersAdmin;
