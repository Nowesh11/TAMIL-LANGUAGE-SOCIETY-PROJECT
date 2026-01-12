import React, { useState, useEffect } from 'react';
import '../../styles/admin/modals.css';
import { FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaBell, FaPaperPlane, FaUsers, FaClock, FaCalendar, FaEnvelope, FaLink, FaImage, FaTag } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

interface BilingualText {
  en: string;
  ta: string;
}

interface Notification {
  id: string;
  title: BilingualText;
  message: BilingualText;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement' | 'event' | 'news' | 'update' | 'urgent' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'members' | 'admins' | 'specific';
  recipients?: string[];
  scheduledAt?: string;
  sendEmail: boolean;
  sendPush: boolean;
  actionUrl?: string;
  actionText?: BilingualText;
  imageUrl?: string;
  tags?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  notification?: Notification | null;
  mode?: 'create' | 'edit';
  recipients?: any[];
  templates?: any[];
  onUseTemplate?: (template: any) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  notification,
  mode = 'create',
  recipients = [],
  templates = [],
  onUseTemplate
}) => {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'content' | 'details' | 'targeting' | 'scheduling'>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validationState, setValidationState] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<Partial<Notification>>({
    title: { en: '', ta: '' },
    message: { en: '', ta: '' },
    type: 'info',
    priority: 'medium',
    targetAudience: 'all',
    recipients: [],
    scheduledAt: '',
    sendEmail: true,
    sendPush: true,
    actionUrl: '',
    actionText: { en: '', ta: '' },
    imageUrl: '',
    tags: ''
  });

  // Initialize form data
  useEffect(() => {
    if (notification && (mode === 'edit' || notification.id)) {
      setFormData({
        ...notification,
        scheduledAt: notification.scheduledAt || '',
        tags: notification.tags || ''
      });
    } else {
      setFormData({
        title: { en: '', ta: '' },
        message: { en: '', ta: '' },
        type: 'info',
        priority: 'medium',
        targetAudience: 'all',
        recipients: [],
        scheduledAt: '',
        sendEmail: true,
        sendPush: true,
        actionUrl: '',
        actionText: { en: '', ta: '' },
        imageUrl: '',
        tags: ''
      });
    }
    setErrors({});
    setValidationState({});
  }, [notification, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newValidationState: Record<string, boolean> = {};

    // Title validation
    if (!formData.title?.en?.trim()) {
      newErrors['title.en'] = 'English title is required';
      newValidationState['title.en'] = false;
    } else {
      newValidationState['title.en'] = true;
    }

    if (!formData.title?.ta?.trim()) {
      newErrors['title.ta'] = 'Tamil title is required';
      newValidationState['title.ta'] = false;
    } else {
      newValidationState['title.ta'] = true;
    }

    // Message validation
    if (!formData.message?.en?.trim()) {
      newErrors['message.en'] = 'English message is required';
      newValidationState['message.en'] = false;
    } else {
      newValidationState['message.en'] = true;
    }

    if (!formData.message?.ta?.trim()) {
      newErrors['message.ta'] = 'Tamil message is required';
      newValidationState['message.ta'] = false;
    } else {
      newValidationState['message.ta'] = true;
    }

    // Targeting validation
    if (formData.targetAudience === 'specific' && (!formData.recipients || formData.recipients.length === 0)) {
      newErrors.recipients = 'Please select at least one recipient';
      newValidationState.recipients = false;
    } else {
      newValidationState.recipients = true;
    }

    setErrors(newErrors);
    setValidationState(newValidationState);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const url = '/api/notifications';
      const method = 'POST'; // Only create is supported for now as per requirements
      
      // Transform data for API
      const payload = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        targetAudience: formData.targetAudience,
        recipients: formData.recipients,
        startAt: formData.scheduledAt || undefined,
        sendEmail: formData.sendEmail,
        actionUrl: formData.actionUrl,
        actionText: formData.actionText,
        imageUrl: formData.imageUrl,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

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
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save notification';
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        // @ts-ignore
        newData[parent] = {
          // @ts-ignore
          ...newData[parent],
          [child]: value
        };
      } else {
        // @ts-ignore
        newData[field] = value;
      }
      
      return newData;
    });

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="component-modal-overlay modern-modal-overlay">
      <div className="component-modal-container modern-modal-container">
        {/* Modal Header */}
        <div className="modern-modal-header">
          <div className="modal-title-section">
            <h2 className="modern-modal-title">
              {mode === 'create' ? 'Create Notification' : 'View Notification'}
            </h2>
            <p className="modal-subtitle">
              Send notifications to users via web and email
            </p>
          </div>
          <button onClick={onClose} className="modern-close-button" disabled={isLoading}>
            <FaTimes />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="modern-modal-tabs">
          <button
            className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <FaBell /> Content
          </button>
          <button
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FaLink /> Details
          </button>
          <button
            className={`tab-button ${activeTab === 'targeting' ? 'active' : ''}`}
            onClick={() => setActiveTab('targeting')}
          >
            <FaUsers /> Targeting
          </button>
          <button
            className={`tab-button ${activeTab === 'scheduling' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduling')}
          >
            <FaClock /> Scheduling
          </button>
        </div>

        {/* Modal Body */}
        <form className="modern-modal-form" onSubmit={handleSubmit}>
          <div className="modern-modal-body">
            
            {/* Templates Quick Select */}
            {activeTab === 'content' && templates.length > 0 && (
              <div className="form-section">
                <label className="modern-label">Quick Templates</label>
                <div className="flex gap-2 flex-wrap">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className="modern-btn modern-btn-secondary text-xs"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          title: { en: t.title, ta: t.title }, 
                          message: { en: t.message, ta: t.message },
                          type: t.type
                        }));
                      }}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Message Content</h3>
                  
                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Title (English)
                        <span className={`field-status ${validationState['title.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['title.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.en'] ? 'invalid' : ''}`}
                        value={formData.title?.en || ''}
                        onChange={(e) => handleInputChange('title.en', e.target.value)}
                        placeholder="Notification title"
                      />
                      {errors['title.en'] && <span className="error-message">{errors['title.en']}</span>}
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Title (Tamil)
                        <span className={`field-status ${validationState['title.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['title.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className={`modern-input ${errors['title.ta'] ? 'invalid' : ''}`}
                        value={formData.title?.ta || ''}
                        onChange={(e) => handleInputChange('title.ta', e.target.value)}
                        placeholder="அறிவிப்பு தலைப்பு"
                      />
                    </div>
                  </div>

                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Message (English)
                        <span className={`field-status ${validationState['message.en'] ? 'valid' : 'invalid'}`}>
                          {validationState['message.en'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag">EN</div>
                      <textarea
                        className={`modern-textarea ${errors['message.en'] ? 'invalid' : ''}`}
                        value={formData.message?.en || ''}
                        onChange={(e) => handleInputChange('message.en', e.target.value)}
                        placeholder="Notification message body"
                        rows={4}
                      />
                    </div>
                    
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label required">
                        Message (Tamil)
                        <span className={`field-status ${validationState['message.ta'] ? 'valid' : 'invalid'}`}>
                          {validationState['message.ta'] ? '✓' : '*'}
                        </span>
                      </label>
                      <div className="language-tag tamil">TA</div>
                      <textarea
                        className={`modern-textarea ${errors['message.ta'] ? 'invalid' : ''}`}
                        value={formData.message?.ta || ''}
                        onChange={(e) => handleInputChange('message.ta', e.target.value)}
                        placeholder="அறிவிப்பு செய்தி"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="modern-field-group">
                      <label className="modern-label required">Type</label>
                      <select
                        className="modern-select"
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                      >
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                        <option value="announcement">Announcement</option>
                        <option value="event">Event</option>
                        <option value="news">News</option>
                        <option value="update">Update</option>
                        <option value="urgent">Urgent</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div className="modern-field-group">
                      <label className="modern-label required">Priority</label>
                      <select
                        className="modern-select"
                        value={formData.priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab (New) */}
            {activeTab === 'details' && (
              <div className="tab-content">
                 <div className="form-section">
                  <h3 className="section-title">Additional Details</h3>
                  
                  <div className="modern-field-group">
                    <label className="modern-label"><FaLink className="mr-2"/> Action URL</label>
                    <input
                      type="url"
                      className="modern-input"
                      value={formData.actionUrl || ''}
                      onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                      placeholder="https://example.com/action"
                    />
                    <p className="field-hint">Optional link for the notification action</p>
                  </div>

                  <div className="bilingual-inputs">
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">Action Text (EN)</label>
                      <div className="language-tag">EN</div>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.actionText?.en || ''}
                        onChange={(e) => handleInputChange('actionText.en', e.target.value)}
                        placeholder="e.g. View Details"
                      />
                    </div>
                    <div className="modern-field-group bilingual-input-group">
                      <label className="modern-label">Action Text (TA)</label>
                      <div className="language-tag tamil">TA</div>
                      <input
                        type="text"
                        className="modern-input"
                        value={formData.actionText?.ta || ''}
                        onChange={(e) => handleInputChange('actionText.ta', e.target.value)}
                        placeholder="e.g. விவரங்களைப் பார்க்க"
                      />
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label"><FaImage className="mr-2"/> Image URL</label>
                    <input
                      type="url"
                      className="modern-input"
                      value={formData.imageUrl || ''}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label"><FaTag className="mr-2"/> Tags</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={formData.tags || ''}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="announcement, meeting, important (comma separated)"
                    />
                  </div>

                 </div>
              </div>
            )}

            {/* Targeting Tab */}
            {activeTab === 'targeting' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Audience Targeting</h3>
                  
                  <div className="modern-field-group">
                    <label className="modern-label required">Target Audience</label>
                    <select
                      className="modern-select"
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    >
                      <option value="all">All Users</option>
                      <option value="members">Members Only</option>
                      <option value="admins">Admins Only</option>
                      <option value="specific">Specific Users</option>
                    </select>
                  </div>

                  {formData.targetAudience === 'specific' && (
                    <div className="modern-field-group">
                      <label className="modern-label">Select Users</label>
                      <div className="modern-checkbox-group max-h-60 overflow-y-auto">
                        {recipients.map(recipient => (
                          <label key={recipient.id} className="modern-checkbox-label mb-2">
                            <input
                              type="checkbox"
                              className="modern-checkbox"
                              checked={formData.recipients?.includes(recipient.id)}
                              onChange={(e) => {
                                const newRecipients = e.target.checked
                                  ? [...(formData.recipients || []), recipient.id]
                                  : (formData.recipients || []).filter((id: string) => id !== recipient.id);
                                handleInputChange('recipients', newRecipients);
                              }}
                            />
                            <div>
                              <span className="checkbox-text">{recipient.name}</span>
                              <span className="checkbox-description">
                                {recipient.email}
                                <span className="ml-2 text-xs opacity-70 bg-gray-700 px-1 rounded">{recipient.role}</span>
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.recipients && <span className="error-message">{errors.recipients}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scheduling Tab */}
            {activeTab === 'scheduling' && (
              <div className="tab-content">
                <div className="form-section">
                  <h3 className="section-title">Delivery Settings</h3>
                  
                  <div className="modern-field-group">
                    <div className="modern-checkbox-group mb-4">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.sendEmail}
                          onChange={(e) => handleInputChange('sendEmail', e.target.checked)}
                        />
                        <div>
                          <span className="checkbox-text">Send Email</span>
                          <span className="checkbox-description">Send a copy to user's email address</span>
                        </div>
                      </label>
                    </div>
                    
                    <div className="modern-checkbox-group mb-4">
                      <label className="modern-checkbox-label">
                        <input
                          type="checkbox"
                          className="modern-checkbox"
                          checked={formData.sendPush}
                          onChange={(e) => handleInputChange('sendPush', e.target.checked)}
                        />
                        <div>
                          <span className="checkbox-text">Web Notification</span>
                          <span className="checkbox-description">Show in notification center</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">
                      <FaCalendar className="mr-2" />
                      Schedule Delivery (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      className="modern-input"
                      value={formData.scheduledAt}
                      onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                    />
                    <p className="field-hint">Leave blank to send immediately</p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div className="modern-modal-footer">
            <div className="modal-footer-left">
              {errors.submit && (
                <div className="modal-error">
                  <FaExclamationTriangle /> {errors.submit}
                </div>
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
                type="submit"
                className="modern-btn modern-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="spinner" /> Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane /> Send Notification
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

export default NotificationModal;