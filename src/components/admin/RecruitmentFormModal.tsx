import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/admin/modals.css';
import { 
  FaTimes, 
  FaSave, 
  FaSpinner, 
  FaCog, 
  FaCode, 
  FaList, 
  FaPlus, 
  FaTrash, 
  FaArrowUp, 
  FaArrowDown, 
  FaCheckSquare, 
  FaImage,
} from 'react-icons/fa';
import MediaUploader from './MediaUploader';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'number' | 'file' | 'time' | 'scale' | 'grid_radio' | 'grid_checkbox';
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
  _id?: string;
  title: BilingualText;
  description: BilingualText;
  role: 'crew' | 'participants' | 'volunteer';
  projectItemId?: string;
  fields: FormField[];
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  maxResponses?: number;
  image?: string;
  emailNotification?: boolean;
}

interface RecruitmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  form?: RecruitmentForm | null;
  mode?: 'create' | 'edit';
}

const RecruitmentFormModal: React.FC<RecruitmentFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  form,
  mode
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'fields' | 'settings' | 'media'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [projectItems, setProjectItems] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // Fetch project items
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/admin/project-items?limit=100', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (data.success) {
          setProjectItems(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };
    if (isOpen) fetchProjects();
  }, [isOpen, accessToken]);
  
  const [formData, setFormData] = useState<Partial<RecruitmentForm>>({
    title: { en: '', ta: '' },
    description: { en: '', ta: '' },
    role: 'participants',
    fields: [],
    isActive: true,
    startDate: '',
    endDate: '',
    maxResponses: undefined,
    image: '',
    emailNotification: false
  });

  // Initialize form data
  useEffect(() => {
    if (form && (mode === 'edit' || form._id)) {
      setFormData({
        title: form.title || { en: '', ta: '' },
        description: form.description || { en: '', ta: '' },
        role: form.role || 'participants',
        fields: form.fields ? form.fields.map(f => ({
          ...f,
          label: f.label || { en: '', ta: '' },
          placeholder: f.placeholder || { en: '', ta: '' },
          options: f.options || []
        })) : [],
        isActive: form.isActive ?? true,
        startDate: form.startDate ? new Date(form.startDate).toISOString().split('T')[0] : '',
        endDate: form.endDate ? new Date(form.endDate).toISOString().split('T')[0] : '',
        maxResponses: form.maxResponses,
        image: form.image || '',
        emailNotification: form.emailNotification || false
      });
    } else {
      // Default fields for new form
      setFormData({
        title: { en: '', ta: '' },
        description: { en: '', ta: '' },
        role: 'participants',
        fields: [
          {
            id: `field-${Date.now()}-1`,
            type: 'text',
            label: { en: 'Full Name', ta: 'முழு பெயர்' },
            required: true,
            order: 1
          },
          {
            id: `field-${Date.now()}-2`,
            type: 'email',
            label: { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
            required: true,
            order: 2
          },
          {
            id: `field-${Date.now()}-3`,
            type: 'phone',
            label: { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
            required: true,
            order: 3
          }
        ],
        isActive: true,
        startDate: '',
        endDate: '',
        maxResponses: undefined,
        image: '',
        emailNotification: false
      });
    }
    setErrors({});
  }, [form, mode, isOpen]);

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
    if (!formData.description?.en?.trim()) newErrors['description.en'] = 'English description is required';
    if (!formData.description?.ta?.trim()) newErrors['description.ta'] = 'Tamil description is required';

    if (!formData.fields || formData.fields.length === 0) {
      newErrors['fields'] = 'At least one field is required';
    } else {
      formData.fields.forEach((field, index) => {
        if (!field.label.en.trim()) newErrors[`field.${index}.label.en`] = 'Label required';
        if (!field.label.ta.trim()) newErrors[`field.${index}.label.ta`] = 'Label required';
        
        if (['select', 'radio', 'checkbox'].includes(field.type)) {
          if (!field.options || field.options.length === 0) {
            newErrors[`field.${index}.options`] = 'Options required for this field type';
          }
        }
      });     
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const actualMode = mode || (form?._id ? 'edit' : 'create');
      const url = '/api/admin/recruitment-forms';
      const method = actualMode === 'edit' ? 'PUT' : 'POST';
      
      const payload = actualMode === 'edit' 
        ? { _id: form?._id, ...formData }
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
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving form:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save form' });
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

  // Field Management
  const addField = () => {
    setFormData(prev => ({
      ...prev,
      fields: [
        ...(prev.fields || []),
        {
          id: `field-${Date.now()}`,
          type: 'text',
          label: { en: '', ta: '' },
          required: false,
          order: (prev.fields?.length || 0) + 1
        }
      ]
    }));
  };

  const removeField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields?.filter((_, i) => i !== index)
    }));
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFormData(prev => {
      const newFields = [...(prev.fields || [])];
      newFields[index] = { ...newFields[index], ...updates };
      return { ...prev, fields: newFields };
    });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === (formData.fields?.length || 0) - 1) return;

    setFormData(prev => {
      const newFields = [...(prev.fields || [])];
      const temp = newFields[index];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      newFields[index] = newFields[targetIndex];
      newFields[targetIndex] = temp;
      
      // Update order property
      newFields.forEach((f, i) => f.order = i + 1);
      
      return { ...prev, fields: newFields };
    });
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container" style={{ maxWidth: '1100px' }}>
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              {mode === 'create' ? 'Create Recruitment Form' : 'Edit Recruitment Form'}
            </h2>
            <p className="modal-subtitle">
              Configure form details, dynamic fields, and settings
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="modern-close-button"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        <div className="modern-modal-tabs">
          {['content', 'fields', 'settings', 'media'].map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab === 'content' && <FaCode />}
              {tab === 'fields' && <FaList />}
              {tab === 'settings' && <FaCog />}
              {tab === 'media' && <FaImage />}
              <span className="capitalize">{tab}</span>
            </button>
          ))}
        </div>

        <form className="modern-modal-form" onSubmit={handleSubmit}>
          <div className="modern-modal-body">
            {activeTab === 'content' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">
                    Basic Information
                  </h3>
                  
                  {/* Title */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Title (English)
                        {formData.title?.en && <FaCheckSquare className="text-emerald-500 ml-auto" />}
                      </label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.en'] ? 'invalid' : ''}`}
                        value={formData.title?.en}
                        onChange={(e) => handleInputChange('title.en', e.target.value)}
                        placeholder="e.g., Annual Volunteer Recruitment"
                      />
                      {errors['title.en'] && <span className="error-message">{errors['title.en']}</span>}
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Title (Tamil)
                        {formData.title?.ta && <FaCheckSquare className="text-emerald-500 ml-auto" />}
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.ta'] ? 'invalid' : ''}`}
                        value={formData.title?.ta}
                        onChange={(e) => handleInputChange('title.ta', e.target.value)}
                        placeholder="எ.கா., வருடாந்திர தன்னார்வலர் ஆட்சேர்ப்பு"
                      />
                      {errors['title.ta'] && <span className="error-message">{errors['title.ta']}</span>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Description (English)
                      </label>
                      <div className="language-tag">EN</div>
                      <textarea
                        className={`modern-textarea ${errors['description.en'] ? 'invalid' : ''}`}
                        value={formData.description?.en}
                        onChange={(e) => handleInputChange('description.en', e.target.value)}
                        rows={3}
                      />
                      {errors['description.en'] && <span className="error-message">{errors['description.en']}</span>}
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Description (Tamil)
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <textarea
                        className={`modern-textarea ${errors['description.ta'] ? 'invalid' : ''}`}
                        value={formData.description?.ta}
                        onChange={(e) => handleInputChange('description.ta', e.target.value)}
                        rows={3}
                      />
                      {errors['description.ta'] && <span className="error-message">{errors['description.ta']}</span>}
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="modern-field-group">
                      <label className="modern-label">Role Category</label>
                      <select
                        className="modern-select"
                        value={formData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                      >
                        <option value="participants">Participants</option>
                        <option value="crew">Crew</option>
                        <option value="volunteer">Volunteer</option>
                      </select>
                    </div>

                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Linked Project
                      </label>
                      <select
                        className={`modern-select ${errors['projectItemId'] ? 'invalid' : ''}`}
                        value={formData.projectItemId || ''}
                        onChange={(e) => handleInputChange('projectItemId', e.target.value)}
                      >
                        <option value="">-- Select Project --</option>
                        {typeof projectItems !== 'undefined' && projectItems.map(p => (
                          <option key={p._id} value={p._id}>
                            {p.title?.en || 'Untitled'} ({p.type})
                          </option>
                        ))}
                      </select>
                      {errors['projectItemId'] && <span className="error-message">{errors['projectItemId']}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-[var(--border)]">
                    <h3 className="section-title" style={{ margin: 0, border: 'none' }}>
                      Form Fields Builder
                    </h3>
                    <button type="button" onClick={addField} className="modern-btn modern-btn-secondary">
                      <FaPlus /> Add Field
                    </button>
                  </div>

                  {formData.fields?.length === 0 && (
                    <div className="text-center py-12 bg-[var(--background-secondary)] rounded-2xl border-2 border-dashed border-[var(--border)]">
                      <FaList className="text-4xl text-[var(--foreground-muted)] mx-auto mb-3 opacity-50" />
                      <p className="text-[var(--foreground-muted)] font-medium">No fields added yet</p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">Click "Add Field" to start building your form</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.fields?.map((field, index) => (
                      <div key={field.id} className="form-builder-item">
                        <div className="form-builder-header">
                          <div className="form-builder-controls">
                            <span className="form-builder-index">#{index + 1}</span>
                            <select
                              value={field.type}
                              onChange={(e) => updateField(index, { type: e.target.value as any })}
                              className="modern-select compact-select"
                            >
                              <optgroup label="Basic">
                                <option value="text">Short Answer</option>
                                <option value="textarea">Paragraph</option>
                              </optgroup>
                              <optgroup label="Choice">
                                <option value="radio">Multiple Choice</option>
                                <option value="checkbox">Checkboxes</option>
                                <option value="select">Dropdown</option>
                              </optgroup>
                              <optgroup label="Advanced">
                                <option value="file">File Upload</option>
                                <option value="scale">Linear Scale</option>
                                <option value="grid_radio">Multiple Choice Grid</option>
                                <option value="grid_checkbox">Checkbox Grid</option>
                              </optgroup>
                              <optgroup label="Date & Time">
                                <option value="date">Date</option>
                                <option value="time">Time</option>
                              </optgroup>
                              <optgroup label="Contact Info">
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="number">Number</option>
                              </optgroup>
                            </select>
                            
                            <label className="modern-checkbox-label">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="modern-checkbox"
                              />
                              <span className="checkbox-text" style={{ fontSize: '0.875rem' }}>Required</span>
                            </label>
                          </div>

                          <div className="form-builder-actions">
                            <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0} className="modern-btn modern-btn-secondary compact-btn">
                              <FaArrowUp />
                            </button>
                            <button type="button" onClick={() => moveField(index, 'down')} disabled={index === (formData.fields?.length || 0) - 1} className="modern-btn modern-btn-secondary compact-btn">
                              <FaArrowDown />
                            </button>
                            <button type="button" onClick={() => removeField(index)} className="modern-btn modern-btn-danger compact-btn">
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        <div className="bilingual-inputs">
                          <div className="modern-field-group bilingual-input-group">
                            <div className="language-tag">EN</div>
                            <input
                              type="text"
                              className="modern-input"
                              value={field.label.en}
                              onChange={(e) => updateField(index, { label: { ...field.label, en: e.target.value } })}
                              placeholder="Field Label (English)"
                            />
                            {errors[`field.${index}.label.en`] && <span className="error-message">{errors[`field.${index}.label.en`]}</span>}
                          </div>
                          <div className="modern-field-group bilingual-input-group">
                            <div className="language-tag tamil">TA</div>
                            <input
                              type="text"
                              className="modern-input"
                              value={field.label.ta}
                              onChange={(e) => updateField(index, { label: { ...field.label, ta: e.target.value } })}
                              placeholder="புலத்தின் பெயர் (தமிழ்)"
                            />
                            {errors[`field.${index}.label.ta`] && <span className="error-message">{errors[`field.${index}.label.ta`]}</span>}
                          </div>
                        </div>

                        {/* Configuration for different field types */}
                        {field.type === 'scale' && (
                          <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] mt-4">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="modern-label">Min Value</label>
                                <select 
                                  className="modern-select"
                                  value={field.validation?.min || 1}
                                  onChange={(e) => updateField(index, { validation: { ...field.validation, min: parseInt(e.target.value) } })}
                                >
                                  <option value="0">0</option>
                                  <option value="1">1</option>
                                </select>
                              </div>
                              <div>
                                <label className="modern-label">Max Value</label>
                                <select 
                                  className="modern-select"
                                  value={field.validation?.max || 5}
                                  onChange={(e) => updateField(index, { validation: { ...field.validation, max: parseInt(e.target.value) } })}
                                >
                                  {[...Array(9)].map((_, i) => (
                                    <option key={i} value={i + 2}>{i + 2}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="modern-label">Min Label (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    className="modern-input"
                                    value={field.options?.[0]?.en || ''}
                                    onChange={(e) => {
                                      const newOpts = [...(field.options || [])];
                                      if (!newOpts[0]) newOpts[0] = { en: '', ta: '', value: 'min_label' };
                                      newOpts[0] = { ...newOpts[0], en: e.target.value, value: 'min_label' };
                                      updateField(index, { options: newOpts });
                                    }}
                                    placeholder="English"
                                  />
                                  <input
                                    type="text"
                                    className="modern-input"
                                    value={field.options?.[0]?.ta || ''}
                                    onChange={(e) => {
                                      const newOpts = [...(field.options || [])];
                                      if (!newOpts[0]) newOpts[0] = { en: '', ta: '', value: 'min_label' };
                                      newOpts[0] = { ...newOpts[0], ta: e.target.value };
                                      updateField(index, { options: newOpts });
                                    }}
                                    placeholder="தமிழ்"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="modern-label">Max Label (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    className="modern-input"
                                    value={field.options?.[1]?.en || ''}
                                    onChange={(e) => {
                                      const newOpts = [...(field.options || [])];
                                      if (!newOpts[1]) newOpts[1] = { en: '', ta: '', value: 'max_label' };
                                      newOpts[1] = { ...newOpts[1], en: e.target.value, value: 'max_label' };
                                      updateField(index, { options: newOpts });
                                    }}
                                    placeholder="English"
                                  />
                                  <input
                                    type="text"
                                    className="modern-input"
                                    value={field.options?.[1]?.ta || ''}
                                    onChange={(e) => {
                                      const newOpts = [...(field.options || [])];
                                      if (!newOpts[1]) newOpts[1] = { en: '', ta: '', value: 'max_label' };
                                      newOpts[1] = { ...newOpts[1], ta: e.target.value };
                                      updateField(index, { options: newOpts });
                                    }}
                                    placeholder="தமிழ்"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {['select', 'radio', 'checkbox', 'grid_radio', 'grid_checkbox'].includes(field.type) && (
                          <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] mt-4">
                            <label className="modern-label">
                              {field.type.includes('grid') ? 'Row Labels' : 'Options'} (Comma separated)
                            </label>
                            <div className="relative mb-3">
                              <span className="absolute top-2.5 left-3 text-[var(--foreground-muted)]">
                                <FaPlus />
                              </span>
                              <input
                                type="text"
                                className="modern-input"
                                style={{ paddingLeft: '2.25rem' }}
                                placeholder="Type option and press comma or enter..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value;
                                    if (!val) return;
                                    const opts = val.split(',').map(s => s.trim()).filter(Boolean);
                                    if (opts.length) {
                                      const currentOpts = field.options || [];
                                      const newOpts = opts.map(o => ({ en: o, ta: o, value: o.toLowerCase().replace(/\s+/g, '_') }));
                                      updateField(index, { options: [...currentOpts, ...newOpts] });
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!e.target.value) return;
                                  const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                  if (opts.length) {
                                    const currentOpts = field.options || [];
                                    const newOpts = opts.map(o => ({ en: o, ta: o, value: o.toLowerCase().replace(/\s+/g, '_') }));
                                    updateField(index, { options: [...currentOpts, ...newOpts] });
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </div>
                            
                            {field.options && field.options.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((opt, optIdx) => (
                                  <div key={optIdx} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--background)] rounded-full border border-[var(--border)] text-sm font-medium text-[var(--foreground)]">
                                    <span>{opt.en}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newOpts = field.options?.filter((_, i) => i !== optIdx);
                                        updateField(index, { options: newOpts });
                                      }}
                                      className="text-[var(--foreground-muted)] hover:text-rose-500"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            {errors[`field.${index}.options`] && <span className="error-message">{errors[`field.${index}.options`]}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">
                    Form Settings
                  </h3>
                  
                  <div className="form-grid">
                    <div className="modern-field-group">
                      <label className="modern-label">Start Date</label>
                      <input
                        type="date"
                        className="modern-input"
                        value={formData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">End Date</label>
                      <input
                        type="date"
                        className="modern-input"
                        value={formData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">Max Responses (Optional)</label>
                    <input
                      type="number"
                      className="modern-input"
                      value={formData.maxResponses || ''}
                      onChange={(e) => handleInputChange('maxResponses', e.target.value)}
                      placeholder="Unlimited if left blank"
                    />
                  </div>

                  <div className="modern-field-group">
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.emailNotification}
                          onChange={(e) => handleInputChange('emailNotification', e.target.checked)}
                        />
                        <div>
                          <span className="checkbox-text">Email Notifications</span>
                          <span className="checkbox-description">Receive email notifications for new submissions</span>
                        </div>
                      </label>
                    </div>
                  </div>
                    
                  <div className="modern-field-group">
                    <div className="modern-checkbox-group">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        />
                        <div>
                          <span className="checkbox-text">Active Status</span>
                          <span className="checkbox-description">Form is active and accepting responses</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">
                    Form Media
                  </h3>
                  
                  <div className="modern-field-group">
                    <MediaUploader
                      category="recruitment"
                      subCategory="banners"
                      accept="image/*"
                      previewType="image"
                      label="Form Image"
                      onUploaded={(r) => {
                        const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                        handleInputChange('image', url);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modern-modal-footer">
            <div className="modal-footer-left">
              {errors.submit && (
                <div className="modal-error">
                  <FaTimes /> {errors.submit}
                </div>
              )}
            </div>
            <div className="modal-footer-right">
              <button 
                type="button" 
                className="modern-btn modern-btn-secondary"
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="modern-btn modern-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (<><FaSpinner className="spinner" /> Saving...</>) : (<><FaSave /> Save Form</>)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RecruitmentFormModal;