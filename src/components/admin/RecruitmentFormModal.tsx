import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Save, Settings, Code, List, Plus, Trash2, ArrowUp, ArrowDown, 
  CheckSquare, Image as ImageIcon, Calendar, Type, AlignLeft, 
  ListOrdered, Phone, Mail, FileText, Grid
} from 'lucide-react';
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
  const [projectItems, setProjectItems] = useState<any[]>([]);

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

  useEffect(() => {
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
        emailNotification: form.emailNotification || false,
        projectItemId: form.projectItemId || ''
      });
    } else {
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
        emailNotification: false,
        projectItemId: ''
      });
    }
    setErrors({});
  }, [form, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.en?.trim()) newErrors['title.en'] = 'English title is required';
    if (!formData.title?.ta?.trim()) newErrors['title.ta'] = 'Tamil title is required';
    if (!formData.description?.en?.trim()) newErrors['description.en'] = 'English description is required';
    
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
      newFields.forEach((f, i) => f.order = i + 1);
      return { ...prev, fields: newFields };
    });
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {mode === 'create' ? 'Create Recruitment Form' : 'Edit Recruitment Form'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Configure form details, dynamic fields, and settings</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {[
            { id: 'content', label: 'Basic Info', icon: Code },
            { id: 'fields', label: 'Form Builder', icon: List },
            { id: 'settings', label: 'Settings', icon: Settings },
            { id: 'media', label: 'Media', icon: ImageIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="recruitment-form" onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === 'content' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title (English) *</label>
                    <input
                      type="text"
                      value={formData.title?.en}
                      onChange={(e) => handleInputChange('title.en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="e.g. Annual Volunteer Recruitment"
                    />
                    {errors['title.en'] && <p className="mt-1 text-xs text-red-500">{errors['title.en']}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Title (Tamil) *</label>
                    <input
                      type="text"
                      value={formData.title?.ta}
                      onChange={(e) => handleInputChange('title.ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="எ.கா. வருடாந்திர தன்னார்வலர் ஆட்சேர்ப்பு"
                    />
                    {errors['title.ta'] && <p className="mt-1 text-xs text-red-500">{errors['title.ta']}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description (English) *</label>
                    <textarea
                      value={formData.description?.en}
                      onChange={(e) => handleInputChange('description.en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
                    />
                    {errors['description.en'] && <p className="mt-1 text-xs text-red-500">{errors['description.en']}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Description (Tamil)</label>
                    <textarea
                      value={formData.description?.ta}
                      onChange={(e) => handleInputChange('description.ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role Category</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="participants" className="bg-[#0a0a0f]">Participants</option>
                      <option value="crew" className="bg-[#0a0a0f]">Crew</option>
                      <option value="volunteer" className="bg-[#0a0a0f]">Volunteer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Linked Project</label>
                    <select
                      value={formData.projectItemId || ''}
                      onChange={(e) => handleInputChange('projectItemId', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="" className="bg-[#0a0a0f]">-- Select Project --</option>
                      {projectItems.map(p => (
                        <option key={p._id} value={p._id} className="bg-[#0a0a0f]">
                          {p.title?.en || 'Untitled'} ({p.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fields' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-white">Form Fields</h3>
                  <button
                    type="button"
                    onClick={addField}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 rounded-lg text-sm font-medium transition-colors border border-purple-500/30"
                  >
                    <Plus size={16} />
                    Add Field
                  </button>
                </div>

                {formData.fields?.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                    <List className="mx-auto text-gray-500 mb-3" size={32} />
                    <p className="text-gray-400">No fields added yet. Click "Add Field" to start building your form.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {formData.fields?.map((field, index) => (
                    <div key={field.id} className="bg-white/5 border border-white/10 rounded-xl p-4 transition-all hover:border-purple-500/30">
                      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                          <select
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value as any })}
                            className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                          >
                            <optgroup label="Basic" className="bg-[#0a0a0f]">
                              <option value="text">Short Text</option>
                              <option value="textarea">Paragraph</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                            </optgroup>
                            <optgroup label="Choices" className="bg-[#0a0a0f]">
                              <option value="select">Dropdown</option>
                              <option value="radio">Radio Buttons</option>
                              <option value="checkbox">Checkboxes</option>
                            </optgroup>
                            <optgroup label="Advanced" className="bg-[#0a0a0f]">
                              <option value="file">File Upload</option>
                              <option value="date">Date</option>
                              <option value="scale">Linear Scale</option>
                            </optgroup>
                          </select>
                          
                          <label className="flex items-center gap-2 cursor-pointer ml-4">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(index, { required: e.target.checked })}
                              className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700 w-4 h-4"
                            />
                            <span className="text-sm text-gray-300">Required</span>
                          </label>
                        </div>

                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30">
                            <ArrowUp size={16} />
                          </button>
                          <button type="button" onClick={() => moveField(index, 'down')} disabled={index === (formData.fields?.length || 0) - 1} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30">
                            <ArrowDown size={16} />
                          </button>
                          <button type="button" onClick={() => removeField(index)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors ml-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label (English)</label>
                          <input
                            type="text"
                            value={field.label.en}
                            onChange={(e) => updateField(index, { label: { ...field.label, en: e.target.value } })}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="e.g. Full Name"
                          />
                          {errors[`field.${index}.label.en`] && <p className="mt-1 text-[10px] text-red-500">{errors[`field.${index}.label.en`]}</p>}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Label (Tamil)</label>
                          <input
                            type="text"
                            value={field.label.ta}
                            onChange={(e) => updateField(index, { label: { ...field.label, ta: e.target.value } })}
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                            placeholder="எ.கா. முழு பெயர்"
                          />
                        </div>
                      </div>

                      {['select', 'radio', 'checkbox'].includes(field.type) && (
                        <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5">
                          <label className="block text-xs font-medium text-gray-400 mb-2">Options (comma separated)</label>
                          <input
                            type="text"
                            placeholder="Option 1, Option 2, Option 3..."
                            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value;
                                if (!val) return;
                                const newOpts = val.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ en: s, ta: s, value: s.toLowerCase().replace(/\s+/g, '_') }));
                                updateField(index, { options: [...(field.options || []), ...newOpts] });
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.options?.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-1 bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30">
                                <span>{opt.en}</span>
                                <button
                                  type="button"
                                  onClick={() => updateField(index, { options: field.options?.filter((_, i) => i !== optIdx) })}
                                  className="hover:text-white"
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                          {errors[`field.${index}.options`] && <p className="mt-1 text-[10px] text-red-500">{errors[`field.${index}.options`]}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleInputChange('endDate', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Responses</label>
                  <input
                    type="number"
                    value={formData.maxResponses || ''}
                    onChange={(e) => handleInputChange('maxResponses', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                    placeholder="Leave blank for unlimited"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-400">Receive an email when someone submits this form</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailNotification}
                        onChange={(e) => handleInputChange('emailNotification', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex-1">
                      <h4 className="text-white font-medium">Active Status</h4>
                      <p className="text-sm text-gray-400">Form is live and accepting submissions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4">Form Banner Image</label>
                  <div className="flex justify-center">
                    <MediaUploader
                      category="recruitment"
                      subCategory="banners"
                      accept="image/*"
                      previewType="image"
                      label="Upload Banner"
                      initialUrl={formData.image}
                      onUploaded={(r) => {
                        const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                        handleInputChange('image', url);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {errors.submit && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {errors.submit}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="recruitment-form"
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (
              <>
                <Save size={18} />
                Save Form
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RecruitmentFormModal;
