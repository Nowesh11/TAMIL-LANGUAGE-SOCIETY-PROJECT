import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { 
  FaTimes, 
  FaSave, 
  FaSpinner, 
  FaBook, 
  FaImage, 
  FaMoneyBillWave, 
  FaCheckSquare
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import MediaUploader from './MediaUploader';

interface BilingualText {
  en: string;
  ta: string;
}

interface Book {
  _id?: string;
  title: BilingualText;
  author: BilingualText;
  description: BilingualText;
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
}

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  book?: Book | null;
  mode?: 'create' | 'edit';
}

const categories = [
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
  { value: 'tamil', label: 'Tamil' },
  { value: 'english', label: 'English' },
  { value: 'bilingual', label: 'Bilingual' }
];

const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  book,
  mode
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'settings'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coverPreview, setCoverPreview] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const [formData, setFormData] = useState<Book>({
    title: { en: '', ta: '' },
    author: { en: '', ta: '' },
    description: { en: '', ta: '' },
    price: 0,
    stock: 0,
    coverPath: '',
    isbn: '',
    category: 'general',
    publishedYear: new Date().getFullYear(),
    pages: 0,
    language: 'tamil',
    featured: false,
    active: true
  });

  useEffect(() => {
    if (book && (mode === 'edit' || book._id)) {
      setFormData({
        ...book,
        title: book.title || { en: '', ta: '' },
        author: book.author || { en: '', ta: '' },
        description: book.description || { en: '', ta: '' },
        category: book.category || 'general',
        language: book.language || 'tamil'
      });
      setCoverPreview(book.coverPath || '');
    } else {
      setFormData({
        title: { en: '', ta: '' },
        author: { en: '', ta: '' },
        description: { en: '', ta: '' },
        price: 0,
        stock: 0,
        coverPath: '',
        isbn: '',
        category: 'general',
        publishedYear: new Date().getFullYear(),
        pages: 0,
        language: 'tamil',
        featured: false,
        active: true
      });
      setCoverPreview('');
    }
    setErrors({});
    setActiveTab('details');
    setUploadingCover(false);
  }, [book, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setCoverPreview(objectUrl);
    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch('/api/upload/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, coverPath: data.imagePath }));
      } else {
        console.error('Upload failed:', data.error);
        // Revert preview on failure? Or keep it?
        // Keep it but maybe show error.
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
    } finally {
      setUploadingCover(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.en?.trim()) newErrors['title.en'] = 'English title is required';
    if (!formData.title?.ta?.trim()) newErrors['title.ta'] = 'Tamil title is required';
    if (!formData.author?.en?.trim()) newErrors['author.en'] = 'English author is required';
    if (!formData.author?.ta?.trim()) newErrors['author.ta'] = 'Tamil author is required';
    if (formData.price < 0) newErrors['price'] = 'Price cannot be negative';
    if (formData.stock < 0) newErrors['stock'] = 'Stock cannot be negative';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const actualMode = mode || (book?._id ? 'edit' : 'create');
      const url = '/api/admin/books';
      const method = actualMode === 'edit' ? 'PUT' : 'POST';
      
      const payload = actualMode === 'edit' 
        ? { id: book?._id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save book' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        (newData as any)[parent] = { ...(newData as any)[parent], [child]: value };
      } else {
        (newData as any)[field] = value;
      }
      return newData;
    });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '900px' }}>
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              {mode === 'create' ? 'Add New Book' : 'Edit Book'}
            </h2>
            <p className="modal-subtitle">
              Manage book details, pricing, and inventory
            </p>
          </div>
          <button onClick={onClose} className="modern-close-button" disabled={isLoading}>
            <FaTimes />
          </button>
        </div>

        <div className="modern-modal-tabs">
          <button
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FaBook /> Details
          </button>
          <button
            className={`tab-button ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <FaImage /> Media & Stock
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCheckSquare /> Settings
          </button>
        </div>

        <form className="modern-modal-form" onSubmit={handleSubmit}>
          <div className="modern-modal-body">
            {activeTab === 'details' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Book Information</h3>
                  
                  {/* Title */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Title (English)</label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.en'] ? 'invalid' : ''}`}
                        value={formData.title.en}
                        onChange={(e) => handleInputChange('title.en', e.target.value)}
                        placeholder="Book Title"
                      />
                      {errors['title.en'] && <span className="error-message">{errors['title.en']}</span>}
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Title (Tamil)</label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.ta'] ? 'invalid' : ''}`}
                        value={formData.title.ta}
                        onChange={(e) => handleInputChange('title.ta', e.target.value)}
                        placeholder="புத்தக தலைப்பு"
                      />
                      {errors['title.ta'] && <span className="error-message">{errors['title.ta']}</span>}
                    </div>
                  </div>

                  {/* Author */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Author (English)</label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['author.en'] ? 'invalid' : ''}`}
                        value={formData.author.en}
                        onChange={(e) => handleInputChange('author.en', e.target.value)}
                        placeholder="Author Name"
                      />
                      {errors['author.en'] && <span className="error-message">{errors['author.en']}</span>}
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Author (Tamil)</label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['author.ta'] ? 'invalid' : ''}`}
                        value={formData.author.ta}
                        onChange={(e) => handleInputChange('author.ta', e.target.value)}
                        placeholder="ஆசிரியர் பெயர்"
                      />
                      {errors['author.ta'] && <span className="error-message">{errors['author.ta']}</span>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">Description (English)</label>
                      <div className="language-tag">EN</div>
                      <textarea
                        className="modern-textarea"
                        value={formData.description.en}
                        onChange={(e) => handleInputChange('description.en', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">Description (Tamil)</label>
                      <div className="language-tag tamil">TA</div>
                      <textarea
                        className="modern-textarea"
                        value={formData.description.ta}
                        onChange={(e) => handleInputChange('description.ta', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid-2-cols">
                    <div className="modern-field-group">
                      <label className="modern-label">Category</label>
                      <select
                        className="modern-select"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Language</label>
                      <select
                        className="modern-select"
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                      >
                        {languages.map(lang => (
                          <option key={lang.value} value={lang.value}>{lang.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Cover Image & Inventory</h3>
                  
                  <div className="modern-field-group">
                    <label className="modern-label">Cover Image</label>
                    <div className="image-upload-container">
                      {coverPreview ? (
                        <div className="image-preview">
                          <img src={coverPreview} alt="Cover Preview" />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, coverPath: '' }));
                              setCoverPreview('');
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <FaImage className="upload-icon" />
                          <p>Click or drag to upload cover image</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden-file-input"
                        accept="image/*"
                        onChange={handleCoverUpload}
                      />
                    </div>
                    {uploadingCover && <div className="uploading-indicator"><FaSpinner className="spin" /> Uploading...</div>}
                    {errors.cover && <span className="error-message">{errors.cover}</span>}
                  </div>

                  <div className="grid-2-cols">
                    <div className="modern-field-group">
                      <label className="modern-label required">Price</label>
                      <div className="input-with-icon">
                        <FaMoneyBillWave className="input-icon" />
                        <input
                          type="number"
                          className="modern-input pl-10"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {errors.price && <span className="error-message">{errors.price}</span>}
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label required">Stock Quantity</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={formData.stock}
                        onChange={(e) => handleInputChange('stock', parseInt(e.target.value))}
                        min="0"
                      />
                      {errors.stock && <span className="error-message">{errors.stock}</span>}
                    </div>
                  </div>

                  <div className="grid-2-cols">
                    <div className="modern-field-group">
                      <label className="modern-label">ISBN</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.isbn}
                        onChange={(e) => handleInputChange('isbn', e.target.value)}
                        placeholder="ISBN Number"
                      />
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Published Year</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={formData.publishedYear}
                        onChange={(e) => handleInputChange('publishedYear', parseInt(e.target.value))}
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">Number of Pages</label>
                    <input
                      type="number"
                      className="modern-input"
                      value={formData.pages}
                      onChange={(e) => handleInputChange('pages', parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">Visibility & Status</h3>
                  
                  <div className="modern-field-group modern-checkbox-group">
                    <label className="modern-checkbox-label">
                      <input
                        type="checkbox"
                        className="modern-checkbox"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                      />
                      <span className="checkbox-text">Active Status</span>
                      <span className="checkbox-description">Book is visible to users</span>
                    </label>
                  </div>

                  <div className="modern-field-group modern-checkbox-group">
                    <label className="modern-checkbox-label">
                      <input
                        type="checkbox"
                        className="modern-checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                      />
                      <span className="checkbox-text">Featured Book</span>
                      <span className="checkbox-description">Display in featured sections</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modern-modal-footer">
            <div className="modal-footer-right">
              <button
                type="button"
                onClick={onClose}
                className="modern-btn modern-btn-secondary"
                disabled={isLoading}
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                className="modern-btn modern-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave /> {mode === 'create' ? 'Add Book' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookModal;
