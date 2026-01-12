import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaCog, FaEye, FaPalette, FaCode, FaSearch } from 'react-icons/fa';
import Component, { IComponent } from '../../models/Component';
import DynamicFormFields from './DynamicFormFields';

interface ComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: Partial<IComponent>) => Promise<void>;
  component?: IComponent | null;
  mode: 'create' | 'edit';
}

const ComponentModal: React.FC<ComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  component,
  mode
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'style'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});
  const [currentComponent, setCurrentComponent] = useState<IComponent | null>(null);

  const [formData, setFormData] = useState<Partial<IComponent>>({
    type: undefined,
    page: '',
    bureau: undefined,
    content: {},
    order: 0,
    isActive: true,
    slug: '',
    cssClasses: [],
    customStyles: {},
    visibility: {
      desktop: true,
      tablet: true,
      mobile: true
    },
    animation: {
      type: 'none',
      duration: 300,
      delay: 0
    },
    seo: {
      title: { en: '', ta: '' },
      description: { en: '', ta: '' },
      keywords: []
    }
  });

  // Component type definitions with icons and descriptions
  const componentTypes = [
    {
      type: 'hero',
      label: 'Hero Section',
      description: 'Large banner with title, subtitle, background image, and CTA buttons',
      icon: '🎯'
    },
    {
      type: 'banner',
      label: 'Banner',
      description: 'Promotional banner with text and call-to-action',
      icon: '📢'
    },
    {
      type: 'text',
      label: 'Text Content',
      description: 'Rich text content with formatting options',
      icon: '📝'
    },
    {
      type: 'image',
      label: 'Image',
      description: 'Single image with caption and styling options',
      icon: '🖼️'
    },
    {
      type: 'gallery',
      label: 'Image Gallery',
      description: 'Collection of images in grid, masonry, or carousel layout',
      icon: '🖼️'
    },
    {
      type: 'features',
      label: 'Features',
      description: 'Showcase features with icons, titles, and descriptions',
      icon: '⭐'
    },
    {
      type: 'stats',
      label: 'Statistics',
      description: 'Display numerical statistics with labels',
      icon: '📊'
    },
    {
      type: 'cta',
      label: 'Call to Action',
      description: 'Prominent call-to-action section with buttons',
      icon: '🎯'
    },
    {
      type: 'faq',
      label: 'FAQ',
      description: 'Frequently asked questions with expandable answers',
      icon: '❓'
    },
    {
      type: 'timeline',
      label: 'Timeline',
      description: 'Chronological timeline of events with dates and descriptions',
      icon: '📅'
    },
    {
      type: 'testimonials',
      label: 'Testimonials',
      description: 'Customer testimonials and reviews',
      icon: '💬'
    },
    {
      type: 'contact-form',
      label: 'Contact Form',
      description: 'Contact form with customizable fields',
      icon: '📧'
    },
    {
      type: 'newsletter',
      label: 'Newsletter',
      description: 'Email newsletter signup form',
      icon: '📬'
    },
    {
      type: 'video',
      label: 'Video',
      description: 'Embedded video with controls and thumbnail',
      icon: '🎥'
    },
    {
      type: 'navbar',
      label: 'Navigation Bar',
      description: 'Site navigation with logo, menu items, and mobile support',
      icon: '🧭'
    },
    {
      type: 'footer',
      label: 'Footer',
      description: 'Site footer with links, social media, and newsletter signup',
      icon: '🦶'
    },
    {
      type: 'seo',
      label: 'SEO',
      description: 'Search engine optimization meta tags and settings',
      icon: '🔍'
    },
    {
      type: 'countdown',
      label: 'Countdown',
      description: 'Countdown timer to a specific date and time',
      icon: '⏰'
    }
  ];

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const isValid = value && value.toString().trim() !== '';
    setValidationState(prev => ({
      ...prev,
      [field]: isValid
    }));
    
    if (errors[field] && isValid) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Filter component types based on search
  const filteredComponentTypes = componentTypes.filter(type =>
    type.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (component && mode === 'edit') {
      setCurrentComponent(component);
      setFormData({
        ...component,
        content: component.content || {},
        visibility: component.visibility || {
          desktop: true,
          tablet: true,
          mobile: true
        },
        animation: component.animation || {
          type: 'none',
          duration: 300,
          delay: 0
        },
        seo: component.seo || {
          title: { en: '', ta: '' },
          description: { en: '', ta: '' },
          keywords: []
        }
      });
    } else {
      setCurrentComponent(null);
      setFormData({
        type: undefined,
        page: '',
        bureau: undefined,
        content: {},
        order: 0,
        isActive: true,
        slug: '',
        cssClasses: [],
        customStyles: {},
        visibility: {
          desktop: true,
          tablet: true,
          mobile: true
        },
        animation: {
          type: 'none',
          duration: 300,
          delay: 0
        },
        seo: {
          title: { en: '', ta: '' },
          description: { en: '', ta: '' },
          keywords: []
        }
      });
    }
    setErrors({});
    setActiveTab('content');
    setSearchTerm('');
    setShowPreview(false);
    setValidationState({});
  }, [component, mode, isOpen]);
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const handleFileUpload = async (file: File, fieldName: string, index?: number): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('category', 'components');
    const subCategory = currentComponent?._id || formData.type || 'general';
    uploadFormData.append('subCategory', String(subCategory));
    try {
      const response = await fetch('/api/upload/media', { method: 'POST', body: uploadFormData });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      return data.url || (data.filePath ? `/api/files/serve?path=${encodeURIComponent(data.filePath)}` : '');
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.type) {
      newErrors.type = 'Component type is required';
    }
    
    if (!formData.page) {
      newErrors.page = 'Page is required';
    }
    
    if (!formData.bureau) {
      newErrors.bureau = 'Bureau is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Clean up empty SEO fields before saving
      const cleanedFormData = { ...formData };
      if (cleanedFormData.seo) {
        const seo = cleanedFormData.seo;
        
        // Remove empty title fields
        if (seo.title && (!seo.title.en?.trim() && !seo.title.ta?.trim())) {
          delete seo.title;
        }
        
        // Remove empty description fields
        if (seo.description && (!seo.description.en?.trim() && !seo.description.ta?.trim())) {
          delete seo.description;
        }
        
        // Remove empty keywords
        if (seo.keywords && (!seo.keywords.length || seo.keywords.every(k => !k.trim()))) {
          delete seo.keywords;
        }
        
        // If SEO object is empty, remove it entirely
        if (!seo.title && !seo.description && !seo.keywords) {
          delete cleanedFormData.seo;
        }
      }
      
      await onSave(cleanedFormData);
      
      // Update currentComponent after successful save
      if (component) {
        // If editing existing component, update currentComponent with new data
        setCurrentComponent({ ...component, ...cleanedFormData } as any);
      } else {
        // If creating new component, use the cleaned form data
        setCurrentComponent(cleanedFormData as any);
      }
      
      onClose();
    } catch (error) {
      setErrors({ general: 'An error occurred while saving the component.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Real-time validation for required fields
    if (['type', 'page', 'bureau'].includes(field)) {
      validateField(field, value);
    }
  };

  const updateSEO = (field: string, lang: 'en' | 'ta', value: string) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        [field]: {
          ...(prev.seo as any)?.[field],
          [lang]: value
        }
      }
    }));
  };

  const updateVisibility = (device: 'desktop' | 'tablet' | 'mobile', visible: boolean) => {
    setFormData(prev => ({
      ...prev,
      visibility: {
        desktop: true,
        tablet: true,
        mobile: true,
        ...prev.visibility,
        [device]: visible
      }
    }));
  };

  const updateAnimation = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      animation: {
        type: 'none',
        duration: 300,
        delay: 0,
        ...prev.animation,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay" onClick={handleOverlayClick}>
      <div className="component-modal-container modern-modal-container">
        <form onSubmit={handleSubmit} className="modern-modal-form">
          {/* Header */}
          <div className="modern-modal-header">
            <div className="modal-title-section">
              <h2 className="modern-modal-title">
                {mode === 'create' ? 'Create New Component' : 'Edit Component'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'create' 
                  ? 'Design and configure a new page component' 
                  : `Editing ${formData.type} component`
                }
              </p>
            </div>
            <button
              type="button"
              className="modern-close-button"
              onClick={handleClose}
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>

          {/* Tabs */}
          <div className="modern-modal-tabs">
            <button
              type="button"
              className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <FaCode />
              Content
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <FaCog />
              Settings
            </button>
            <button
              type="button"
              className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
              onClick={() => setActiveTab('style')}
            >
              <FaPalette />
              Style & SEO
            </button>
          </div>

          {/* Modal Body */}
          <div className="modern-modal-body">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="tab-content">
                {/* Component Type Selection */}
                {mode === 'create' && (
                  <div className="modern-field-group">
                    <label className="modern-label required">
                      Component Type
                      <span className={`field-status ${validationState.type ? 'valid' : 'invalid'}`}>
                      {validationState.type ? '✓' : '*'}
                    </span>
                    </label>
                    
                    {/* Search Bar */}
                    <div className="search-container">
                      <FaSearch className="search-icon" />
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search component types..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="component-type-grid">
                      {filteredComponentTypes.length > 0 ? (
                        filteredComponentTypes.map((type) => (
                          <div
                            key={type.type}
                            className={`component-type-card ${formData.type === type.type ? 'selected' : ''}`}
                            onClick={() => updateFormData('type', type.type)}
                          >
                            <div className="type-icon">{type.icon}</div>
                            <div className="type-info">
                              <h4 className="type-label">{type.label}</h4>
                              <p className="type-description">{type.description}</p>
                            </div>
                            {formData.type === type.type && (
                              <div className="selected-indicator">
                                <FaEye />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-results">
                          <p>No component types found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </div>
                    {errors.type && <div className="error-message">{errors.type}</div>}
                  </div>
                )}

                {/* Component Type Display for Edit Mode */}
                {mode === 'edit' && formData.type && (
                  <div className="modern-field-group">
                    <label className="modern-label">Component Type</label>
                    <div className="component-type-display">
                      {(() => {
                        const typeInfo = componentTypes.find(t => t.type === formData.type);
                        return typeInfo ? (
                          <div className="component-type-card selected readonly">
                            <div className="type-icon">{typeInfo.icon}</div>
                            <div className="type-info">
                              <h4 className="type-label">{typeInfo.label}</h4>
                              <p className="type-description">{typeInfo.description}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="component-type-card readonly">
                            <div className="type-icon">🔧</div>
                            <div className="type-info">
                              <h4 className="type-label">{formData.type}</h4>
                              <p className="type-description">Custom component type</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="section-title">Basic Information</h3>
                  
                  <div className="modern-field-group">
                    <label className="modern-label required">
                      Page
                      <span className={`field-status ${validationState.page ? 'valid' : 'invalid'}`}>
                        {validationState.page ? '✓' : '*'}
                      </span>
                    </label>
                    <select
                      className={`modern-select ${validationState.page ? 'valid' : ''} ${errors.page ? 'invalid' : ''}`}
                      value={formData.page || ''}
                      onChange={(e) => updateFormData('page', e.target.value)}
                      required
                    >
                      <option value="">Select a page</option>
                      <option value="home">Home</option>
                      <option value="about">About</option>
                      <option value="projects">Projects</option>
                      <option value="ebooks">Ebooks</option>
                      <option value="books">Books</option>
                      <option value="contacts">Contacts</option>
                      <option value="notifications">Notifications</option>
                      <option value="login">Login</option>
                      <option value="signup">Sign Up</option>
                    </select>
                    {errors.page && <div className="error-message">{errors.page}</div>}
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label required">
                      Bureau
                      <span className={`field-status ${validationState.bureau ? 'valid' : 'invalid'}`}>
                        {validationState.bureau ? '✓' : '*'}
                      </span>
                    </label>
                    <select
                      className={`modern-select ${validationState.bureau ? 'valid' : ''} ${errors.bureau ? 'invalid' : ''}`}
                      value={formData.bureau || ''}
                      onChange={(e) => updateFormData('bureau', e.target.value)}
                      required
                    >
                      <option value="">Select a bureau</option>
                      <option value="sports_leadership">Sports & Leadership</option>
                      <option value="education_intellectual">Education & Intellectual</option>
                      <option value="arts_culture">Arts & Culture</option>
                      <option value="social_welfare_voluntary">Social Welfare & Voluntary</option>
                      <option value="language_literature">Language & Literature</option>
                    </select>
                    {errors.bureau && <div className="error-message">{errors.bureau}</div>}
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label optional">
                      Display Order
                      <span className="field-hint">Controls the order components appear on the page</span>
                    </label>
                    <input
                      type="number"
                      className="modern-input"
                      value={formData.order || 0}
                      onChange={(e) => updateFormData('order', parseInt(e.target.value))}
                      min="0"
                      placeholder="Component display order"
                    />
                  </div>
                </div>

                {/* Dynamic Content Fields */}
                {formData.type && (
                  <DynamicFormFields
                    componentType={formData.type}
                    formData={formData}
                    setFormData={setFormData}
                    onFileUpload={handleFileUpload}
                  />
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="modern-field-group">
                  <label className="modern-label">Component Slug</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={formData.slug || ''}
                    onChange={(e) => updateFormData('slug', e.target.value)}
                    placeholder="unique-component-identifier"
                  />
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">Active Status</label>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.isActive || false}
                      onChange={(e) => updateFormData('isActive', e.target.checked)}
                    />
                    <span className="toggle-label">Component is active and visible</span>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">Device Visibility</label>
                  <div className="visibility-controls">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visibility?.desktop || true}
                        onChange={(e) => updateVisibility('desktop', e.target.checked)}
                      />
                      <FaEye /> Desktop
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visibility?.tablet || true}
                        onChange={(e) => updateVisibility('tablet', e.target.checked)}
                      />
                      <FaEye /> Tablet
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.visibility?.mobile || true}
                        onChange={(e) => updateVisibility('mobile', e.target.checked)}
                      />
                      <FaEye /> Mobile
                    </label>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">Animation</label>
                  <select
                    className="modern-select"
                    value={formData.animation?.type || 'none'}
                    onChange={(e) => updateAnimation('type', e.target.value)}
                  >
                    <option value="none">No Animation</option>
                    <option value="fadeIn">Fade In</option>
                    <option value="slideUp">Slide Up</option>
                    <option value="slideDown">Slide Down</option>
                    <option value="slideLeft">Slide Left</option>
                    <option value="slideRight">Slide Right</option>
                    <option value="zoomIn">Zoom In</option>
                    <option value="bounce">Bounce</option>
                  </select>
                </div>

                {formData.animation?.type !== 'none' && (
                  <>
                    <div className="modern-field-group">
                      <label className="modern-label">Animation Duration (ms)</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={formData.animation?.duration || 300}
                        onChange={(e) => updateAnimation('duration', parseInt(e.target.value))}
                        min="100"
                        max="3000"
                        step="100"
                      />
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label">Animation Delay (ms)</label>
                      <input
                        type="number"
                        className="modern-input"
                        value={formData.animation?.delay || 0}
                        onChange={(e) => updateAnimation('delay', parseInt(e.target.value))}
                        min="0"
                        max="2000"
                        step="100"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Style & SEO Tab */}
            {activeTab === 'style' && (
              <div className="tab-content">
                <div className="modern-field-group">
                  <label className="modern-label">CSS Classes</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={formData.cssClasses || ''}
                    onChange={(e) => updateFormData('cssClasses', e.target.value)}
                    placeholder="custom-class another-class"
                  />
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">Custom Styles</label>
                  <textarea
                    className="modern-textarea"
                    value={typeof formData.customStyles === 'object' ? JSON.stringify(formData.customStyles, null, 2) : (formData.customStyles || '')}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateFormData('customStyles', parsed);
                      } catch {
                        updateFormData('customStyles', e.target.value);
                      }
                    }}
                    placeholder='{"backgroundColor": "#f0f0f0", "padding": "20px"}'
                    rows={4}
                  />
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">SEO Title</label>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.seo?.title?.en || ''}
                        onChange={(e) => updateSEO('title', 'en', e.target.value)}
                        placeholder="SEO title in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.seo?.title?.ta || ''}
                        onChange={(e) => updateSEO('title', 'ta', e.target.value)}
                        placeholder="SEO title in Tamil"
                      />
                    </div>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">SEO Description</label>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <textarea
                        className="modern-textarea"
                        value={formData.seo?.description?.en || ''}
                        onChange={(e) => updateSEO('description', 'en', e.target.value)}
                        placeholder="SEO description in English"
                        rows={3}
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <textarea
                        className="modern-textarea"
                        value={formData.seo?.description?.ta || ''}
                        onChange={(e) => updateSEO('description', 'ta', e.target.value)}
                        placeholder="SEO description in Tamil"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="modern-field-group">
                  <label className="modern-label">SEO Keywords</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={formData.seo?.keywords?.join(', ') || ''}
                    onChange={(e) => updateFormData('seo', {
                      ...formData.seo,
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    })}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
              </div>
            )}

            {/* Error Messages */}
            {errors.general && (
              <div className="error-message">
                <FaExclamationTriangle />
                {errors.general}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modern-modal-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={isLoading || !formData.type}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  {mode === 'create' ? 'Create Component' : 'Update Component'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentModal;
