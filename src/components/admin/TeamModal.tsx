import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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
  position: BilingualText;
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

const teamRoles = [
  { value: 'President', en: 'President', ta: 'தலைவர்' },
  { value: 'Vice President', en: 'Vice President', ta: 'துணை தலைவர்' },
  { value: 'Secretary', en: 'Secretary', ta: 'செயலாளர்' },
  { value: 'Treasurer', en: 'Treasurer', ta: 'பொருளாளர்' },
  { value: 'Executive Committee', en: 'Executive Committee', ta: 'நிர்வாக குழு' },
  { value: 'Chief Auditor', en: 'Chief Auditor', ta: 'முதன்மை கணக்காய்வாளர்' },
  { value: 'Auditor', en: 'Auditor', ta: 'கணக்காய்வாளர்' }
];

const teamDepartments = [
  { value: 'High Council', en: 'High Council', ta: 'உயர் குழு' },
  { value: 'Media and Public Relations Committee Member', en: 'Media & Public Relations', ta: 'ஊடகம் மற்றும் பொது தொடர்பு' },
  { value: 'Sports and Leadership Committee Member', en: 'Sports & Leadership', ta: 'விளையாட்டு மற்றும் தலைமைத்துவம்' },
  { value: 'Education and Intellectual Committee Member', en: 'Education & Intellectual', ta: 'கல்வி மற்றும் அறிவுத்துறை' },
  { value: 'Arts & Culture Committee Member', en: 'Arts & Culture', ta: 'கலை மற்றும் கலாசாரம்' },
  { value: 'Social Welfare & Voluntary Committee Member', en: 'Social Welfare & Voluntary', ta: 'சமூக நலன் மற்றும் தன்னார்வம்' },
  { value: 'Language and Literature Committee Member', en: 'Language & Literature', ta: 'மொழி மற்றும் இலக்கியம்' },
  { value: 'Auditors', en: 'Auditors', ta: 'கணக்காய்வாளர்கள்' }
];

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
    position: { en: '', ta: '' },
    bio: { en: '', ta: '' },
    email: '',
    phone: '',
    role: '',
    department: '',
    orderNum: 1,
    isActive: true,
    imagePath: '',
    specializations: [],
    languages: [],
    achievements: []
  });

  useEffect(() => {
    if (member && (mode === 'edit' || member._id)) {
      setFormData({
        name: member.name || { en: '', ta: '' },
        position: member.position || { en: '', ta: '' },
        bio: member.bio || { en: '', ta: '' },
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || '',
        department: member.department || '',
        orderNum: member.orderNum || 1,
        isActive: member.isActive ?? true,
        imagePath: member.imagePath || '',
        specializations: member.specializations || [],
        languages: member.languages || [],
        achievements: member.achievements || []
      });
    } else {
      setFormData({
        name: { en: '', ta: '' },
        position: { en: '', ta: '' },
        bio: { en: '', ta: '' },
        email: '',
        phone: '',
        role: '',
        department: '',
        orderNum: 1,
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

  const updateBilingualText = (field: keyof TeamMember, lang: 'en' | 'ta', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...((prev[field] as BilingualText) || { en: '', ta: '' }),
        [lang]: value
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.en?.trim()) newErrors.nameEn = 'English name is required';
    if (!formData.name?.ta?.trim()) newErrors.nameTa = 'Tamil name is required';
    if (!formData.position?.en?.trim()) newErrors.positionEn = 'English position is required';
    if (!formData.position?.ta?.trim()) newErrors.positionTa = 'Tamil position is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    if (!formData.orderNum || formData.orderNum < 1) newErrors.orderNum = 'Display order must be at least 1';

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
        const isCreate = mode === 'create';
        const url = '/api/admin/team';
        const method = isCreate ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(isCreate ? formData : { ...formData, _id: member?._id })
        });

        const raw = await response.text();
        let data: any = {};
        try {
          data = JSON.parse(raw);
        } catch {}

        if (!response.ok) {
          throw new Error(data.error || data.message || `Failed to ${mode === 'create' ? 'create' : 'update'} team member`);
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving team member:', error);
      setErrors({ submit: error.message || 'An unexpected error occurred while saving' });
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

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="team-form" onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'content' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name (English)</label>
                    <input
                      type="text"
                      value={formData.name?.en || ''}
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
                      value={formData.name?.ta || ''}
                      onChange={(e) => updateBilingualText('name', 'ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="ஜான் டோ"
                    />
                    {errors.nameTa && <p className="mt-1 text-xs text-red-500">{errors.nameTa}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Position (English)</label>
                    <input
                      type="text"
                      value={formData.position?.en || ''}
                      onChange={(e) => updateBilingualText('position', 'en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="President"
                    />
                    {errors.positionEn && <p className="mt-1 text-xs text-red-500">{errors.positionEn}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Position (Tamil)</label>
                    <input
                      type="text"
                      value={formData.position?.ta || ''}
                      onChange={(e) => updateBilingualText('position', 'ta', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                      placeholder="தலைவர்"
                    />
                    {errors.positionTa && <p className="mt-1 text-xs text-red-500">{errors.positionTa}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Bio (English)</label>
                    <textarea
                      value={formData.bio?.en || ''}
                      onChange={(e) => updateBilingualText('bio', 'en', e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors h-32 resize-none"
                      placeholder="Short biography..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Bio (Tamil)</label>
                    <textarea
                      value={formData.bio?.ta || ''}
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
                      value={formData.email || ''}
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
                      value={formData.phone || ''}
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
                      value={formData.role || ''}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select Role</option>
                      {teamRoles.map((role) => (
                        <option key={role.value} value={role.value} className="bg-[#0a0a0f]">
                          {role.en} / {role.ta}
                        </option>
                      ))}
                    </select>
                    {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
                    <select
                      value={formData.department || ''}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors appearance-none"
                    >
                      <option value="">Select Department</option>
                      {teamDepartments.map((dept) => (
                        <option key={dept.value} value={dept.value} className="bg-[#0a0a0f]">
                          {dept.en} / {dept.ta}
                        </option>
                      ))}
                    </select>
                    {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.orderNum ?? 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        orderNum: Math.max(1, parseInt(e.target.value, 10) || 1)
                      })
                    }
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none transition-colors"
                  />
                  {errors.orderNum && <p className="mt-1 text-xs text-red-500">{errors.orderNum}</p>}
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
                      checked={!!formData.isActive}
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
                        const url =
                          r.url ||
                          (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
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