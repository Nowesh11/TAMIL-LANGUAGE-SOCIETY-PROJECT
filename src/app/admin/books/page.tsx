'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch, 
  FiFilter, 
  FiDollarSign, 
  FiStar, 
  FiBook, 
  FiUser, 
  FiCalendar, 
  FiPackage, 
  FiAlertTriangle, 
  FiDownload, 
  FiGrid, 
  FiList, 
  FiCheck, 
  FiX, 
  FiArrowUp, 
  FiArrowDown, 
  FiCheckSquare, 
  FiSquare, 
  FiTag, 
  FiFileText, 
  FiCheckCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiGlobe
} from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminTablePagination from '@/components/admin/AdminTablePagination';
import BookModal from '@/components/admin/BookModal';
import { getSafeText } from '@/components/SafeText';
import { useAdminShortcuts } from '@/hooks/useAdminShortcuts';
import { notifyAdminError, notifyAdminSuccess } from '@/lib/adminNotifications';
import '../../../styles/admin/modals.css';

interface Book {
  _id: string;
  title: {
    en: string;
    ta: string;
  };
  author: {
    en: string;
    ta: string;
  };
  description: {
    en: string;
    ta: string;
  };
  price: number;
  stock: number;
  coverPath: string;
  isbn: string;
  category: string;
  publishedYear: number;
  pages: number;
  language: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  isAvailable: boolean;
}

