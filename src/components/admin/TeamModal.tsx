import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaCog, FaEye, FaPalette, FaCode, FaSearch, FaImage, FaUpload, FaTrash, FaUser, FaUsers } from 'react-icons/fa';
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
  imageUrl?: string;
  specializations?: string[];
  languages?: string[];
  achievements?: string[];
  createdAt?: string;
  updatedAt?: string;
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
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentMember, setCurrentMember] = useState<TeamMember | null>(null);

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

  // Team roles
  const teamRoles = [
    { value: 'President', label: 'President' },
    { value: 'Vice President', label: 'Vice President' },
    { value: 'Secretary', label: 'Secretary' },
    { value: 'Treasurer', label: 'Treasurer' },
    { value: 'Executive Committee', label: 'Executive Committee' },
    { value: 'Chief Auditor', label: 'Chief Auditor' },
    { value: 'Auditor', label: 'Auditor' }
  ];

  // Team departments
  const teamDepartments = [
    { value: 'High Committee', label: 'High Committee' },
    { value: 'Media and Public Relations Committee Member', label: 'Media and Public Relations Committee Member' },
    { value: 'Sports and Leadership Committee Member', label: 'Sports and Leadership Committee Member' },
    { value: 'Education and Intellectual Committee Member', label: 'Education and Intellectual Committee Member' },
    { value: 'Arts & Culture Committee Member', label: 'Arts & Culture Committee Member' },
    { value: 'Social Welfare & Voluntary Committee Member', label: 'Social Welfare & Voluntary Committee Member' },
    { value: 'Language and Literature Committee Member', label: 'Language and Literature Committee Member' },
    { value: 'Auditing Department', label: 'Auditing Department' }
  ];

  // Initialize form data when member changes
  useEffect(() => {
    if (member && (mode === 'edit' || member._id)) {
      setCurrentMember(member);
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
      setCurrentMember(null);
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
    setValidationState({});
  }, [member, mode, isOpen]);
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update validation state
    setValidationState(prev => ({
      ...prev,
      [field]: value !== '' && value !== null && value !== undefined
    }));
  };

  // Update bilingual text
  const updateBilingualText = (field: string, lang: 'en' | 'ta', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev[field as keyof typeof prev] as BilingualText),
        [lang]: value
      }
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Update validation state for bilingual fields
    const currentField = formData[field as keyof typeof formData] as BilingualText;
    const isValid = (lang === 'en' ? value : currentField?.en || '') !== '' && 
                   (lang === 'ta' ? value : currentField?.ta || '') !== '';
    setValidationState(prev => ({
      ...prev,
      [field]: isValid
    }));
  };



  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name?.en?.trim()) {
      newErrors.name = 'English name is required';
    }
    if (!formData.name?.ta?.trim()) {
      newErrors.name = newErrors.name ? `${newErrors.name} and Tamil name is required` : 'Tamil name is required';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role is required';
    }
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Image validation for create mode
    if (mode === 'create' && !formData.imagePath?.trim()) {
      newErrors.image = 'Profile image is required for new team members';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // If onSave callback is provided, use it
      if (onSave) {
        await onSave(formData);
      } else {
        // Otherwise, make direct API call
        const url = '/api/admin/team';
        const method = mode === 'create' ? 'POST' : 'PUT';
        const body = mode === 'create' ? formData : { _id: currentMember?._id, ...formData };
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${mode} team member`);
        }
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} team member:`, error);
      setErrors({
        submit: error instanceof Error ? error.message : `Failed to ${mode} team member`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!currentMember?._id) return;
    
    if (!confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/admin/team?id=${currentMember._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team member');
      }

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error deleting team member:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to delete team member'
      });
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
      setErrors(prev => ({ ...prev, image: 'Please select a valid image file' }));
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
      return;
    }

    setUploadingImage(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      uploadFormData.append('memberId', currentMember?._id || '');

      const response = await fetch('/api/upload/team', {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      updateFormData('imagePath', data.imagePath);
      
      setValidationState(prev => ({
        ...prev,
        image: true
      }));
    } catch (error) {
      console.error('Image upload error:', error);
      setErrors(prev => ({
        ...prev,
        image: error instanceof Error ? error.message : 'Failed to upload image'
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image removal
  const handleImageRemove = () => {
    updateFormData('imagePath', '');
    setValidationState(prev => ({
      ...prev,
      image: false
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container">
        {/* Modal Header */}
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              {mode === 'create' ? 'Create New Team Member' : 'Edit Team Member'}
            </h2>
            <p className="modal-subtitle">
              {mode === 'create' 
                ? 'Add a new team member with bilingual content and profile information'
                : 'Update team member information and settings'
              }
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

        {/* Modal Tabs */}
        <div className="modern-modal-tabs">
          <button
            className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FaCode />
            Content
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <FaCog />
            Settings
          </button>
          <button
            className={`tab-button ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <FaImage />
            Media
          </button>
        </div>

        {/* Modal Body */}
        <form className="modern-modal-form" onSubmit={handleSubmit}>

          <div className="modern-modal-body">
            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">Team Member Information</h3>
                  
                  {/* Name Fields */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Name (English)
                        <span className={`field-status ${validationState['name.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['name.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['name.en'] ? 'invalid' : validationState['name.en'] ? 'valid' : ''}`}
                        value={formData.name?.en || ''}
                        onChange={(e) => updateBilingualText('name', 'en', e.target.value)}
                        placeholder="Enter name in English"
                      />
                      {errors['name.en'] && <span className="error-message">{errors['name.en']}</span>}
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Name (Tamil)
                        <span className={`field-status ${validationState['name.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['name.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['name.ta'] ? 'invalid' : validationState['name.ta'] ? 'valid' : ''}`}
                        value={formData.name?.ta || ''}
                        onChange={(e) => updateBilingualText('name', 'ta', e.target.value)}
                        placeholder="தமிழில் பெயரை உள்ளிடவும்"
                      />
                      {errors['name.ta'] && <span className="error-message">{errors['name.ta']}</span>}
                    </div>
                  </div>



                  {/* Bio Fields */}
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">
                        Bio (English)
                        <span className={`field-status ${validationState['bio.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['bio.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag">EN</div>
                      <textarea
                        className={`modern-textarea ${errors['bio.en'] ? 'invalid' : validationState['bio.en'] ? 'valid' : ''}`}
                        value={formData.bio?.en || ''}
                        onChange={(e) => updateBilingualText('bio', 'en', e.target.value)}
                        placeholder="Enter bio in English"
                        rows={4}
                      />
                      {errors['bio.en'] && <span className="error-message">{errors['bio.en']}</span>}
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">
                        Bio (Tamil)
                        <span className={`field-status ${validationState['bio.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['bio.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <textarea
                        className={`modern-textarea ${errors['bio.ta'] ? 'invalid' : validationState['bio.ta'] ? 'valid' : ''}`}
                        value={formData.bio?.ta || ''}
                        onChange={(e) => updateBilingualText('bio', 'ta', e.target.value)}
                        placeholder="தமிழில் சுயவிவரத்தை உள்ளிடவும்"
                        rows={4}
                      />
                      {errors['bio.ta'] && <span className="error-message">{errors['bio.ta']}</span>}
                    </div>
                  </div>
                </div>

                <div className="modern-form-section">
                  <h3 className="section-title">Contact Information</h3>
                  
                  <div className="form-grid">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Email
                        <span className={`field-status ${validationState.email ? 'valid' : 'invalid'}`}>
                          {validationState.email ? '✓' : '*'}
                        </span>
                      </label>
                      <input
                        type="email"
                        className={`modern-input ${validationState.email ? 'valid' : ''} ${errors.email ? 'invalid' : ''}`}
                        value={formData.email || ''}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                      {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label">Phone</label>
                      <input
                        type="tel"
                        className="modern-input"
                        value={formData.phone || ''}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">Role & Department</h3>
                  
                  <div className="form-grid">
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Role
                        <span className={`field-status ${validationState.role ? 'valid' : 'invalid'}`}>
                          {validationState.role ? '✓' : '*'}
                        </span>
                      </label>
                      <select
                        className={`modern-select ${validationState.role ? 'valid' : ''} ${errors.role ? 'invalid' : ''}`}
                        value={formData.role || ''}
                        onChange={(e) => updateFormData('role', e.target.value)}
                        required
                      >
                        <option value="">Select a role</option>
                        {teamRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      {errors.role && <span className="error-message">{errors.role}</span>}
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label required">
                        Department
                        <span className={`field-status ${validationState.department ? 'valid' : 'invalid'}`}>
                          {validationState.department ? '✓' : '*'}
                        </span>
                      </label>
                      <select
                        className={`modern-select ${validationState.department ? 'valid' : ''} ${errors.department ? 'invalid' : ''}`}
                        value={formData.department || ''}
                        onChange={(e) => updateFormData('department', e.target.value)}
                        required
                      >
                        <option value="">Select a department</option>
                        {teamDepartments.map(dept => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                      {errors.department && <span className="error-message">{errors.department}</span>}
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">Display Order</label>
                    <input
                      type="number"
                      className="modern-input"
                      value={formData.orderNum || 0}
                      onChange={(e) => updateFormData('orderNum', parseInt(e.target.value))}
                      min="0"
                      placeholder="Display order (0 = highest priority)"
                    />
                    <p className="field-hint">Lower numbers appear first. Use 0 for highest priority members.</p>
                  </div>
                </div>

                <div className="modern-form-section">
                  <h3 className="section-title">Status & Visibility</h3>
                  
                  <div className="form-grid">
                    <div className="modern-field-group">
                      <div className="modern-checkbox-group">
                        <label className="modern-checkbox-label">
                          <input
                            type="checkbox"
                            className="modern-checkbox"
                            checked={formData.isActive || false}
                            onChange={(e) => updateFormData('isActive', e.target.checked)}
                          />
                          <span className="checkbox-text">Active Status</span>
                          <span className="checkbox-description">Member is active and visible on the website</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="tab-content">
                <div className="modern-form-section">
                  <h3 className="section-title">Profile Image</h3>
                  <MediaUploader
                    category="team"
                    subCategory="avatars"
                    accept="image/*"
                    previewType="image"
                    label={mode === 'create' ? 'Upload Image *' : 'Upload Image'}
                    onUploaded={(r) => {
                      const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
                      updateFormData('imagePath', url);
                      setValidationState(prev => ({ ...prev, image: true }));
                    }}
                  />
                  {errors.image && <div className="modal-error">{errors.image}</div>}
                  <p className="field-hint">
                    Upload a profile image for the team member. Supported formats: JPEG, JPG, PNG, GIF, WEBP, SVG. Max size: 5MB.
                  </p>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="modal-error">
                <FaExclamationTriangle />
                {errors.submit}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modern-modal-footer">
            <div className="modal-footer-left">
              {mode === 'edit' && currentMember && (
                <button
                  type="button"
                  className="modern-btn modern-btn-danger"
                  onClick={handleDelete}
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
                className="modern-btn modern-btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                className="modern-btn modern-btn-primary"
                disabled={isLoading || !formData.name?.en || !formData.name?.ta || !formData.email || !formData.role || !formData.department}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave />
                    {mode === 'create' ? 'Create' : 'Update'}
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

export default TeamModal;
