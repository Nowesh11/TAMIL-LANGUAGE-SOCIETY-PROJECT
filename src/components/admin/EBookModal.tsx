import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { 
  FaTimes, 
  FaSave, 
  FaSpinner, 
  FaBook, 
  FaImage, 
  FaCheckSquare, 
  FaFilePdf,
  FaCloudUploadAlt,
  FaLanguage
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

interface EBook {
  _id?: string;
  title: BilingualText;
  author: BilingualText;
  description: BilingualText;
  coverPath: string;
  filePath: string;
  fileFormat: string;
  fileSize: number;
  isbn: string;
  category: string;
  publishedYear: number;
  pages: number;
  language: string;
  featured: boolean;
  active: boolean;
}

interface EBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  ebook?: EBook | null;
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

const EBookModal: React.FC<EBookModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ebook,
  mode
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'settings'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string>('');
  
  const [formData, setFormData] = useState<EBook>({
    title: { en: '', ta: '' },
    author: { en: '', ta: '' },
    description: { en: '', ta: '' },
    coverPath: '',
    filePath: '',
    fileFormat: '',
    fileSize: 0,
    isbn: '',
    category: 'general',
    publishedYear: new Date().getFullYear(),
    pages: 0,
    language: 'tamil',
    featured: false,
    active: true
  });

  useEffect(() => {
    if (ebook && (mode === 'edit' || ebook._id)) {
      setFormData({
        ...ebook,
        title: ebook.title || { en: '', ta: '' },
        author: ebook.author || { en: '', ta: '' },
        description: ebook.description || { en: '', ta: '' },
        category: ebook.category || 'general',
        language: ebook.language || 'tamil'
      });
    } else {
      setFormData({
        title: { en: '', ta: '' },
        author: { en: '', ta: '' },
        description: { en: '', ta: '' },
        coverPath: '',
        filePath: '',
        fileFormat: '',
        fileSize: 0,
        isbn: '',
        category: 'general',
        publishedYear: new Date().getFullYear(),
        pages: 0,
        language: 'tamil',
        featured: false,
        active: true
      });
    }
    setErrors({});
    setActiveTab('details');
  }, [ebook, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.en?.trim()) newErrors['title.en'] = 'English title is required';
    if (!formData.title?.ta?.trim()) newErrors['title.ta'] = 'Tamil title is required';
    if (!formData.author?.en?.trim()) newErrors['author.en'] = 'English author is required';
    if (!formData.author?.ta?.trim()) newErrors['author.ta'] = 'Tamil author is required';
    
    // For create mode, file is required. For edit, it's optional (can keep existing)
    if ((mode === 'create' || !ebook?._id) && !formData.filePath) {
      newErrors['file'] = 'E-Book file is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const actualMode = mode || (ebook?._id ? 'edit' : 'create');
      const url = '/api/admin/ebooks';
      const method = actualMode === 'edit' ? 'PUT' : 'POST';
      
      const payload = actualMode === 'edit' 
        ? { id: ebook?._id, ...formData }
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
      console.error('Error saving ebook:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save ebook' });
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors({ cover: 'Please select a valid image file' });
      return;
    }

    setUploadingCover(true);
    setErrors({ ...errors, cover: '' });

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (ebook?._id) fd.append('ebookId', ebook._id);
      fd.append('type', 'cover');
      
      const res = await fetch('/api/upload/ebooks', { method: 'POST', body: fd });
      const result = await res.json();

      if (result.success) {
        setFormData(prev => ({ ...prev, coverPath: result.url }));
        setCoverPreview(result.url);
      } else {
        setErrors({ cover: result.error || 'Cover upload failed' });
      }
    } catch (error) {
      setErrors({ cover: 'Cover upload failed' });
    } finally {
      setUploadingCover(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setErrors({ ...errors, file: '' });

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (ebook?._id) fd.append('ebookId', ebook._id);
      fd.append('type', 'file');
      
      const res = await fetch('/api/upload/ebooks', { method: 'POST', body: fd });
      const result = await res.json();

      if (result.success) {
        setFormData(prev => ({ 
          ...prev, 
          filePath: result.url,
          fileFormat: (file.type.split('/')[1] || '').toLowerCase(),
          fileSize: file.size
        }));
      } else {
        setErrors({ file: result.error || 'File upload failed' });
      }
    } catch (error) {
      setErrors({ file: 'File upload failed' });
    } finally {
      setUploadingFile(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '900px' }}>
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              {mode === 'create' ? 'Add New E-Book' : 'Edit E-Book'}
            </h2>
            <p className="modal-subtitle">
              Manage e-book details, files, and metadata
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
            <FaImage /> Media & File
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
                <div className="modern-form-section">
                  <h3 className="section-title">Book Information</h3>
                  
                  {/* Title */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Title (English)</label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.en'] ? 'invalid' : ''}`}
                        value={formData.title.en || ''}
                        onChange={(e) => handleInputChange('title.en', e.target.value)}
                        placeholder="E-Book Title"
                      />
                      {errors['title.en'] && <span className="error-message">{errors['title.en']}</span>}
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">Title (Tamil)</label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.ta'] ? 'invalid' : ''}`}
                        value={formData.title.ta || ''}
                        onChange={(e) => handleInputChange('title.ta', e.target.value)}
                        placeholder="மின்னூல் தலைப்பு"
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
                        value={formData.author.en || ''}
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
                        value={formData.author.ta || ''}
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
                        value={formData.description.en || ''}
                        onChange={(e) => handleInputChange('description.en', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">Description (Tamil)</label>
                      <div className="language-tag tamil">TA</div>
                      <textarea
                        className="modern-textarea"
                        value={formData.description.ta || ''}
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
                  <h3 className="section-title">File & Cover</h3>
                  
                  {/* File Upload */}
                  <div className="modern-field-group">
                    <label className="modern-label required">E-Book File (PDF/EPUB)</label>
                    <div className="image-upload-container" style={{ minHeight: '120px' }}>
                      {formData.filePath ? (
                        <div className="file-preview">
                          <div className="file-icon-large">
                            <FaFilePdf />
                          </div>
                          <div className="file-info">
                            <span className="file-name">Current File</span>
                            <span className="file-meta">
                              {formData.fileFormat.toUpperCase()} • {formatFileSize(formData.fileSize)}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, filePath: '', fileFormat: '', fileSize: 0 }));
                            }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ) : (
                        <div className="upload-placeholder">
                          <FaCloudUploadAlt className="upload-icon" />
                          <p>Click to upload e-book file</p>
                        </div>
                      )}
                      <input
                        type="file"
                        className="hidden-file-input"
                        accept=".pdf,.epub,.mobi"
                        onChange={handleFileUpload}
                      />
                    </div>
                    {uploadingFile && <div className="uploading-indicator"><FaSpinner className="spin" /> Uploading file...</div>}
                    {errors.file && <span className="error-message">{errors.file}</span>}
                  </div>

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
                    {uploadingCover && <div className="uploading-indicator"><FaSpinner className="spin" /> Uploading cover...</div>}
                    {errors.cover && <span className="error-message">{errors.cover}</span>}
                  </div>

                  <div className="grid-2-cols">
                    <div className="modern-field-group">
                      <label className="modern-label">ISBN</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.isbn || ''}
                        onChange={(e) => handleInputChange('isbn', e.target.value)}
                        placeholder="ISBN Number"
                      />
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Published Year</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={Number.isFinite(formData.publishedYear) ? formData.publishedYear : new Date().getFullYear()}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleInputChange('publishedYear', val === '' ? new Date().getFullYear() : parseInt(val));
                        }}
                        max={new Date().getFullYear()}
                      />
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">Number of Pages</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={Number.isFinite(formData.pages) ? formData.pages : 0}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleInputChange('pages', val === '' ? 0 : parseInt(val));
                        }}
                        min="0"
                      />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Visibility & Status</h3>
                  
                  <div className="modern-field-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                      />
                      <span className="checkbox-text">
                        <strong>Active Status</strong>
                        <span className="checkbox-desc">E-Book is visible to users</span>
                      </span>
                    </label>
                  </div>

                  <div className="modern-field-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                      />
                      <span className="checkbox-text">
                        <strong>Featured E-Book</strong>
                        <span className="checkbox-desc">Display in featured sections</span>
                      </span>
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
                    <FaSave /> {mode === 'create' ? 'Create E-Book' : 'Save Changes'}
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

export default EBookModal;