interface ApiResponse {
  success: boolean;
  data: Book[];
  stats?: {
    total: number;
    active: number;
    outOfStock: number;
    lowStock: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
}

const BooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
    lowStock: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const searchRef = useRef<HTMLInputElement | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'literature', label: 'Literature' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'history', label: 'History' },
    { value: 'culture', label: 'Culture' },
    { value: 'education', label: 'Education' },
    { value: 'religion', label: 'Religion' },
    { value: 'science', label: 'Science' },
    { value: 'children', label: 'Children' },
    { value: 'general', label: 'General' }
  ];

  const languages = [
    { value: 'all', label: 'All Languages' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'english', label: 'English' },
    { value: 'bilingual', label: 'Bilingual' }
  ];

  const stockStatuses = [
    { value: 'all', label: 'All Stock' },
    { value: 'inStock', label: 'In Stock (>10)' },
    { value: 'lowStock', label: 'Low Stock (1-10)' },
    { value: 'outOfStock', label: 'Out of Stock (0)' }
  ];

  useEffect(() => {
    fetchBooks();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, languageFilter, featuredFilter, stockFilter, sortBy, sortOrder]);

  useEffect(() => { 
    const t = setTimeout(() => setSearchTerm(searchInput), 250); 
    return () => clearTimeout(t) 
  }, [searchInput]);

  useAdminShortcuts({
    onAdd: () => {
      setEditingBook(null);
      setShowModal(true);
    },
    onSearchFocus: () => searchRef.current?.focus(),
    onToggleView: () => setViewMode(prev => prev === 'grid' ? 'table' : 'grid'),
    onClearFilters: () => {
      setSearchInput('');
      setStatusFilter('all');
      setCategoryFilter('all');
      setLanguageFilter('all');
      setStockFilter('all');
      setFeaturedFilter('all');
      setSortBy('createdAt');
      setSortOrder('desc');
      setSelectedBooks([]);
      setCurrentPage(1);
    },
    onCloseModal: () => setShowModal(false)
  });

  const fetchBooks = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(languageFilter !== 'all' && { language: languageFilter }),
        ...(featuredFilter !== 'all' && { featured: featuredFilter }),
        ...(stockFilter !== 'all' && { stockStatus: stockFilter }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/books?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        signal
      });

      const result: ApiResponse = await response.json();
      
      if (result.success) {
        setBooks(result.data);
        setTotalPages(result.pagination.pages);
        setTotalItems(result.pagination.total);
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        notifyAdminError('Fetch Failed', 'Failed to fetch books');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching books:', error);
      notifyAdminError('Fetch Failed', 'Error fetching books');
    } finally {
      setLoading(false);
    }
  };

  // Create and Update logic handled by BookModal


  const handleDeleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/admin/books?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (result.success) {
        notifyAdminSuccess('Success', 'Book deleted successfully');
        fetchBooks();
        if (selectedBooks.includes(id)) {
          setSelectedBooks(prev => prev.filter(bookId => bookId !== id));
        }
      } else {
        notifyAdminError('Error', result.error || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      notifyAdminError('Error', 'Error deleting book');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/books?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, active: !currentStatus })
      });

      const result = await response.json();

      if (result.success) {
        notifyAdminSuccess('Success', `Book ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchBooks();
      } else {
        notifyAdminError('Error', result.error || 'Failed to update book status');
      }
    } catch (error) {
      console.error('Error updating book status:', error);
      notifyAdminError('Error', 'Error updating book status');
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
    try {
      const response = await fetch(`/api/admin/books?id=${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, featured: !currentFeatured })
      });

      const result = await response.json();

      if (result.success) {
        notifyAdminSuccess('Success', `Book ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
        fetchBooks();
      } else {
        notifyAdminError('Error', result.error || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      notifyAdminError('Error', 'Error updating featured status');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBooks.length} books?`)) return;

    try {
      // Assuming there's a bulk delete API or we loop
      // Implementing loop for safety if bulk API doesn't exist
      let successCount = 0;
      for (const id of selectedBooks) {
        const response = await fetch(`/api/admin/books?id=${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) successCount++;
      }

      notifyAdminSuccess('Success', `Deleted ${successCount} books`);
      setSelectedBooks([]);
      setShowBulkActions(false);
      fetchBooks();
    } catch (error) {
      console.error('Error deleting books:', error);
      notifyAdminError('Error', 'Error deleting books');
    }
  };

  const toggleSelectBook = (id: string) => {
    setSelectedBooks(prev => {
      const newSelection = prev.includes(id) 
        ? prev.filter(bookId => bookId !== id)
        : [...prev, id];
      
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const selectAllBooks = () => {
    if (selectedBooks.length === books.length) {
      setSelectedBooks([]);
      setShowBulkActions(false);
    } else {
      setSelectedBooks(books.map(b => b._id));
      setShowBulkActions(true);
    }
  };

  if (loading && books.length === 0) {
    return (
      <AdminLayout>
        <div className="admin-modern-container">
          <div className="admin-modern-loading">
            <div className="admin-modern-spinner"></div>
            <p>Loading books...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-modern-container admin-modern-fade-in">
        <AdminHeader 
          title="Books Management" 
          subtitle="Manage library inventory and book details"
          actions={
            <button onClick={() => {
              setEditingBook(null);
              setShowModal(true);
            }} className="admin-modern-btn admin-modern-btn-primary">
              <FiPlus /> Add Book
            </button>
          }
        />

        {/* Stats Grid */}
        <div className="admin-modern-stats-grid">
          {[
            { title: 'Total Books', value: stats.total, icon: FiBook, color: 'primary' },
            { title: 'Active', value: stats.active, icon: FiCheckCircle, color: 'success' },
            { title: 'Out of Stock', value: stats.outOfStock, icon: FiAlertTriangle, color: 'danger' },
            { title: 'Low Stock', value: stats.lowStock, icon: FiPackage, color: 'warning' },
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
                placeholder="Search by title, author, or ISBN..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                ref={searchRef}
                className="admin-modern-search-input"
              />
            </div>
            <div className="admin-modern-controls-actions">
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
                  className={`admin-modern-btn admin-modern-btn-secondary ${viewMode === 'grid' ? 'active' : ''}`}
                  title={viewMode === 'grid' ? "Switch to List View" : "Switch to Grid View"}
                >
                  {viewMode === 'grid' ? <FiList /> : <FiGrid />}
                </button>
                <button onClick={() => {
                  setSearchInput('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setLanguageFilter('all');
                  setStockFilter('all');
                  setFeaturedFilter('all');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setSelectedBooks([]);
                  setCurrentPage(1);
                }} className="admin-modern-btn admin-modern-btn-secondary">
                  <FiRefreshCw /> Reset
                </button>
              </div>
            </div>
          </div>
          
          <div className="admin-modern-filters-panel">
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiTag /> Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="admin-modern-filter-select">
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiActivity /> Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="admin-modern-filter-select">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-modern-filter-group">
              <label className="admin-modern-filter-label"><FiPackage /> Stock</label>
              <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="admin-modern-filter-select">
                {stockStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
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

          {/* Bulk Actions */}
          {showBulkActions && (
            <div className="admin-modern-bulk-actions">
              <span className="text-sm font-medium">{selectedBooks.length} items selected</span>
              <div className="flex gap-2">
                <button onClick={handleBulkDelete} className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm">
                  <FiTrash2 /> Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {viewMode === 'table' ? (
          <div className="admin-modern-table-container">
            <div className="admin-modern-table-header">
              <h2><FiBook /> Book List ({totalItems})</h2>
              <div className="admin-modern-table-actions">
                <button className="admin-modern-btn admin-modern-btn-ghost" onClick={() => fetchBooks()}>
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="admin-modern-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedBooks.length === books.length && books.length > 0}
                          onChange={selectAllBooks}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                    </th>
                    <th>Book Info</th>
                    <th>Category & Language</th>
                    <th>Price & Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <div className="admin-modern-empty-state">
                          <FiBook />
                          <h3>No books found</h3>
                          <p>Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book._id} className={`admin-modern-table-row ${selectedBooks.includes(book._id) ? 'bg-primary-50' : ''}`}>
                        <td className="text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedBooks.includes(book._id)}
                            onChange={() => toggleSelectBook(book._id)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            {book.coverPath && (
                              <img src={book.coverPath} alt={getSafeText(book.title)} className="w-10 h-14 object-cover rounded shadow-sm" />
                            )}
                            <div>
                              <div className="admin-modern-table-cell-title">{getSafeText(book.title)}</div>
                              <div className="admin-modern-table-cell-subtitle">{getSafeText(book.author)}</div>
                              <div className="text-xs text-gray-500 mt-0.5">ISBN: {book.isbn}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="admin-modern-badge admin-modern-badge-secondary capitalize">
                              {book.category}
                            </span>
                            <span className="text-xs text-gray-500 capitalize flex items-center gap-1">
                              <FiGlobe className="w-3 h-3" /> {book.language}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">${book.price.toFixed(2)}</div>
                            <div className={`flex items-center gap-1 mt-0.5 ${
                              book.stock === 0 ? 'text-red-600 font-medium' : 
                              book.stock <= 10 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              <FiPackage className="w-3 h-3" /> 
                              {book.stock === 0 ? 'Out of Stock' : `${book.stock} in stock`}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleToggleStatus(book._id, book.active)}
                              className={`admin-modern-badge ${book.active ? 'admin-modern-badge-success' : 'admin-modern-badge-danger'} cursor-pointer hover:opacity-80`}
                            >
                              {book.active ? 'Active' : 'Inactive'}
                            </button>
                            {book.featured && (
                              <span className="admin-modern-badge admin-modern-badge-warning flex items-center gap-1">
                                <FiStar className="w-3 h-3 fill-current" /> Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="admin-modern-table-actions">
                            <button 
                              onClick={() => handleToggleFeatured(book._id, book.featured)}
                              className={`admin-modern-btn admin-modern-btn-sm ${book.featured ? 'text-yellow-500' : 'text-gray-400'}`}
                              title={book.featured ? "Remove from Featured" : "Add to Featured"}
                            >
                              <FiStar className={book.featured ? "fill-current" : ""} />
                            </button>
                            <button onClick={() => {
                              setEditingBook(book);
                              setShowModal(true);
                            }} className="admin-modern-btn admin-modern-btn-secondary admin-modern-btn-sm" title="Edit">
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDeleteBook(book._id)} className="admin-modern-btn admin-modern-btn-danger admin-modern-btn-sm" title="Delete">
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
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={10}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.length === 0 ? (
               <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
                 <div className="admin-modern-empty-state">
                   <FiBook />
                   <h3>No books found</h3>
                   <p>Try adjusting your search or filters</p>
                 </div>
               </div>
            ) : (
              books.map((book) => (
                <div key={book._id} className="admin-modern-card group hover:shadow-md transition-shadow">
                  <div className="aspect-[2/3] relative overflow-hidden bg-gray-100 rounded-t-lg">
                    {book.coverPath ? (
                      <img src={book.coverPath} alt={getSafeText(book.title)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiBook className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingBook(book);
                          setShowModal(true);
                        }} 
                        className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:text-primary-600"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        onClick={() => handleDeleteBook(book._id)} 
                        className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    {book.featured && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                        <FiStar className="fill-current w-3 h-3" /> Featured
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1" title={getSafeText(book.title)}>
                        {getSafeText(book.title)}
                      </h3>
                      <span className="font-bold text-primary-600">${book.price.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">{getSafeText(book.author)}</p>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                      <span className="bg-gray-100 px-2 py-1 rounded capitalize">{book.category}</span>
                      <span className={book.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                        {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                       <button 
                         onClick={() => handleToggleStatus(book._id, book.active)}
                         className={`text-xs px-2 py-1 rounded border ${
                           book.active 
                             ? 'border-green-200 text-green-700 bg-green-50' 
                             : 'border-red-200 text-red-700 bg-red-50'
                         }`}
                       >
                         {book.active ? 'Active' : 'Inactive'}
                       </button>
                       <div className="text-xs text-gray-400">
                         {new Date(book.createdAt).toLocaleDateString()}
                       </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {books.length > 0 && viewMode === 'grid' && (
           <div className="mt-6">
             <AdminTablePagination 
               currentPage={currentPage}
               totalPages={totalPages}
               totalItems={totalItems}
               pageSize={10}
               onPageChange={setCurrentPage}
             />
           </div>
        )}

        <BookModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchBooks();
            setShowModal(false);
          }}
          book={editingBook}
          mode={editingBook ? 'edit' : 'create'}
        />
      </div>
    </AdminLayout>
  );
};

export default BooksPage;
