import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Trash2, Globe, Linkedin, Twitter, Github, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import MediaUploader from './MediaUploader';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

interface TeamMember {
  _id?: string;
  name: BilingualText;
  bio: BilingualText;
  email: string;
  phone?: string;
  role: string;
  department: string;
  orderNum: number;
  isActive: boolean;
  imagePath?: string;
  specializations?: string[];
  languages?: string[];
  achievements?: string[];
}

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (member: Partial<TeamMember>) => Promise<void>;
  onSuccess?: () => void;
  member?: TeamMember | null;
  mode?: 'create' | 'edit';
}

const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSuccess,
  member,
  mode
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'settings' | 'media'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: { en: '', ta: '' },
    bio: { en: '', ta: '' },
    email: '',
    phone: '',
    role: '',
    department: '',
    orderNum: 0,
    isActive: true,
    imagePath: '',
    specializations: [],
    languages: [],
    achievements: []
  });

  const teamRoles = [
    { value: 'President', label: 'President' },
    { value: 'Vice President', label: 'Vice President' },
    { value: 'Secretary', label: 'Secretary' },
    { value: 'Treasurer', label: 'Treasurer' },
    { value: 'Executive Committee', label: 'Executive Committee' },
    { value: 'Chief Auditor', label: 'Chief Auditor' },
    { value: 'Auditor', label: 'Auditor' }
  ];

  const teamDepartments = [
    { value: 'High Committee', label: 'High Committee' },
    { value: 'Media and Public Relations', label: 'Media and Public Relations' },
    { value: 'Sports and Leadership', label: 'Sports and Leadership' },
    { value: 'Education and Intellectual', label: 'Education and Intellectual' },
    { value: 'Arts & Culture', label: 'Arts & Culture' },
    { value: 'Social Welfare & Voluntary', label: 'Social Welfare & Voluntary' },
    { value: 'Language and Literature', label: 'Language and Literature' },
    { value: 'Auditing Department', label: 'Auditing Department' }
  ];

  useEffect(() => {
    if (member && (mode === 'edit' || member._id)) {
      setFormData({
        name: member.name || { en: '', ta: '' },
        bio: member.bio || { en: '', ta: '' },
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || '',
        department: member.department || '',
        orderNum: member.orderNum || 0,
        isActive: member.isActive ?? true,
        imagePath: member.imagePath || '',
        specializations: member.specializations || [],
        languages: member.languages || [],
        achievements: member.achievements || []
      });
    } else {
      setFormData({
        name: { en: '', ta: '' },
        bio: { en: '', ta: '' },
        email: '',
        phone: '',
        role: '',
        department: '',
        orderNum: 0,
        isActive: true,
        imagePath: '',
        specializations: [],
        languages: [],
        achievements: []
      });
    }
    setErrors({});
    setActiveTab('content');
  }, [member, mode, isOpen]);

  const updateBilingualText = (field: string, lang: 'en' | 'ta', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] as BilingualText),
        [lang]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.en?.trim()) newErrors.nameEn = 'English name is required';
    if (!formData.name?.ta?.trim()) newErrors.nameTa = 'Tamil name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (onSave) {
        await onSave(formData);
      } else {
        const url = '/api/admin/team';
        const method = mode === 'create' ? 'POST' : 'PUT';
        const body = mode === 'create' ? formData : { _id: member?._id, ...formData };
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error('Failed to save team member');
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving team member:', error);
      setErrors({ submit: 'Failed to save team member' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {mode === 'create' ? 'Add Team Member' : 'Edit Team Member'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">Manage team member details and roles</p>
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
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Role & Settings
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'media'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            Profile Image
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="team-form" onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={formData.name?.en}
                      onChange={(e) => updateBilingualText('name', 'en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="John Doe"
                    />
                    {errors.nameEn && <p className="mt-1 text-xs text-red-500">{errors.nameEn}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name (Tamil)</label>
                    <input
                      type="text"
                      value={formData.name?.ta}
                      onChange={(e) => updateBilingualText('name', 'ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="ஜான் டோ"
                    />
                    {errors.nameTa && <p className="mt-1 text-xs text-red-500">{errors.nameTa}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Bio (English)</label>
                    <textarea
                      value={formData.bio?.en}
                      onChange={(e) => updateBilingualText('bio', 'en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
                      placeholder="Short biography..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Bio (Tamil)</label>
                    <textarea
                      value={formData.bio?.ta}
                      onChange={(e) => updateBilingualText('bio', 'ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
                      placeholder="சுயவிவரம்..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="email@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="+60 12-345 6789"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select Role</option>
                      {teamRoles.map(role => (
                        <option key={role.value} value={role.value} className="bg-[#0a0a0f]">{role.label}</option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select Department</option>
                      {teamDepartments.map(dept => (
                        <option key={dept.value} value={dept.value} className="bg-[#0a0a0f]">{dept.label}</option>
                      ))}
                    </select>
                    {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.orderNum}
                    onChange={(e) => setFormData({ ...formData, orderNum: parseInt(e.target.value) || 0 })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">Active Status</h4>
                    <p className="text-sm text-gray-400">Show this member on the website</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4">Profile Image</label>
                  <div className="flex justify-center">
                    <MediaUploader
                      category="team"
                      subCategory="avatars"
                      accept="image/*"
                      previewType="image"
                      label="Upload Profile Photo"
                      initialUrl={formData.imagePath}
                      onUploaded={(r) => {
                        const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                        setFormData({ ...formData, imagePath: url });
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
            form="team-form"
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20 flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : (
              <>
                <Save size={18} />
                {mode === 'create' ? 'Add Member' : 'Save Changes'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TeamModal;
