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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100000] p-4 animate-fade-in">
      <div className="w-full max-w-6xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[90vh] flex flex-col relative overflow-hidden text-white animate-scale-in">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0a0a0f]">
            <div className="modal-title-section">
              <h2 className="text-2xl font-bold text-white mb-1">
                {mode === 'edit' ? 'Edit Project Item' : 'Create Project Item'}
              </h2>
              <p className="text-sm text-gray-400">Manage project details, settings, and media</p>
            </div>
            <button 
              type="button" 
              className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-transparent hover:border-white/10"
              onClick={onClose} 
              aria-label="Close"
            >
              <FaTimes size={20} />
            </button>
          </div>

          <div className="flex gap-2 p-4 border-b border-white/10 bg-white/5">
            <button 
              type="button" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button 
              type="button" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button 
              type="button" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'media' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              onClick={() => setActiveTab('media')}
            >
              Media
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0f] custom-scrollbar">
            {activeTab === 'content' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Title (English)</label>
                  <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.title.en} onChange={e => updateBilingual('title', 'en', e.target.value)} />
                  {errors.titleEn && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.titleEn}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Title (Tamil)</label>
                  <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.title.ta} onChange={e => updateBilingual('title', 'ta', e.target.value)} />
                  {errors.titleTa && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.titleTa}</p>}
                </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Short Description (English)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.shortDesc.en} onChange={e => updateBilingual('shortDesc', 'en', e.target.value)} />
                {errors.shortDescEn && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.shortDescEn}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Short Description (Tamil)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.shortDesc.ta} onChange={e => updateBilingual('shortDesc', 'ta', e.target.value)} />
                {errors.shortDescTa && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.shortDescTa}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Full Description (English)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[150px]" rows={4} value={form.fullDesc.en} onChange={e => updateBilingual('fullDesc', 'en', e.target.value)} />
                {errors.fullDescEn && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.fullDescEn}</p>}
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-400">Full Description (Tamil)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[150px]" rows={4} value={form.fullDesc.ta} onChange={e => updateBilingual('fullDesc', 'ta', e.target.value)} />
                {errors.fullDescTa && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.fullDescTa}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Goals (English)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.goals.en} onChange={e => updateBilingual('goals', 'en', e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Goals (Tamil)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.goals.ta} onChange={e => updateBilingual('goals', 'ta', e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Achievement (English)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.achievement.en} onChange={e => updateBilingual('achievement', 'en', e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Achievement (Tamil)</label>
                <textarea className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 min-h-[100px]" value={form.achievement.ta} onChange={e => updateBilingual('achievement', 'ta', e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Director Name (English)</label>
                <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.directorName.en} onChange={e => updateBilingual('directorName', 'en', e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Director Name (Tamil)</label>
                <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.directorName.ta} onChange={e => updateBilingual('directorName', 'ta', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Type</label>
                <select className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 appearance-none" value={form.type} onChange={e => updateField('type', e.target.value)}>
                  <option value="project" className="bg-[#0a0a0f]">Project</option>
                  <option value="activity" className="bg-[#0a0a0f]">Activity</option>
                  <option value="initiative" className="bg-[#0a0a0f]">Initiative</option>
                </select>
                {errors.type && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.type}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Bureau</label>
                <select className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 appearance-none" value={form.bureau || ''} onChange={e => updateField('bureau', e.target.value || undefined)}>
                  <option value="" className="bg-[#0a0a0f]">None</option>
                  <option value="sports_leadership" className="bg-[#0a0a0f]">Sports & Leadership</option>
                  <option value="education_intellectual" className="bg-[#0a0a0f]">Education & Intellectual</option>
                  <option value="arts_culture" className="bg-[#0a0a0f]">Arts & Culture</option>
                  <option value="social_welfare_voluntary" className="bg-[#0a0a0f]">Social Welfare & Voluntary</option>
                  <option value="language_literature" className="bg-[#0a0a0f]">Language & Literature</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Status</label>
                <select className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50 appearance-none" value={form.status} onChange={e => updateField('status', e.target.value)}>
                  <option value="planning" className="bg-[#0a0a0f]">Planning</option>
                  <option value="active" className="bg-[#0a0a0f]">Active</option>
                  <option value="completed" className="bg-[#0a0a0f]">Completed</option>
                  <option value="cancelled" className="bg-[#0a0a0f]">Cancelled</option>
                  <option value="on-hold" className="bg-[#0a0a0f]">On-hold</option>
                </select>
                {errors.status && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.status}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Start Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.startDate || ''} onChange={e => updateField('startDate', e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">End Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.endDate || ''} onChange={e => updateField('endDate', e.target.value)} />
                {errors.endDate && <p className="text-xs text-rose-400 flex items-center gap-1"><FaExclamationTriangle /> {errors.endDate}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Budget</label>
                <input type="number" min={0} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.budget ?? ''} onChange={e => updateField('budget', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Participants</label>
                <input type="number" min={0} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.participants ?? 0} onChange={e => updateField('participants', Number(e.target.value))} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Active</label>
                <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-xl">
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500" checked={form.active} onChange={e => updateField('active', e.target.checked)} />
                  <span className="text-white">Is Active?</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Featured</label>
                <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/10 rounded-xl">
                  <input type="checkbox" className="w-5 h-5 rounded border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500" checked={form.featured} onChange={e => updateField('featured', e.target.checked)} />
                  <span className="text-white">Is Featured?</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Location (English)</label>
                <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.location?.en || ''} onChange={e => updateBilingual('location', 'en', e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Location (Tamil)</label>
                <input className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all focus:border-indigo-500/50" value={form.location?.ta || ''} onChange={e => updateBilingual('location', 'ta', e.target.value)} />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Media Gallery</h3>

              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
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
                {errors.image && <span className="text-xs text-rose-400 flex items-center gap-1 mt-2"><FaExclamationTriangle /> {errors.image}</span>}
              </div>

              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
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
                {galleryErrors && <span className="text-xs text-rose-400 flex items-center gap-1 mt-2"><FaExclamationTriangle /> {galleryErrors}</span>}
                
                {(form.images || []).length > 0 && (
                  <div className="mt-4">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      {(form.images || []).map((src, idx) => (
                        <div key={`${src}-${idx}`} className="relative min-h-[140px] border-2 border-dashed border-white/10 rounded-xl bg-black/20 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all">
                          <div className="w-full h-full flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img className="max-w-full max-h-[140px] object-contain rounded-lg" src={src.startsWith('/api/') ? src : `/api/files/serve?path=${encodeURIComponent(src)}`} alt={`Image ${idx + 1}`} />
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors" onClick={() => removeImageAt(idx)}>
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

          <div className="flex items-center justify-between p-6 border-t border-white/10 bg-[#0a0a0f] sticky bottom-0">
            <div className="modal-footer-left">
              {errors.submit && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                  <FaExclamationTriangle /> {errors.submit}
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button 
                type="button" 
                className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 hover:text-white transition-all flex items-center gap-2" 
                onClick={onClose} 
                disabled={loading}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? (<><FaSpinner className="animate-spin" /> Saving</>) : (<><FaSave /> Save</>)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectItemModal;
