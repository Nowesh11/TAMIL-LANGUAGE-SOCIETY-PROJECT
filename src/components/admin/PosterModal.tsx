import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaCog, FaEye, FaPalette, FaCode, FaSearch, FaImage, FaUpload, FaTrash } from 'react-icons/fa';
import MediaUploader from './MediaUploader';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

interface Poster {
  _id?: string;
  title: BilingualText;
  description: BilingualText;
  category: string;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  imagePath?: string;
  imageUrl?: string;
  eventDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (poster: Partial<Poster>) => Promise<void>;
  onSuccess?: () => void;
  poster?: Poster | null;
  mode?: 'create' | 'edit';
}

const PosterModal: React.FC<PosterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  poster,
  mode
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'media'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPoster, setCurrentPoster] = useState<Poster | null>(null);

  const [formData, setFormData] = useState<Partial<Poster>>({
    title: { en: '', ta: '' },
    description: { en: '', ta: '' },
    category: '',
    isActive: true,
    isFeatured: false,
    order: 0,
    imagePath: '',
    eventDate: ''
  });

  // Poster categories
  const posterCategories = [
    { value: 'event', label: 'Event' },
    { value: 'announcement', label: 'Announcement' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'educational', label: 'Educational' },
    { value: 'sports', label: 'Sports' },
    { value: 'social', label: 'Social' },
    { value: 'promotional', label: 'Promotional' },
    { value: 'news', label: 'News' }
  ];

  // Initialize form data when poster changes
  useEffect(() => {
    if (poster && (mode === 'edit' || poster._id)) {
      setCurrentPoster(poster);
      setFormData({
        title: poster.title || { en: '', ta: '' },
        description: poster.description || { en: '', ta: '' },
        category: poster.category || '',
        isActive: poster.isActive ?? true,
        isFeatured: poster.isFeatured ?? false,
        order: poster.order || 0,
        imagePath: poster.imagePath || '',
        eventDate: poster.eventDate || ''
      });
    } else {
      setCurrentPoster(null);
      setFormData({
        title: { en: '', ta: '' },
        description: { en: '', ta: '' },
        category: '',
        isActive: true,
        isFeatured: false,
        order: 0,
        imagePath: '',
        eventDate: ''
      });
    }
    setErrors({});
    setValidationState({});
  }, [poster, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newValidationState: Record<string, boolean> = {};

    // Title validation
    if (!formData.title?.en?.trim()) {
      newErrors['title.en'] = 'English title is required';
      newValidationState['title.en'] = false;
    } else if (formData.title.en.trim().length < 3) {
      newErrors['title.en'] = 'English title must be at least 3 characters';
      newValidationState['title.en'] = false;
    } else if (formData.title.en.trim().length > 200) {
      newErrors['title.en'] = 'English title cannot exceed 200 characters';
      newValidationState['title.en'] = false;
    } else {
      newValidationState['title.en'] = true;
    }

    if (!formData.title?.ta?.trim()) {
      newErrors['title.ta'] = 'Tamil title is required';
      newValidationState['title.ta'] = false;
    } else if (formData.title.ta.trim().length < 3) {
      newErrors['title.ta'] = 'Tamil title must be at least 3 characters';
      newValidationState['title.ta'] = false;
    } else if (formData.title.ta.trim().length > 200) {
      newErrors['title.ta'] = 'Tamil title cannot exceed 200 characters';
      newValidationState['title.ta'] = false;
    } else {
      newValidationState['title.ta'] = true;
    }

    // Description validation
    if (!formData.description?.en?.trim()) {
      newErrors['description.en'] = 'English description is required';
      newValidationState['description.en'] = false;
    } else if (formData.description.en.trim().length < 10) {
      newErrors['description.en'] = 'English description must be at least 10 characters';
      newValidationState['description.en'] = false;
    } else if (formData.description.en.trim().length > 1000) {
      newErrors['description.en'] = 'English description cannot exceed 1000 characters';
      newValidationState['description.en'] = false;
    } else {
      newValidationState['description.en'] = true;
    }

    if (!formData.description?.ta?.trim()) {
      newErrors['description.ta'] = 'Tamil description is required';
      newValidationState['description.ta'] = false;
    } else if (formData.description.ta.trim().length < 10) {
      newErrors['description.ta'] = 'Tamil description must be at least 10 characters';
      newValidationState['description.ta'] = false;
    } else if (formData.description.ta.trim().length > 1000) {
      newErrors['description.ta'] = 'Tamil description cannot exceed 1000 characters';
      newValidationState['description.ta'] = false;
    } else {
      newValidationState['description.ta'] = true;
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
      newValidationState.category = false;
    } else if (!posterCategories.some(cat => cat.value === formData.category)) {
      newErrors.category = 'Please select a valid category';
      newValidationState.category = false;
    } else {
      newValidationState.category = true;
    }

    // Order validation
    if (formData.order === undefined || formData.order < 0) {
      newErrors.order = 'Order must be a non-negative number';
      newValidationState.order = false;
    } else if (formData.order > 9999) {
      newErrors.order = 'Order cannot exceed 9999';
      newValidationState.order = false;
    } else {
      newValidationState.order = true;
    }

    // Event date validation (if provided)
    if (formData.eventDate) {
      const eventDate = new Date(formData.eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(eventDate.getTime())) {
        newErrors.eventDate = 'Please enter a valid date';
        newValidationState.eventDate = false;
      } else if (eventDate < today) {
        newErrors.eventDate = 'Event date cannot be in the past';
        newValidationState.eventDate = false;
      } else {
        newValidationState.eventDate = true;
      }
    } else {
      newValidationState.eventDate = true;
    }

    // Image validation (for create mode)
    if (mode === 'create' && !formData.imagePath) {
      newErrors.image = 'Poster image is required';
      newValidationState.image = false;
    } else {
      newValidationState.image = true;
    }

    setErrors(newErrors);
    setValidationState(newValidationState);

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (onSave) {
        // Use the onSave callback if provided
        await onSave(formData);
      } else if (onSuccess) {
        // Use the onSuccess pattern with direct API calls
        const actualMode = mode || (poster?._id ? 'edit' : 'create');
        const url = actualMode === 'edit' ? '/api/admin/posters' : '/api/admin/posters';
        const method = actualMode === 'edit' ? 'PUT' : 'POST';
        
        const payload = actualMode === 'edit' 
          ? { _id: poster?._id, ...formData }
          : formData;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, {
          method,
          headers,
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          const errorMessage = result.error || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        // Update currentPoster with the result for image preview
        if (result.data && result.data._id) {
          setCurrentPoster(result.data);
        }

        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Error saving poster:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save poster. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete poster
  const handleDelete = async () => {
    if (!poster?._id) return;

    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      const response = await fetch(`/api/admin/posters?id=${encodeURIComponent(poster._id)}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else if (onSave) {
          onSave(result.poster);
        }
        onClose();
      } else {
        setErrors({ submit: result.error || 'Failed to delete poster' });
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to delete poster' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ image: 'Please select a valid image file' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: 'Image size must be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setErrors({ ...errors, image: '' });

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      // Pass poster ID if editing existing poster
      if (currentPoster?._id) {
        formDataUpload.append('posterId', currentPoster._id);
      }

      const uploadHeaders: Record<string, string> = {};
      if (accessToken) {
        uploadHeaders['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/upload/poster', {
        method: 'POST',
        headers: uploadHeaders,
        body: formDataUpload,
      });

      const result = await response.json();

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          imagePath: result.imagePath
        }));
      } else {
        setErrors({ image: result.error || 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ image: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newData[parent as keyof Poster] = {
          ...(newData[parent as keyof Poster] as any),
          [child]: value
        };
      } else {
        (newData as any)[field] = value;
      }
      
      return newData;
    });

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay" style={{ zIndex: 1000 }}>
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '900px', backgroundColor: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)' }}>
        {/* Modal Header */}
        <div className="modern-modal-header" style={{ borderBottomColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="modal-title-section">
            <h2 className="modern-modal-title" style={{ color: 'var(--foreground)' }}>
              {mode === 'create' ? 'Create New Poster' : 'Edit Poster'}
            </h2>
            <p className="modal-subtitle" style={{ color: 'var(--foreground-muted)' }}>
              {mode === 'create' 
                ? 'Add a new poster to showcase events and announcements'
                : 'Update poster information and settings'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="modern-close-button"
            disabled={isLoading}
            style={{ color: 'var(--foreground-muted)' }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modern-modal-tabs" style={{ borderBottomColor: 'var(--border)' }}>
          <button
            className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
            style={{ color: activeTab === 'content' ? 'var(--primary)' : 'var(--foreground-muted)', borderBottomColor: activeTab === 'content' ? 'var(--primary)' : 'transparent' }}
          >
            <FaCode />
            Content
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            style={{ color: activeTab === 'settings' ? 'var(--primary)' : 'var(--foreground-muted)', borderBottomColor: activeTab === 'settings' ? 'var(--primary)' : 'transparent' }}
          >
            <FaCog />
            Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
            style={{ color: activeTab === 'media' ? 'var(--primary)' : 'var(--foreground-muted)', borderBottomColor: activeTab === 'media' ? 'var(--primary)' : 'transparent' }}
          >
            <FaImage />
            Media
          </button>
        </div>

        {/* Modal Body */}
        <form className="modern-modal-form" onSubmit={handleSubmit}>
          <div className="modern-modal-body" style={{ backgroundColor: 'var(--background-secondary)' }}>
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="tab-content">
                <div className="form-section" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h3 className="section-title" style={{ color: 'var(--foreground-secondary)' }}>Poster Content</h3>
                  
                  {/* Title Fields */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                        Title (English)
                        <span className={`field-status ${validationState['title.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['title.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag" style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.en'] ? 'invalid' : validationState['title.en'] ? 'valid' : ''}`}
                        value={formData.title?.en || ''}
                        onChange={(e) => handleInputChange('title.en', e.target.value)}
                        placeholder="Enter poster title in English"
                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                      />
                      {errors['title.en'] && <span className="error-message">{errors['title.en']}</span>}
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                        Title (Tamil)
                        <span className={`field-status ${validationState['title.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['title.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil" style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.ta'] ? 'invalid' : validationState['title.ta'] ? 'valid' : ''}`}
                        value={formData.title?.ta || ''}
                        onChange={(e) => handleInputChange('title.ta', e.target.value)}
                        placeholder="தமிழில் போஸ்டர் தலைப்பை உள்ளிடவும்"
                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                      />
                      {errors['title.ta'] && <span className="error-message">{errors['title.ta']}</span>}
                    </div>
                  </div>

                  {/* Description Fields */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                        Description (English)
                        <span className={`field-status ${validationState['description.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['description.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag" style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>EN</div>
                      <textarea
                        className={`modern-textarea ${errors['description.en'] ? 'invalid' : validationState['description.en'] ? 'valid' : ''}`}
                        value={formData.description?.en || ''}
                        onChange={(e) => handleInputChange('description.en', e.target.value)}
                        placeholder="Enter poster description in English"
                        rows={4}
                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                      />
                      {errors['description.en'] && <span className="error-message">{errors['description.en']}</span>}
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                        Description (Tamil)
                        <span className={`field-status ${validationState['description.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['description.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil" style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>TA</div>
                      <textarea
                        className={`modern-textarea ${errors['description.ta'] ? 'invalid' : validationState['description.ta'] ? 'valid' : ''}`}
                        value={formData.description?.ta || ''}
                        onChange={(e) => handleInputChange('description.ta', e.target.value)}
                        placeholder="தமிழில் போஸ்டர் விளக்கத்தை உள்ளிடவும்"
                        rows={4}
                        style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                      />
                      {errors['description.ta'] && <span className="error-message">{errors['description.ta']}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="modern-form-section" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h3 className="section-title" style={{ color: 'var(--foreground-secondary)' }}>Poster Settings</h3>
                  
                  <div className="modern-field-group">
                    <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                      Category
                      <span className={`field-status ${validationState.category ? 'valid' : 'invalid'}`}>
                        {validationState.category ? '✓' : '*'}
                      </span>
                    </label>
                    <select
                      className={`modern-select ${errors.category ? 'invalid' : validationState.category ? 'valid' : ''}`}
                      value={formData.category || ''}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                    >
                      <option value="">Select a category</option>
                      {posterCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    {errors.category && <span className="error-message">{errors.category}</span>}
                  </div>
                  
                  <div className="modern-field-group">
                    <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>
                      Display Order
                      <span className={`field-status ${validationState.order ? 'valid' : 'invalid'}`}>
                        {validationState.order ? '✓' : '*'}
                      </span>
                    </label>
                    <input
                      type="number"
                      className={`modern-input ${errors.order ? 'invalid' : validationState.order ? 'valid' : ''}`}
                      value={formData.order || 0}
                      onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="Display order (0 = first)"
                      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                    />
                    {errors.order && <span className="error-message">{errors.order}</span>}
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label" style={{ color: 'var(--foreground-muted)' }}>
                      Event Date
                      <span className={`field-status ${validationState.eventDate ? 'valid' : 'invalid'}`}>
                        {validationState.eventDate ? '✓' : ''}
                      </span>
                    </label>
                    <input
                      type="date"
                      className={`modern-input ${errors.eventDate ? 'invalid' : validationState.eventDate ? 'valid' : ''}`}
                      value={formData.eventDate || ''}
                      onChange={(e) => handleInputChange('eventDate', e.target.value)}
                      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border-light)' }}
                    />
                    {errors.eventDate && <span className="error-message">{errors.eventDate}</span>}
                  </div>

                  <div className="modern-field-group">
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.isActive ?? true}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                        <span className="checkbox-text" style={{ color: 'var(--foreground-muted)' }}>Active</span>
                        <span className="checkbox-description" style={{ color: 'var(--foreground-muted)' }}>Poster is visible to users</span>
                      </label>
                    </div>
                  </div>
                    
                  <div className="modern-field-group">
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.isFeatured ?? false}
                          onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                        />
                        <span className="checkbox-text" style={{ color: 'var(--foreground-muted)' }}>Featured</span>
                        <span className="checkbox-description" style={{ color: 'var(--foreground-muted)' }}>Highlight this poster</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="tab-content">
                <div className="modern-form-section" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h3 className="section-title" style={{ color: 'var(--foreground-secondary)' }}>Poster Image</h3>
                  <MediaUploader
                    category="posters"
                    subCategory="images"
                    accept="image/*"
                    previewType="image"
                    onUploaded={(r) => {
                      const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                      handleInputChange('imagePath', url);
                    }}
                  />
                </div>
              </div>
            )}

          </div>
        </form>

        {/* Modal Footer */}
        <div className="modern-modal-footer" style={{ borderTopColor: 'var(--border)' }}>
          <div className="modal-footer-left">
            {errors.submit && (
              <div className="modal-error">
                <FaExclamationTriangle /> {errors.submit}
              </div>
            )}
            {(mode || (poster?._id ? 'edit' : 'create')) === 'edit' && poster?._id && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this poster?')) {
                    handleDelete();
                  }
                }}
                className="modern-btn modern-btn-danger"
                disabled={isLoading}
              >
                <FaTrash />
                Delete
              </button>
            )}
          </div>
          <div className="modal-footer-right">
            <button
              type="button"
              onClick={onClose}
              className="modern-btn modern-btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="modern-btn modern-btn-primary"
              disabled={isLoading || uploadingImage}
            >
              {isLoading ? (
                <>
                  <FaSpinner className="spinner" />
                  {(mode || (poster?._id ? 'edit' : 'create')) === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <FaSave />
                  {(mode || (poster?._id ? 'edit' : 'create')) === 'create' ? 'Create Poster' : 'Update Poster'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosterModal;
