import React, { useEffect, useState } from 'react';
import '../../styles/admin/modals.css';
import { FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaImage, FaUpload } from 'react-icons/fa';
import MediaUploader from './MediaUploader';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

export interface ProjectItemForm {
  _id?: string;
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
  status: 'planning' | 'active' | 'completed' | 'cancelled' | 'on-hold';
  startDate?: string;
  endDate?: string;
  budget?: number;
  location?: BilingualText;
  participants?: number;
  featured: boolean;
  active: boolean;
}

interface ProjectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ProjectItemForm | null;
  mode?: 'create' | 'edit';
  onSaved?: () => Promise<void> | void;
}

const DEFAULT_FORM: ProjectItemForm = {
  type: 'project',
  bureau: undefined,
  title: { en: '', ta: '' },
  shortDesc: { en: '', ta: '' },
  fullDesc: { en: '', ta: '' },
  images: [],
  heroImagePath: '',
  goals: { en: '', ta: '' },
  achievement: { en: '', ta: '' },
  directorName: { en: '', ta: '' },
  status: 'planning',
  startDate: '',
  endDate: '',
  budget: undefined,
  location: { en: '', ta: '' },
  participants: 0,
  featured: false,
  active: true,
};

const ProjectItemModal: React.FC<ProjectItemModalProps> = ({ isOpen, onClose, item, mode = 'create', onSaved }) => {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<ProjectItemForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'media'>('content');
  const [galleryErrors, setGalleryErrors] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab('content');
    }
  }, [isOpen]);
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  useEffect(() => {
    if (item && mode === 'edit') {
      setForm({
        ...DEFAULT_FORM,
        ...item,
        startDate: item.startDate || '',
        endDate: item.endDate || '',
      });
      setErrors({});
    } else {
      setForm(DEFAULT_FORM);
      setErrors({});
    }
  }, [item, mode]);

  const updateBilingual = (field: keyof ProjectItemForm, lang: 'en' | 'ta', value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: {
        ...(prev[field] as BilingualText),
        [lang]: value,
      } as BilingualText,
    }));
  };

  const updateField = (field: keyof ProjectItemForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      const { [field as string]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.en.trim()) e.titleEn = 'English title is required';
    if (!form.title.ta.trim()) e.titleTa = 'Tamil title is required';
    if (!form.shortDesc.en.trim()) e.shortDescEn = 'English short description is required';
    if (!form.shortDesc.ta.trim()) e.shortDescTa = 'Tamil short description is required';
    if (!form.fullDesc.en.trim()) e.fullDescEn = 'English full description is required';
    if (!form.fullDesc.ta.trim()) e.fullDescTa = 'Tamil full description is required';
    if (!form.goals.en.trim() || !form.goals.ta.trim()) e.goals = 'Goals in both languages are required';
    if (!form.directorName.en.trim() || !form.directorName.ta.trim()) e.directorName = 'Director name in both languages is required';
    if (!form.type) e.type = 'Type is required';
    if (!form.status) e.status = 'Status is required';
    if (form.endDate && form.startDate && new Date(form.endDate) <= new Date(form.startDate)) {
      e.endDate = 'End date must be after start date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        ...form,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };

      const url = '/api/admin/project-items';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const body = mode === 'edit' ? { _id: form._id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        // Fallback if response is not JSON
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (!res.ok || (result && result.success === false)) {
        const message = result?.error || 'Failed to save project item';
        throw new Error(message);
      }

      if (onSaved) await onSaved();
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (form._id) fd.append('projectId', form._id);
      const res = await fetch('/api/upload/project', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');
      // Prefer the serving URL if provided; fall back to raw path
      updateField('heroImagePath', data.imageUrl || data.imagePath);
    } catch (err: any) {
      setErrors(prev => ({ ...prev, image: err.message }));
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    setGalleryErrors('');
    try {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const fd = new FormData();
        fd.append('image', f);
        if (form._id) fd.append('projectId', form._id);
        const res = await fetch('/api/upload/project', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Upload failed');
        newImages.push(data.imageUrl || data.imagePath);
      }
      updateField('images', [...(form.images || []), ...newImages]);
    } catch (e: any) {
      setGalleryErrors(e.message || 'Failed to upload images');
    } finally {
      setGalleryUploading(false);
    }
  };

  const removeImageAt = (index: number) => {
    const imgs = [...(form.images || [])];
    imgs.splice(index, 1);
    updateField('images', imgs);
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container">
        <form onSubmit={handleSubmit} className="modern-modal-form">
          <div className="modern-modal-header">
            <div className="modal-title-section">
              <h2 className="modern-modal-title">
                {mode === 'edit' ? 'Edit Project Item' : 'Create Project Item'}
              </h2>
              <p className="modal-subtitle">Manage project details, settings, and media</p>
            </div>
            <button type="button" className="modern-close-button" onClick={onClose} aria-label="Close">
              <FaTimes />
            </button>
          </div>

          <div className="modern-modal-tabs">
            <button type="button" className={`tab-button ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>
              Content
            </button>
            <button type="button" className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              Settings
            </button>
            <button type="button" className={`tab-button ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
              Media
            </button>
          </div>

          <div className="modern-modal-body">
            {activeTab === 'content' && (
              <div className="form-grid">
                <div className="form-group">
                  <label>Title (English)</label>
                  <input value={form.title.en} onChange={e => updateBilingual('title', 'en', e.target.value)} />
                  {errors.titleEn && <p className="error-text">{errors.titleEn}</p>}
                </div>
                <div className="form-group">
                  <label>Title (Tamil)</label>
                  <input value={form.title.ta} onChange={e => updateBilingual('title', 'ta', e.target.value)} />
                  {errors.titleTa && <p className="error-text">{errors.titleTa}</p>}
                </div>

              <div className="form-group">
                <label>Short Description (English)</label>
                <textarea value={form.shortDesc.en} onChange={e => updateBilingual('shortDesc', 'en', e.target.value)} />
                {errors.shortDescEn && <p className="error-text">{errors.shortDescEn}</p>}
              </div>
              <div className="form-group">
                <label>Short Description (Tamil)</label>
                <textarea value={form.shortDesc.ta} onChange={e => updateBilingual('shortDesc', 'ta', e.target.value)} />
                {errors.shortDescTa && <p className="error-text">{errors.shortDescTa}</p>}
              </div>

              <div className="form-group full-width">
                <label>Full Description (English)</label>
                <textarea rows={4} value={form.fullDesc.en} onChange={e => updateBilingual('fullDesc', 'en', e.target.value)} />
                {errors.fullDescEn && <p className="error-text">{errors.fullDescEn}</p>}
              </div>
              <div className="form-group full-width">
                <label>Full Description (Tamil)</label>
                <textarea rows={4} value={form.fullDesc.ta} onChange={e => updateBilingual('fullDesc', 'ta', e.target.value)} />
                {errors.fullDescTa && <p className="error-text">{errors.fullDescTa}</p>}
              </div>

              <div className="form-group">
                <label>Goals (English)</label>
                <textarea value={form.goals.en} onChange={e => updateBilingual('goals', 'en', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Goals (Tamil)</label>
                <textarea value={form.goals.ta} onChange={e => updateBilingual('goals', 'ta', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Achievement (English)</label>
                <textarea value={form.achievement.en} onChange={e => updateBilingual('achievement', 'en', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Achievement (Tamil)</label>
                <textarea value={form.achievement.ta} onChange={e => updateBilingual('achievement', 'ta', e.target.value)} />
              </div>

              <div className="form-group">
                <label>Director Name (English)</label>
                <input value={form.directorName.en} onChange={e => updateBilingual('directorName', 'en', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Director Name (Tamil)</label>
                <input value={form.directorName.ta} onChange={e => updateBilingual('directorName', 'ta', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => updateField('type', e.target.value)}>
                  <option value="project">Project</option>
                  <option value="activity">Activity</option>
                  <option value="initiative">Initiative</option>
                </select>
                {errors.type && <p className="error-text">{errors.type}</p>}
              </div>
              <div className="form-group">
                <label>Bureau</label>
                <select value={form.bureau || ''} onChange={e => updateField('bureau', e.target.value || undefined)}>
                  <option value="">None</option>
                  <option value="sports_leadership">Sports & Leadership</option>
                  <option value="education_intellectual">Education & Intellectual</option>
                  <option value="arts_culture">Arts & Culture</option>
                  <option value="social_welfare_voluntary">Social Welfare & Voluntary</option>
                  <option value="language_literature">Language & Literature</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => updateField('status', e.target.value)}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="on-hold">On-hold</option>
                </select>
                {errors.status && <p className="error-text">{errors.status}</p>}
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={form.startDate || ''} onChange={e => updateField('startDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={form.endDate || ''} onChange={e => updateField('endDate', e.target.value)} />
                {errors.endDate && <p className="error-text">{errors.endDate}</p>}
              </div>
              <div className="form-group">
                <label>Budget</label>
                <input type="number" min={0} value={form.budget ?? ''} onChange={e => updateField('budget', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Participants</label>
                <input type="number" min={0} value={form.participants ?? 0} onChange={e => updateField('participants', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Active</label>
                <input type="checkbox" checked={form.active} onChange={e => updateField('active', e.target.checked)} />
              </div>
              <div className="form-group">
                <label>Featured</label>
                <input type="checkbox" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} />
              </div>
              <div className="form-group">
                <label>Location (English)</label>
                <input value={form.location?.en || ''} onChange={e => updateBilingual('location', 'en', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Location (Tamil)</label>
                <input value={form.location?.ta || ''} onChange={e => updateBilingual('location', 'ta', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="modern-form-section">
              <h3 className="section-title">Media Gallery</h3>

              <div className="modern-field-group">
                <MediaUploader
                  category="projectitems"
                  subCategory={`${form._id || 'new'}/images`}
                  accept="image/*"
                  previewType="image"
                  label="Hero Image"
                  onUploaded={(r) => {
                    const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                    updateField('heroImagePath', url);
                  }}
                />
                {errors.image && <span className="error-message"><FaExclamationTriangle /> {errors.image}</span>}
              </div>

              <div className="modern-field-group">
                <MediaUploader
                  category="projectitems"
                  subCategory={`${form._id || 'new'}/images`}
                  accept="image/*"
                  previewType="image"
                  label="Gallery Images"
                  onUploaded={(r) => {
                    const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                    updateField('images', [...(form.images || []), url]);
                  }}
                />
                {galleryErrors && <span className="error-message"><FaExclamationTriangle /> {galleryErrors}</span>}
                
                {(form.images || []).length > 0 && (
                  <div className="modern-image-upload-section">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      {(form.images || []).map((src, idx) => (
                        <div key={`${src}-${idx}`} className="modern-image-upload-area" style={{ minHeight: 140 }}>
                          <div className="image-preview">
                            <img className="preview-image" src={src.startsWith('/api/') ? src : `/api/files/serve?path=${encodeURIComponent(src)}`} alt={`Image ${idx + 1}`} />
                            <div className="image-overlay">
                              <button type="button" className="remove-image-btn" onClick={() => removeImageAt(idx)}>
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          </div>

          <div className="modern-modal-footer">
            <div className="modal-footer-left">
              {errors.submit && (
                <div className="modal-error">
                  <FaExclamationTriangle /> {errors.submit}
                </div>
              )}
            </div>
            <div className="modal-footer-right">
              <button type="button" className="modern-btn modern-btn-secondary" onClick={onClose} disabled={loading}>
                <FaTimes /> Cancel
              </button>
              <button type="submit" className="modern-btn modern-btn-primary" disabled={loading}>
                {loading ? (<><FaSpinner className="spinner" /> Saving</>) : (<><FaSave /> Save</>)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectItemModal;
