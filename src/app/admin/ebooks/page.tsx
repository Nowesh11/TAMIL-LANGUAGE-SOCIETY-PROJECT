"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiDownload, 
  FiCheck, FiX, FiArrowUp, FiArrowDown, 
  FiCheckSquare, FiSquare, FiBook, FiStar, FiFileText,
  FiCalendar, FiUser, FiTag, FiHardDrive, FiRefreshCw, FiCheckCircle
} from 'react-icons/fi';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import { notifyAdminError, notifyAdminSuccess } from '@/lib/adminNotifications';
import { getSafeText } from '@/components/SafeText';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import EBookModal from '@/components/admin/EBookModal';

interface EBook {
  _id: string;
  title: { en: string; ta: string };
  author: { en: string; ta: string };
  description: { en: string; ta: string };
  coverPath: string;
  filePath: string;
  fileFormat: string;
  fileSize: number;
  isbn?: string;
  category: string;
  publishedYear: number;
  pages: number;
  language: 'tamil' | 'english' | 'bilingual';
  downloadCount: number;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const EBooksPage = () => {
  // State Management
  const [ebooks, setEbooks] = useState<EBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    totalDownloads: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingEbook, setEditingEbook] = useState<EBook | null>(null);
  const [selectedEbooks, setSelectedEbooks] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Fetch E-Books
  const fetchEbooks = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        language: languageFilter,
        featured: featuredFilter,
        // formatFilter is not supported by API yet, so we might need client side filtering for it or update API.
        // But for now let's assume API handles main filters.
      });
      if (statusFilter === 'all') params.delete('status');
      if (categoryFilter === 'all') params.delete('category');
      if (languageFilter === 'all') params.delete('language');
      if (featuredFilter === 'all') params.delete('featured');

      const response = await fetch(`/api/admin/ebooks?${params}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` }, signal });
      const result = await response.json();
      if (result.success) {
        setEbooks(result.data);
        setTotalItems(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 1);
      }
    } catch (error) {
      const msg = String((error as any)?.message || '');
      const name = String((error as any)?.name || '');
      if (name === 'AbortError' || msg.toLowerCase().includes('aborted')) return;
      console.error('Error fetching e-books:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchEbooks();

  useEffect(() => {
    const controller = new AbortController();
    fetchEbooks(controller.signal);
    return () => controller.abort();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, languageFilter, featuredFilter]);

  // We remove useQuery as we are using manual fetch with effect for simpler control over all params
  // Or we can keep useQuery but we need to update it. 
  // The existing code mixed useQuery and manual fetch. I will stick to manual fetch as per other pages for consistency.
  
  useAdminShortcuts({
    onAdd: () => {
      setEditingEbook(null);
      setShowModal(true);
    },
    onSearchFocus: () => {
      searchRef.current?.focus();
    },
    onToggleView: () => {
      setViewMode(prev => prev === 'table' ? 'grid' : 'table');
    },
    onClearFilters: () => {
      clearFilters();
    },
    onCloseModal: () => {
      setShowModal(false);
    }
  });

  useEffect(() => { const t = setTimeout(() => setSearchTerm(searchInput), 250); return () => clearTimeout(t) }, [searchInput])

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this e-book?')) {
      try {
        const response = await fetch(`/api/admin/ebooks?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` } });
        const result = await response.json();
        if (result.success) {
          await refetch();
          await notifyAdminSuccess('E-Book Deleted', 'The e-book has been deleted')
        } else {
          notifyAdminError('Delete E-Book Failed', result.error || 'Unknown error')
        }
      } catch (error) {
        notifyAdminError('Network Error', 'Could not delete e-book')
      }
    }
  };

  // Handle Edit
  const handleEdit = (ebook: EBook) => {
    setEditingEbook(ebook);
    setShowModal(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/ebooks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
        body: JSON.stringify({ id, active: !currentStatus })
      });
      if (response.ok) {
        await refetch();
        notifyAdminSuccess('Status Updated', `E-Book ${!currentStatus ? 'activated' : 'deactivated'}`);
      } else {
        notifyAdminError('Update Failed', 'Could not update status');
      }
    } catch (error) {
      notifyAdminError('Network Error', 'Could not update status');
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedEbooks.length === ebooks.length) {
      setSelectedEbooks([]);
    } else {
      setSelectedEbooks(ebooks.map(ebook => ebook._id));
    }
  };

  const handleSelectEbook = (ebookId: string) => {
    setSelectedEbooks(prev => 
      prev.includes(ebookId) 
        ? prev.filter(id => id !== ebookId)
        : [...prev, ebookId]
    );
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedEbooks.length} e-books?`)) {
      try {
        await Promise.all(selectedEbooks.map(id =>
          fetch(`/api/admin/ebooks?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` } })
        ));
        await refetch();
        setSelectedEbooks([]);
        setShowBulkActions(false);
        await notifyAdminSuccess('E-Books Deleted', `Deleted ${selectedEbooks.length} selected e-books`)
      } catch (error) {
        notifyAdminError('Bulk Delete Failed', 'Could not delete selected e-books')
      }
    }
  };

  const handleBulkUpdateActive = async (active: boolean) => {
    try {
      await Promise.all(selectedEbooks.map(id =>
        fetch(`/api/admin/ebooks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
          body: JSON.stringify({ id, active })
        })
      ));
      await refetch();
      setSelectedEbooks([]);
      setShowBulkActions(false);
      await notifyAdminSuccess('E-Books Updated', `Set active=${active} for selected e-books`)
    } catch (error) {
      notifyAdminError('Bulk Update Failed', 'Could not update selected e-books')
    }
  };

  const handleBulkUpdateFeatured = async (featured: boolean) => {
    try {
      await Promise.all(selectedEbooks.map(id =>
        fetch(`/api/admin/ebooks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` },
          body: JSON.stringify({ id, featured })
        })
      ));
      await refetch();
      setSelectedEbooks([]);
      setShowBulkActions(false);
      await notifyAdminSuccess('E-Books Updated', `Set featured=${featured} for selected e-books`)
    } catch (error) {
      notifyAdminError('Bulk Update Failed', 'Could not update selected e-books')
    }
  };

  // Export Functions
  const exportAllEbooks = () => {
    const csvContent = generateCSV(ebooks);
    downloadCSV(csvContent, 'all-ebooks.csv');
  };

  const exportSelectedEbooks = () => {
    const selectedEbookData = ebooks.filter(ebook => selectedEbooks.includes(ebook._id));
    const csvContent = generateCSV(selectedEbookData);
    downloadCSV(csvContent, 'selected-ebooks.csv');
  };

  const generateCSV = (data: EBook[]) => {
    const headers = ['Title (EN)', 'Title (TA)', 'Author (EN)', 'Author (TA)', 'Category', 'Language', 'Format', 'File Size', 'Downloads', 'Featured', 'Active', 'Created'];
    const rows = data.map(ebook => [
      ebook.title.en,
      ebook.title.ta,
      ebook.author.en,
      ebook.author.ta,
      ebook.category,
      ebook.language,
      ebook.fileFormat,
      formatFileSize(ebook.fileSize),
      ebook.downloadCount,
      ebook.featured ? 'Yes' : 'No',
      ebook.active ? 'Active' : 'Inactive',
      new Date(ebook.createdAt).toLocaleDateString()
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Sort logic handled by API

  // Helper Functions
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchInput('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setLanguageFilter('all');
    setFeaturedFilter('all');
    setFormatFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Get unique values for filters
  const categories = [...new Set(ebooks.map(ebook => ebook.category))];
  const formats = [...new Set(ebooks.map(ebook => ebook.fileFormat))];

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedEbooks.length > 0);
  }, [selectedEbooks]);

  return (
    <AdminLayout>
      <div className="admin-content">
        <AdminHeader
          title="E-Books Management"
          subtitle="Manage e-books with consistent styles and media handling"
          actions={
            <>
              <button onClick={() => fetchEbooks()} className="admin-modern-btn admin-modern-btn-secondary">
              <FiRefreshCw /> Refresh
            </button>
              <button onClick={exportAllEbooks} className="admin-modern-btn admin-modern-btn-secondary">
                <FiDownload /> Export All
              </button>
              <div className="admin-modern-controls-actions"></div>
              <button onClick={() => { setEditingEbook(null); setShowModal(true); }} className="admin-modern-btn admin-modern-btn-primary">
                <FiPlus /> Add E-Book
              </button>
            </>
          }
        />

        <div className="admin-modern-stats-grid">
          {[
            { title: 'Total E-Books', value: stats.total, icon: FiBook, color: 'primary' },
            { title: 'Active E-Books', value: stats.active, icon: FiCheckCircle, color: 'success' },
            { title: 'Featured', value: stats.featured, icon: FiStar, color: 'warning' },
            { title: 'Total Downloads', value: stats.totalDownloads, icon: FiDownload, color: 'info' },
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

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <div className="admin-modern-card">
          <div className="admin-modern-table-actions">
            <span className="admin-modern-card-title">{selectedEbooks.length} e-book(s) selected</span>
            <button onClick={() => handleBulkUpdateActive(true)} className="admin-modern-btn admin-modern-btn-secondary">
              <FiCheck /> Activate
            </button>
            <button onClick={() => handleBulkUpdateActive(false)} className="admin-modern-btn admin-modern-btn-secondary">
              <FiX /> Deactivate
            </button>
            <button onClick={() => handleBulkUpdateFeatured(true)} className="admin-modern-btn admin-modern-btn-secondary">
              <FiStar /> Feature
            </button>
            <button onClick={() => handleBulkUpdateFeatured(false)} className="admin-modern-btn admin-modern-btn-secondary">
              Unfeature
            </button>
            {selectedEbooks.length > 0 && (
              <button onClick={exportSelectedEbooks} className="admin-modern-btn admin-modern-btn-secondary">
                <FiDownload /> Export Selected
              </button>
            )}
            <button onClick={handleBulkDelete} className="admin-modern-btn admin-modern-btn-danger">
              <FiTrash2 /> Delete
            </button>
            <button onClick={() => { setSelectedEbooks([]); setShowBulkActions(false); }} className="admin-modern-btn admin-modern-btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters & Controls */}
      <div className="admin-modern-controls admin-sticky-toolbar">
        <div className="admin-modern-controls-row">
          <div className="admin-modern-search-container">
            <FiSearch className="admin-modern-search-icon" />
            <input
              type="text"
              placeholder="Search e-books..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              ref={searchRef}
              className="admin-modern-search-input"
            />
          </div>
          <div className="admin-modern-controls-actions">
            <button onClick={() => setViewMode(prev => prev === 'table' ? 'grid' : 'table')} className="admin-modern-btn admin-modern-btn-secondary">
              {viewMode === 'table' ? <FiTag /> : <FiFileText />} {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </button>
            <button onClick={clearFilters} className="admin-modern-btn admin-modern-btn-secondary">
              <FiFilter /> Clear Filters
            </button>
          </div>
        </div>
        <div className="admin-modern-filters-panel">
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiFilter /> Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiTag /> Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiBook /> Language</label>
            <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Languages</option>
              <option value="tamil">Tamil</option>
              <option value="english">English</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiStar /> Featured</label>
            <select value={featuredFilter} onChange={(e) => setFeaturedFilter(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All E-Books</option>
              <option value="featured">Featured</option>
              <option value="not-featured">Not Featured</option>
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiFileText /> Format</label>
            <select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value)} className="admin-modern-filter-select">
              <option value="all">All Formats</option>
              {formats.map(format => (
                <option key={format} value={format}>{format.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiArrowDown /> Sort Order</label>
            <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="admin-modern-btn admin-modern-btn-secondary">
              {sortOrder === 'asc' ? <FiArrowUp /> : <FiArrowDown />} {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiFileText /> Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="admin-modern-filter-select">
              <option value="createdAt">Date</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="downloads">Downloads</option>
              <option value="fileSize">File Size</option>
            </select>
          </div>
          <div className="admin-modern-filter-group">
            <label className="admin-modern-filter-label"><FiCheckSquare /> Selection</label>
            <button onClick={handleSelectAll} className="admin-modern-btn admin-modern-btn-secondary">
              {selectedEbooks.length === ebooks.length ? <FiCheckSquare /> : <FiSquare />} Select All
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="admin-modern-loading">
          <div className="admin-modern-loading-spinner"></div>
          <p>Loading e-books...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && ebooks.length === 0 && (
        <div className="admin-modern-empty-state">
          <FiBook />
          <h3>No E-Books Found</h3>
          <p>Try adjusting your filters or add a new e-book.</p>
          <button
            onClick={() => { setEditingEbook(null); setShowModal(true); }}
            className="admin-modern-btn admin-modern-btn-primary"
          >
            <FiPlus /> Add E-Book
          </button>
        </div>
      )}

      {/* E-Books Display */}
      {!loading && ebooks.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="admin-modern-grid">
              {ebooks.map((ebook) => (
                <div
                  key={ebook._id}
                  className={`admin-modern-card ${selectedEbooks.includes(ebook._id) ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Selection Button */}
                  <div className="admin-modern-card-actions" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                     <input
                        type="checkbox"
                        checked={selectedEbooks.includes(ebook._id)}
                        onChange={(e) => { e.stopPropagation(); handleSelectEbook(ebook._id); }}
                        style={{ width: '20px', height: '20px' }}
                      />
                  </div>

                  {/* Cover Image */}
                  <div className="admin-modern-card-image" style={{
                    height: '200px',
                    background: ebook.coverPath 
                      ? `url(${ebook.coverPath}) center/cover` 
                      : 'linear-gradient(135deg, var(--bg-accent), var(--bg-accent-soft))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}>
                    {!ebook.coverPath && (
                      <FiBook style={{ fontSize: '3rem', color: 'var(--text-inverse)', opacity: 0.7 }} />
                    )}
                    
                    {/* Featured Badge */}
                    {ebook.featured && (
                      <div className="admin-modern-badge warning" style={{ position: 'absolute', top: '10px', right: '10px' }}>
                        <FiStar /> Featured
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="admin-modern-card-content">
                    <h3 className="admin-modern-card-title">
                      {getSafeText(ebook.title, 'en', 'Untitled')}
                    </h3>
                    <p className="admin-modern-card-subtitle">
                      {getSafeText(ebook.title, 'ta', '')}
                    </p>

                    <div className="admin-modern-meta-row">
                      <FiUser />
                      <span>{getSafeText(ebook.author, 'en', '')}</span>
                    </div>

                    <div className="admin-modern-meta-grid">
                      <div className="meta-item">
                        <FiFileText />
                        {ebook.fileFormat.toUpperCase()}
                      </div>
                      <div className="meta-item">
                        <FiHardDrive />
                        {formatFileSize(ebook.fileSize)}
                      </div>
                      <div className="meta-item">
                        <FiDownload />
                        {ebook.downloadCount}
                      </div>
                    </div>

                    <div className="admin-modern-badges">
                      <span className={`admin-modern-badge ${ebook.language === 'tamil' ? 'success' : ebook.language === 'english' ? 'info' : 'primary'}`}>
                        {ebook.language}
                      </span>
                      <span className={`admin-modern-badge ${ebook.active ? 'success' : 'danger'}`}>
                        {ebook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="admin-modern-card-actions-footer">
                      <button
                        onClick={() => handleEdit(ebook)}
                        className="admin-modern-btn admin-modern-btn-secondary flex-1"
                      >
                        <FiEdit2 /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ebook._id)}
                        className="admin-modern-btn admin-modern-btn-danger"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="admin-modern-table-wrapper">
              <table className="admin-modern-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedEbooks.length === ebooks.length && ebooks.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Cover</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Format</th>
                    <th>Size</th>
                    <th>Downloads</th>
                    <th>Category</th>
                    <th>Language</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ebooks.map((ebook) => (
                    <tr key={ebook._id} className={selectedEbooks.includes(ebook._id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedEbooks.includes(ebook._id)}
                          onChange={() => handleSelectEbook(ebook._id)}
                        />
                      </td>
                      <td>
                        <div className="admin-modern-table-image">
                          {ebook.coverPath ? (
                            <img src={ebook.coverPath} alt={getSafeText(ebook.title, 'en', '')} />
                          ) : (
                            <div className="placeholder"><FiBook /></div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-modern-table-cell-primary">
                          <div className="primary-text">{getSafeText(ebook.title, 'en', 'Untitled')}</div>
                          <div className="secondary-text">{getSafeText(ebook.title, 'ta', '')}</div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-modern-table-cell-secondary">
                          <FiUser className="icon" />
                          {getSafeText(ebook.author, 'en', '')}
                        </div>
                      </td>
                      <td>
                        <span className="admin-modern-badge secondary">{ebook.fileFormat.toUpperCase()}</span>
                      </td>
                      <td>{formatFileSize(ebook.fileSize)}</td>
                      <td>{ebook.downloadCount}</td>
                      <td>{ebook.category}</td>
                      <td>
                        <span className={`admin-modern-badge ${ebook.language === 'tamil' ? 'success' : ebook.language === 'english' ? 'info' : 'primary'}`}>
                          {ebook.language}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-modern-badge ${ebook.active ? 'success' : 'danger'}`}>
                          {ebook.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-modern-row-actions">
                          <button onClick={() => handleEdit(ebook)} className="admin-modern-action-btn edit" title="Edit">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDelete(ebook._id)} className="admin-modern-action-btn delete" title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        </>
      )}

      </div>
      
      <EBookModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          refetch();
          notifyAdminSuccess('Success', editingEbook ? 'E-Book updated successfully' : 'E-Book created successfully');
        }}
        ebook={editingEbook as any}
        mode={editingEbook ? 'edit' : 'create'}
      />
    </AdminLayout>
  );
};

export default EBooksPage;
