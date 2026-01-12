import React from 'react';
import { FaPlus, FaTrash, FaUpload, FaImage, FaLink, FaFont, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import MediaUploader from './MediaUploader';
import '../../styles/components/DynamicFormFields.css';

interface DynamicFormFieldsProps {
  componentType: string;
  formData: any;
  setFormData: (data: any) => void;
  onFileUpload: (file: File, fieldName: string, index?: number) => Promise<string>;
}

const DynamicFormFields: React.FC<DynamicFormFieldsProps> = ({
  componentType,
  formData,
  setFormData,
  onFileUpload
}) => {
  const updateContent = (field: string, value: any) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [field]: value
      }
    });
  };

  const updateBilingualContent = (field: string, lang: 'en' | 'ta', value: string) => {
    setFormData({
      ...formData,
      content: {
        ...formData.content,
        [field]: {
          en: formData.content[field]?.en || '',
          ta: formData.content[field]?.ta || '',
          [lang]: value
        }
      }
    });
  };

  const addButton = () => {
    const currentButtons = formData.content.buttons || [];
    updateContent('buttons', [
      ...currentButtons,
      {
        text: { en: '', ta: '' },
        url: '',
        style: 'primary',
        target: '_self'
      }
    ]);
  };

  const removeButton = (index: number) => {
    const currentButtons = formData.content.buttons || [];
    updateContent('buttons', currentButtons.filter((_: any, i: number) => i !== index));
  };

  const updateButton = (index: number, field: string, value: any) => {
    const currentButtons = [...(formData.content.buttons || [])];
    currentButtons[index] = {
      ...currentButtons[index],
      [field]: value
    };
    updateContent('buttons', currentButtons);
  };

  const addFeature = () => {
    const currentFeatures = formData.content.features || [];
    updateContent('features', [
      ...currentFeatures,
      {
        title: { en: '', ta: '' },
        description: { en: '', ta: '' },
        icon: ''
      }
    ]);
  };

  const removeFeature = (index: number) => {
    const currentFeatures = formData.content.features || [];
    updateContent('features', currentFeatures.filter((_: any, i: number) => i !== index));
  };

  const updateFeature = (index: number, field: string, value: any) => {
    const currentFeatures = [...(formData.content.features || [])];
    currentFeatures[index] = {
      ...currentFeatures[index],
      [field]: value
    };
    updateContent('features', currentFeatures);
  };

  const addStat = () => {
    const currentStats = formData.content.stats || [];
    updateContent('stats', [
      ...currentStats,
      {
        value: '',
        label: { en: '', ta: '' },
        suffix: ''
      }
    ]);
  };

  const removeStat = (index: number) => {
    const currentStats = formData.content.stats || [];
    updateContent('stats', currentStats.filter((_: any, i: number) => i !== index));
  };

  const updateStat = (index: number, field: string, value: any) => {
    const currentStats = [...(formData.content.stats || [])];
    currentStats[index] = {
      ...currentStats[index],
      [field]: value
    };
    updateContent('stats', currentStats);
  };

  const addFAQ = () => {
    const currentFaqs = formData.content.faqs || [];
    updateContent('faqs', [
      ...currentFaqs,
      {
        question: { en: '', ta: '' },
        answer: { en: '', ta: '' }
      }
    ]);
  };

  const removeFAQ = (index: number) => {
    const currentFaqs = formData.content.faqs || [];
    updateContent('faqs', currentFaqs.filter((_: any, i: number) => i !== index));
  };

  const updateFAQ = (index: number, field: string, value: any) => {
    const currentFaqs = [...(formData.content.faqs || [])];
    currentFaqs[index] = {
      ...currentFaqs[index],
      [field]: value
    };
    updateContent('faqs', currentFaqs);
  };

  const addGalleryImage = () => {
    const currentImages = formData.content.images || [];
    updateContent('images', [
      ...currentImages,
      {
        url: '',
        alt: { en: '', ta: '' },
        caption: { en: '', ta: '' }
      }
    ]);
  };

  const removeGalleryImage = (index: number) => {
    const currentImages = formData.content.images || [];
    updateContent('images', currentImages.filter((_: any, i: number) => i !== index));
  };

  const updateGalleryImage = (index: number, field: string, value: any) => {
    const currentImages = [...(formData.content.images || [])];
    currentImages[index] = {
      ...currentImages[index],
      [field]: value
    };
    updateContent('images', currentImages);
  };

  const addTimelineEvent = () => {
    const currentEvents = formData.content.events || [];
    updateContent('events', [
      ...currentEvents,
      {
        date: '',
        title: { en: '', ta: '' },
        description: { en: '', ta: '' },
        image: ''
      }
    ]);
  };

  const removeTimelineEvent = (index: number) => {
    const currentEvents = formData.content.events || [];
    updateContent('events', currentEvents.filter((_: any, i: number) => i !== index));
  };

  const updateTimelineEvent = (index: number, field: string, value: any) => {
    const currentEvents = [...(formData.content.events || [])];
    currentEvents[index] = {
      ...currentEvents[index],
      [field]: value
    };
    updateContent('events', currentEvents);
  };

  const addTestimonial = () => {
    const currentTestimonials = formData.content.testimonials || [];
    updateContent('testimonials', [
      ...currentTestimonials,
      {
        name: '',
        position: '',
        company: '',
        rating: 5,
        text: { en: '', ta: '' },
        avatar: ''
      }
    ]);
  };

  const removeTestimonial = (index: number) => {
    const currentTestimonials = formData.content.testimonials || [];
    updateContent('testimonials', currentTestimonials.filter((_: any, i: number) => i !== index));
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const currentTestimonials = [...(formData.content.testimonials || [])];
    currentTestimonials[index] = {
      ...currentTestimonials[index],
      [field]: value
    };
    updateContent('testimonials', currentTestimonials);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, index?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await onFileUpload(file, fieldName, index);
        if (index !== undefined) {
          if (fieldName.includes('gallery')) {
            updateGalleryImage(index, 'url', url);
          } else if (fieldName.includes('timeline')) {
            updateTimelineEvent(index, 'image', url);
          } else if (fieldName.includes('testimonial')) {
            updateTestimonial(index, 'avatar', url);
          }
        } else {
          updateContent(fieldName, url);
        }
      } catch (error) {
        console.error('File upload failed:', error);
      }
    }
  };

  const renderBilingualInput = (
    field: string,
    label: string,
    type: 'input' | 'textarea' = 'input',
    placeholder?: { en: string; ta: string }
  ) => (
    <div className="modern-field-group">
      <label className="modern-label">{label}</label>
      <div className="bilingual-inputs">
        <div className="bilingual-input-group">
          <span className="language-tag">EN</span>
          {type === 'textarea' ? (
            <textarea
              className="modern-textarea"
              value={formData.content[field]?.en || ''}
              onChange={(e) => updateBilingualContent(field, 'en', e.target.value)}
              placeholder={placeholder?.en || `Enter ${label.toLowerCase()} in English`}
            />
          ) : (
            <input
              type="text"
              className="modern-input"
              value={formData.content[field]?.en || ''}
              onChange={(e) => updateBilingualContent(field, 'en', e.target.value)}
              placeholder={placeholder?.en || `Enter ${label.toLowerCase()} in English`}
            />
          )}
        </div>
        <div className="bilingual-input-group">
          <span className="language-tag tamil">TA</span>
          {type === 'textarea' ? (
            <textarea
              className="modern-textarea"
              value={formData.content[field]?.ta || ''}
              onChange={(e) => updateBilingualContent(field, 'ta', e.target.value)}
              placeholder={placeholder?.ta || `Enter ${label.toLowerCase()} in Tamil`}
            />
          ) : (
            <input
              type="text"
              className="modern-input"
              value={formData.content[field]?.ta || ''}
              onChange={(e) => updateBilingualContent(field, 'ta', e.target.value)}
              placeholder={placeholder?.ta || `Enter ${label.toLowerCase()} in Tamil`}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderImageUpload = (field: string, label: string, currentValue?: string) => (
    <div className="modern-field-group">
      <MediaUploader
        category="components"
        subCategory={componentType}
        accept="image/*"
        previewType="image"
        label={label}
        onUploaded={(r) => {
          const url = r.url || (r.filePath ? `/api/files/serve?path=${encodeURIComponent(r.filePath)}` : '');
          updateContent(field, url);
        }}
        initialUrl={currentValue}
      />
    </div>
  );

  const renderColorInput = (field: string, label: string) => (
    <div className="modern-field-group">
      <label className="modern-label">{label}</label>
      <input
        type="color"
        className="modern-color-input"
        value={formData.content[field] || '#000000'}
        onChange={(e) => updateContent(field, e.target.value)}
      />
    </div>
  );

  const renderButtons = () => (
    <div className="modern-field-group">
      <label className="modern-label">Call-to-Action Buttons</label>
      <div className="buttons-list">
        {(formData.content.buttons || []).map((button: any, index: number) => (
          <div key={index} className="button-item">
            <div className="bilingual-inputs">
              <div className="bilingual-input-group">
                <span className="language-tag">EN</span>
                <input
                  type="text"
                  className="modern-input"
                  value={button.text?.en || ''}
                  onChange={(e) => updateButton(index, 'text', { ...button.text, en: e.target.value })}
                  placeholder="Button text in English"
                />
              </div>
              <div className="bilingual-input-group">
                <span className="language-tag tamil">TA</span>
                <input
                  type="text"
                  className="modern-input"
                  value={button.text?.ta || ''}
                  onChange={(e) => updateButton(index, 'text', { ...button.text, ta: e.target.value })}
                  placeholder="Button text in Tamil"
                />
              </div>
            </div>
            <input
              type="url"
              className="modern-input"
              value={button.url || ''}
              onChange={(e) => updateButton(index, 'url', e.target.value)}
              placeholder="Button URL"
            />
            <select
              className="modern-select"
              value={button.style || 'primary'}
              onChange={(e) => updateButton(index, 'style', e.target.value)}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
            <button
              type="button"
              className="delete-button"
              onClick={() => removeButton(index)}
            >
              <FaTrash />
            </button>
          </div>
        ))}
        <button type="button" className="add-button" onClick={addButton}>
          <FaPlus /> Add Button
        </button>
      </div>
    </div>
  );

  // Component-specific field rendering
  switch (componentType) {
    case 'hero':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Hero Title')}
          {renderBilingualInput('subtitle', 'Hero Subtitle', 'textarea')}
          {renderImageUpload('backgroundImage', 'Background Image', formData.content.backgroundImage)}
          
          <div className="modern-field-group">
            <label className="modern-label">Background Video URL</label>
            <input
              type="url"
              className="modern-input"
              value={formData.content.backgroundVideoUrl || ''}
              onChange={(e) => updateContent('backgroundVideoUrl', e.target.value)}
              placeholder="https://example.com/video.mp4"
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Overlay Settings</label>
            <div className="modern-field-group">
              <label className="modern-label">Overlay Color</label>
              <input
                type="color"
                className="modern-input"
                value={formData.content.overlayColor || '#000000'}
                onChange={(e) => updateContent('overlayColor', e.target.value)}
              />
            </div>
            <div className="modern-field-group">
              <label className="modern-label">Overlay Opacity</label>
              <input
                type="range"
                className="modern-input"
                min="0"
                max="100"
                value={formData.content.overlayOpacity || 50}
                onChange={(e) => updateContent('overlayOpacity', parseInt(e.target.value))}
              />
              <span className="range-value">{formData.content.overlayOpacity || 50}%</span>
            </div>
          </div>

          {renderImageUpload('image', 'Hero Image', formData.content.image)}
          {renderButtons()}
          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          
          <div className="modern-field-group">
            <label className="modern-label">Content Alignment</label>
            <select
              className="modern-select"
              value={formData.content.contentAlignment || 'center'}
              onChange={(e) => updateContent('contentAlignment', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          
          <div className="modern-field-group">
            <label className="modern-label">Text Alignment</label>
            <select
              className="modern-select"
              value={formData.content.textAlign || 'center'}
              onChange={(e) => updateContent('textAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Height</label>
            <select
              className="modern-select"
              value={formData.content.height || 'medium'}
              onChange={(e) => updateContent('height', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="fullscreen">Full Screen</option>
            </select>
          </div>
        </div>
      );

    case 'banner':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Banner Title')}
          {renderBilingualInput('subtitle', 'Banner Subtitle')}
          {renderImageUpload('backgroundImage', 'Background Image', formData.content.backgroundImage)}
          {renderButtons()}
          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          <div className="modern-field-group">
            <label className="modern-label">Banner Type</label>
            <select
              className="modern-select"
              value={formData.content.type || 'info'}
              onChange={(e) => updateContent('type', e.target.value)}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Section Title')}
          {renderBilingualInput('content', 'Text Content', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Text Size</label>
            <select
              className="modern-select"
              value={formData.content.size || 'medium'}
              onChange={(e) => updateContent('size', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Text Alignment</label>
            <select
              className="modern-select"
              value={formData.content.textAlign || 'left'}
              onChange={(e) => updateContent('textAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
          {renderColorInput('textColor', 'Text Color')}
          {renderColorInput('backgroundColor', 'Background Color')}
        </div>
      );

    case 'image':
      return (
        <div className="content-fields">
          <div className="modern-field-group">
            <label className="modern-label">Image</label>
            <div className="modern-image-upload-section">
              <div className="modern-image-upload-area">
                {formData.content.image?.src ? (
                  <div className="image-preview">
                    <img 
                      src={formData.content.image.src} 
                      alt="Image preview" 
                      className="preview-image"
                    />
                    <div className="image-overlay">
                      <button
                        type="button"
                        onClick={() => {
                          // Clear the image
                          const updatedContent = { ...formData.content };
                          if (updatedContent.image) {
                            updatedContent.image.src = '';
                          }
                          setFormData({ ...formData, content: updatedContent });
                        }}
                        className="remove-image-btn"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <FaUpload style={{ fontSize: '2rem', color: '#6b7280', marginBottom: '0.5rem' }} />
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                      Click to upload image
                    </p>
                    <p style={{ margin: '0', fontSize: '0.875rem', color: '#6b7280' }}>
                      Supports JPG, PNG, GIF up to 5MB
                    </p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onFileUpload(file, 'image.src').then((url) => {
                        const updatedContent = { ...formData.content };
                        if (!updatedContent.image) {
                          updatedContent.image = { src: '', alt: { en: '', ta: '' } };
                        }
                        updatedContent.image.src = url;
                        setFormData({ ...formData, content: updatedContent });
                      }).catch((error) => {
                        console.error('File upload failed:', error);
                      });
                    }
                  }}
                  className="file-input"
                  id="upload-image"
                />
              </div>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Alt Text</label>
            <div className="bilingual-inputs">
              <div className="bilingual-input-group">
                <span className="language-tag">EN</span>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.content.image?.alt?.en || ''}
                  onChange={(e) => {
                    const updatedContent = { ...formData.content };
                    if (!updatedContent.image) {
                      updatedContent.image = { src: '', alt: { en: '', ta: '' } };
                    }
                    if (!updatedContent.image.alt) {
                      updatedContent.image.alt = { en: '', ta: '' };
                    }
                    updatedContent.image.alt.en = e.target.value;
                    setFormData({ ...formData, content: updatedContent });
                  }}
                  placeholder="Enter alt text in English"
                />
              </div>
              <div className="bilingual-input-group">
                <span className="language-tag tamil">TA</span>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.content.image?.alt?.ta || ''}
                  onChange={(e) => {
                    const updatedContent = { ...formData.content };
                    if (!updatedContent.image) {
                      updatedContent.image = { src: '', alt: { en: '', ta: '' } };
                    }
                    if (!updatedContent.image.alt) {
                      updatedContent.image.alt = { en: '', ta: '' };
                    }
                    updatedContent.image.alt.ta = e.target.value;
                    setFormData({ ...formData, content: updatedContent });
                  }}
                  placeholder="Enter alt text in Tamil"
                />
              </div>
            </div>
          </div>
          {renderBilingualInput('caption', 'Caption')}
          <div className="modern-field-group">
            <label className="modern-label">Aspect Ratio</label>
            <select
              className="modern-select"
              value={formData.content.aspectRatio || 'auto'}
              onChange={(e) => updateContent('aspectRatio', e.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Object Fit</label>
            <select
              className="modern-select"
              value={formData.content.objectFit || 'cover'}
              onChange={(e) => updateContent('objectFit', e.target.value)}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Border Radius</label>
            <input
              type="number"
              className="modern-input"
              value={formData.content.borderRadius || 0}
              onChange={(e) => updateContent('borderRadius', parseInt(e.target.value))}
              placeholder="Border radius in pixels"
              min="0"
            />
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Gallery Title')}
          {renderBilingualInput('description', 'Gallery Description', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Gallery Images</label>
            <div className="buttons-list">
              {(formData.content.images || []).map((image: any, index: number) => (
                <div key={index} className="button-item">
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'gallery', index)}
                      className="hidden"
                      id={`gallery-upload-${index}`}
                    />
                    <label htmlFor={`gallery-upload-${index}`} className="upload-button">
                      <FaImage /> Choose Image
                    </label>
                    {image.url && (
                      <div className="image-preview">
                        <img src={image.url} alt={`Gallery ${index + 1}`} />
                      </div>
                    )}
                  </div>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={image.alt?.en || ''}
                        onChange={(e) => updateGalleryImage(index, 'alt', { ...image.alt, en: e.target.value })}
                        placeholder="Alt text in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={image.alt?.ta || ''}
                        onChange={(e) => updateGalleryImage(index, 'alt', { ...image.alt, ta: e.target.value })}
                        placeholder="Alt text in Tamil"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeGalleryImage(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addGalleryImage}>
                <FaPlus /> Add Image
              </button>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Gallery Layout</label>
            <select
              className="modern-select"
              value={formData.content.layout || 'grid'}
              onChange={(e) => updateContent('layout', e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="masonry">Masonry</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Columns</label>
            <select
              className="modern-select"
              value={formData.content.columns || 3}
              onChange={(e) => updateContent('columns', parseInt(e.target.value))}
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
              <option value={5}>5 Columns</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Gallery Options</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showThumbnails || false}
                  onChange={(e) => updateContent('showThumbnails', e.target.checked)}
                />
                Show Thumbnails
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.enableAutoplay || false}
                  onChange={(e) => updateContent('enableAutoplay', e.target.checked)}
                />
                Enable Autoplay
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.enableLightbox || false}
                  onChange={(e) => updateContent('enableLightbox', e.target.checked)}
                />
                Enable Lightbox
              </label>
            </div>
          </div>

          {formData.content.enableAutoplay && (
            <div className="modern-field-group">
              <label className="modern-label">Autoplay Delay (seconds)</label>
              <input
                type="number"
                className="modern-input"
                min="1"
                max="10"
                value={formData.content.autoplayDelay || 3}
                onChange={(e) => updateContent('autoplayDelay', parseInt(e.target.value))}
              />
            </div>
          )}

          <div className="modern-field-group">
            <label className="modern-label">Image Aspect Ratio</label>
            <select
              className="modern-select"
              value={formData.content.aspectRatio || 'auto'}
              onChange={(e) => updateContent('aspectRatio', e.target.value)}
            >
              <option value="auto">Auto</option>
              <option value="1:1">Square (1:1)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="16:9">Widescreen (16:9)</option>
              <option value="3:2">Photo (3:2)</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Gap Between Images</label>
            <select
              className="modern-select"
              value={formData.content.gap || 'medium'}
              onChange={(e) => updateContent('gap', e.target.value)}
            >
              <option value="none">No Gap</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Features Section Title')}
          {renderBilingualInput('subtitle', 'Features Section Subtitle', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Features</label>
            <div className="buttons-list">
              {(formData.content.features || []).map((feature: any, index: number) => (
                <div key={index} className="button-item">
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={feature.title?.en || ''}
                        onChange={(e) => updateFeature(index, 'title', { ...feature.title, en: e.target.value })}
                        placeholder="Feature title in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={feature.title?.ta || ''}
                        onChange={(e) => updateFeature(index, 'title', { ...feature.title, ta: e.target.value })}
                        placeholder="Feature title in Tamil"
                      />
                    </div>
                  </div>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <textarea
                        className="modern-textarea"
                        value={feature.description?.en || ''}
                        onChange={(e) => updateFeature(index, 'description', { ...feature.description, en: e.target.value })}
                        placeholder="Feature description in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <textarea
                        className="modern-textarea"
                        value={feature.description?.ta || ''}
                        onChange={(e) => updateFeature(index, 'description', { ...feature.description, ta: e.target.value })}
                        placeholder="Feature description in Tamil"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="modern-input"
                    value={feature.icon || ''}
                    onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                    placeholder="Icon class (e.g., fas fa-star)"
                  />
                  
                  <div className="modern-field-group">
                    <label className="modern-label">Feature Image</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'feature', index)}
                        className="hidden"
                        id={`feature-upload-${index}`}
                      />
                      <label htmlFor={`feature-upload-${index}`} className="upload-button">
                        <FaImage /> Choose Image
                      </label>
                      {feature.image && (
                        <div className="image-preview">
                          <img src={feature.image} alt={`Feature ${index + 1}`} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modern-field-group">
                    <label className="modern-label">Feature Color</label>
                    <input
                      type="color"
                      className="modern-input"
                      value={feature.color || '#007bff'}
                      onChange={(e) => updateFeature(index, 'color', e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeFeature(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addFeature}>
                <FaPlus /> Add Feature
              </button>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Layout</label>
            <select
              className="modern-select"
              value={formData.content.layout || 'grid'}
              onChange={(e) => updateContent('layout', e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="cards">Cards</option>
            </select>
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Stats Section Title')}
          <div className="modern-field-group">
            <label className="modern-label">Statistics</label>
            <div className="buttons-list">
              {(formData.content.stats || []).map((stat: any, index: number) => (
                <div key={index} className="button-item">
                  <input
                    type="text"
                    className="modern-input"
                    value={stat.value || ''}
                    onChange={(e) => updateStat(index, 'value', e.target.value)}
                    placeholder="Statistic value (e.g., 100, 50K)"
                  />
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={stat.label?.en || ''}
                        onChange={(e) => updateStat(index, 'label', { ...stat.label, en: e.target.value })}
                        placeholder="Label in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={stat.label?.ta || ''}
                        onChange={(e) => updateStat(index, 'label', { ...stat.label, ta: e.target.value })}
                        placeholder="Label in Tamil"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    className="modern-input"
                    value={stat.suffix || ''}
                    onChange={(e) => updateStat(index, 'suffix', e.target.value)}
                    placeholder="Suffix (e.g., +, %, K)"
                  />
                  <input
                    type="text"
                    className="modern-input"
                    value={stat.icon || ''}
                    onChange={(e) => updateStat(index, 'icon', e.target.value)}
                    placeholder="Icon class (e.g., fas fa-users)"
                  />
                  <div className="modern-field-group">
                    <label className="modern-label">Stat Color</label>
                    <input
                      type="color"
                      className="modern-input"
                      value={stat.color || '#007bff'}
                      onChange={(e) => updateStat(index, 'color', e.target.value)}
                    />
                  </div>
                  <div className="modern-field-group">
                    <label className="modern-label">Animation Type</label>
                    <select
                      className="modern-select"
                      value={stat.animation || 'none'}
                      onChange={(e) => updateStat(index, 'animation', e.target.value)}
                    >
                      <option value="none">No Animation</option>
                      <option value="countUp">Count Up</option>
                      <option value="fadeIn">Fade In</option>
                      <option value="slideUp">Slide Up</option>
                      <option value="bounce">Bounce</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeStat(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addStat}>
                <FaPlus /> Add Statistic
              </button>
            </div>
          </div>
          
          <div className="modern-field-group">
            <label className="modern-label">Stats Layout</label>
            <select
              className="modern-select"
              value={formData.content.layout || 'horizontal'}
              onChange={(e) => updateContent('layout', e.target.value)}
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="grid">Grid</option>
              <option value="circular">Circular</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Columns (for grid layout)</label>
            <select
              className="modern-select"
              value={formData.content.columns || 2}
              onChange={(e) => updateContent('columns', parseInt(e.target.value))}
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>

          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
        </div>
      );

    case 'cta':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'CTA Title')}
          {renderBilingualInput('subtitle', 'CTA Subtitle', 'textarea')}
          {renderImageUpload('backgroundImage', 'Background Image', formData.content.backgroundImage)}
          {renderButtons()}
          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          <div className="modern-field-group">
            <label className="modern-label">CTA Style</label>
            <select
              className="modern-select"
              value={formData.content.style || 'default'}
              onChange={(e) => updateContent('style', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="gradient">Gradient</option>
              <option value="minimal">Minimal</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'FAQ Section Title')}
          {renderBilingualInput('subtitle', 'FAQ Section Subtitle', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Frequently Asked Questions</label>
            <div className="buttons-list">
              {(formData.content.faqs || []).map((faq: any, index: number) => (
                <div key={index} className="button-item">
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={faq.question?.en || ''}
                        onChange={(e) => updateFAQ(index, 'question', { ...faq.question, en: e.target.value })}
                        placeholder="Question in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={faq.question?.ta || ''}
                        onChange={(e) => updateFAQ(index, 'question', { ...faq.question, ta: e.target.value })}
                        placeholder="Question in Tamil"
                      />
                    </div>
                  </div>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <textarea
                        className="modern-textarea"
                        value={faq.answer?.en || ''}
                        onChange={(e) => updateFAQ(index, 'answer', { ...faq.answer, en: e.target.value })}
                        placeholder="Answer in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <textarea
                        className="modern-textarea"
                        value={faq.answer?.ta || ''}
                        onChange={(e) => updateFAQ(index, 'answer', { ...faq.answer, ta: e.target.value })}
                        placeholder="Answer in Tamil"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeFAQ(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addFAQ}>
                <FaPlus /> Add FAQ
              </button>
            </div>
          </div>
        </div>
      );

    case 'timeline':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Timeline Title')}
          {renderBilingualInput('description', 'Timeline Description', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Timeline Events</label>
            <div className="buttons-list">
              {(formData.content.events || []).map((event: any, index: number) => (
                <div key={index} className="button-item">
                  <input
                    type="date"
                    className="modern-input"
                    value={event.date || ''}
                    onChange={(e) => updateTimelineEvent(index, 'date', e.target.value)}
                  />
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={event.title?.en || ''}
                        onChange={(e) => updateTimelineEvent(index, 'title', { ...event.title, en: e.target.value })}
                        placeholder="Event title in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <input
                        type="text"
                        className="modern-input"
                        value={event.title?.ta || ''}
                        onChange={(e) => updateTimelineEvent(index, 'title', { ...event.title, ta: e.target.value })}
                        placeholder="Event title in Tamil"
                      />
                    </div>
                  </div>
                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <textarea
                        className="modern-textarea"
                        value={event.description?.en || ''}
                        onChange={(e) => updateTimelineEvent(index, 'description', { ...event.description, en: e.target.value })}
                        placeholder="Event description in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <textarea
                        className="modern-textarea"
                        value={event.description?.ta || ''}
                        onChange={(e) => updateTimelineEvent(index, 'description', { ...event.description, ta: e.target.value })}
                        placeholder="Event description in Tamil"
                      />
                    </div>
                  </div>
                  <div className="image-upload-container">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'timeline', index)}
                      className="hidden"
                      id={`timeline-upload-${index}`}
                    />
                    <label htmlFor={`timeline-upload-${index}`} className="upload-button">
                      <FaImage /> Choose Image
                    </label>
                    {event.image && (
                      <div className="image-preview">
                        <img src={event.image} alt={`Event ${index + 1}`} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeTimelineEvent(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addTimelineEvent}>
                <FaPlus /> Add Event
              </button>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Timeline Orientation</label>
            <select
              className="modern-select"
              value={formData.content.orientation || 'vertical'}
              onChange={(e) => updateContent('orientation', e.target.value)}
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Testimonials Section Title')}
          {renderBilingualInput('subtitle', 'Testimonials Section Subtitle', 'textarea')}
          
          <div className="modern-field-group">
            <label className="modern-label">Testimonials</label>
            <div className="buttons-list">
              {(formData.content.testimonials || []).map((testimonial: any, index: number) => (
                <div key={index} className="button-item">
                  <div className="modern-field-group">
                    <label className="modern-label">Avatar</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'testimonial', index)}
                        className="hidden"
                        id={`testimonial-avatar-${index}`}
                      />
                      <label htmlFor={`testimonial-avatar-${index}`} className="upload-button">
                        <FaImage /> Choose Avatar
                      </label>
                      {testimonial.avatar && (
                        <div className="image-preview">
                          <img src={testimonial.avatar} alt={`${testimonial.name} avatar`} />
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    className="modern-input"
                    value={testimonial.name || ''}
                    onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                    placeholder="Person's name"
                  />

                  <input
                    type="text"
                    className="modern-input"
                    value={testimonial.position || ''}
                    onChange={(e) => updateTestimonial(index, 'position', e.target.value)}
                    placeholder="Position/Title"
                  />

                  <input
                    type="text"
                    className="modern-input"
                    value={testimonial.company || ''}
                    onChange={(e) => updateTestimonial(index, 'company', e.target.value)}
                    placeholder="Company name"
                  />

                  <div className="modern-field-group">
                    <label className="modern-label">Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="modern-input"
                      value={testimonial.rating || 5}
                      onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="bilingual-inputs">
                    <div className="bilingual-input-group">
                      <span className="language-tag">EN</span>
                      <textarea
                        className="modern-textarea"
                        value={testimonial.text?.en || ''}
                        onChange={(e) => updateTestimonial(index, 'text', { ...testimonial.text, en: e.target.value })}
                        placeholder="Testimonial text in English"
                      />
                    </div>
                    <div className="bilingual-input-group">
                      <span className="language-tag tamil">TA</span>
                      <textarea
                        className="modern-textarea"
                        value={testimonial.text?.ta || ''}
                        onChange={(e) => updateTestimonial(index, 'text', { ...testimonial.text, ta: e.target.value })}
                        placeholder="Testimonial text in Tamil"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => removeTestimonial(index)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button type="button" className="add-button" onClick={addTestimonial}>
                <FaPlus /> Add Testimonial
              </button>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Layout</label>
            <select
              className="modern-select"
              value={formData.content.layout || 'grid'}
              onChange={(e) => updateContent('layout', e.target.value)}
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="masonry">Masonry</option>
              <option value="slider">Slider</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Columns (for grid layout)</label>
            <select
              className="modern-select"
              value={formData.content.columns || '3'}
              onChange={(e) => updateContent('columns', e.target.value)}
            >
              <option value="1">1 Column</option>
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Show Ratings</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.content.showRatings || false}
                onChange={(e) => updateContent('showRatings', e.target.checked)}
              />
              <span className="toggle-label">Display star ratings</span>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Enable Autoplay (for carousel/slider)</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.content.autoplay || false}
                onChange={(e) => updateContent('autoplay', e.target.checked)}
              />
              <span className="toggle-label">Auto-rotate testimonials</span>
            </div>
          </div>

          {formData.content.autoplay && (
            <div className="modern-field-group">
              <label className="modern-label">Autoplay Delay (seconds)</label>
              <input
                type="number"
                min="1"
                max="10"
                className="modern-input"
                value={formData.content.autoplayDelay || 5}
                onChange={(e) => updateContent('autoplayDelay', parseInt(e.target.value))}
              />
            </div>
          )}
        </div>
      );

    case 'contact-form':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Contact Form Title')}
          {renderBilingualInput('subtitle', 'Contact Form Subtitle', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Form Fields</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.fields?.name || true}
                  onChange={(e) => updateContent('fields', { ...formData.content.fields, name: e.target.checked })}
                />
                Name Field
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.fields?.email || true}
                  onChange={(e) => updateContent('fields', { ...formData.content.fields, email: e.target.checked })}
                />
                Email Field
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.fields?.phone || false}
                  onChange={(e) => updateContent('fields', { ...formData.content.fields, phone: e.target.checked })}
                />
                Phone Field
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.fields?.subject || true}
                  onChange={(e) => updateContent('fields', { ...formData.content.fields, subject: e.target.checked })}
                />
                Subject Field
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.fields?.message || true}
                  onChange={(e) => updateContent('fields', { ...formData.content.fields, message: e.target.checked })}
                />
                Message Field
              </label>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Submit Button Text</label>
            <div className="bilingual-inputs">
              <div className="bilingual-input-group">
                <span className="language-tag">EN</span>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.content.submitText?.en || 'Send Message'}
                  onChange={(e) => updateBilingualContent('submitText', 'en', e.target.value)}
                  placeholder="Submit button text in English"
                />
              </div>
              <div className="bilingual-input-group">
                <span className="language-tag tamil">TA</span>
                <input
                  type="text"
                  className="modern-input"
                  value={formData.content.submitText?.ta || 'செய்தி அனுப்பு'}
                  onChange={(e) => updateBilingualContent('submitText', 'ta', e.target.value)}
                  placeholder="Submit button text in Tamil"
                />
              </div>
            </div>
          </div>
        </div>
      );

    case 'newsletter':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Newsletter Title')}
          {renderBilingualInput('description', 'Newsletter Description', 'textarea')}
          {renderBilingualInput('placeholder', 'Email Placeholder')}
          {renderBilingualInput('buttonText', 'Subscribe Button Text')}
          {renderImageUpload('backgroundImage', 'Background Image', formData.content.backgroundImage)}
          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          <div className="modern-field-group">
            <label className="modern-label">Newsletter Style</label>
            <select
              className="modern-select"
              value={formData.content.style || 'default'}
              onChange={(e) => updateContent('style', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="card">Card</option>
              <option value="inline">Inline</option>
            </select>
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Video Title')}
          {renderBilingualInput('description', 'Video Description', 'textarea')}
          <div className="modern-field-group">
            <label className="modern-label">Video URL</label>
            <input
              type="url"
              className="modern-input"
              value={formData.content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              placeholder="YouTube, Vimeo, or direct video URL"
            />
          </div>
          {renderImageUpload('thumbnail', 'Video Thumbnail', formData.content.thumbnail)}
          <div className="modern-field-group">
            <label className="modern-label">Video Controls</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.autoplay || false}
                  onChange={(e) => updateContent('autoplay', e.target.checked)}
                />
                Autoplay
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.muted || false}
                  onChange={(e) => updateContent('muted', e.target.checked)}
                />
                Muted
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.loop || false}
                  onChange={(e) => updateContent('loop', e.target.checked)}
                />
                Loop
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.controls !== false}
                  onChange={(e) => updateContent('controls', e.target.checked)}
                />
                Show Controls
              </label>
            </div>
          </div>
          <div className="modern-field-group">
            <label className="modern-label">Aspect Ratio</label>
            <select
              className="modern-select"
              value={formData.content.aspectRatio || '16:9'}
              onChange={(e) => updateContent('aspectRatio', e.target.value)}
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="21:9">21:9 (Ultrawide)</option>
            </select>
          </div>
        </div>
      );

    case 'navbar':
      return (
        <div className="content-fields">
          {renderImageUpload('logo', 'Logo Image', formData.content.logo)}
          {renderBilingualInput('logoText', 'Logo Text')}
          <div className="modern-field-group">
            <label className="modern-label">Logo URL</label>
            <input
              type="url"
              className="modern-input"
              value={formData.content.logoUrl || ''}
              onChange={(e) => updateContent('logoUrl', e.target.value)}
              placeholder="Logo link URL"
            />
          </div>
          
          <div className="modern-field-group">
            <label className="modern-label">Menu Items</label>
            <div className="array-field">
              {(formData.content.menuItems || []).map((item: any, index: number) => (
                <div key={index} className="array-item">
                  <div className="bilingual-input-group">
                    <div className="language-input">
                      <label>English</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={item.text?.en || ''}
                        onChange={(e) => {
                          const newItems = [...(formData.content.menuItems || [])];
                          newItems[index] = {
                            ...newItems[index],
                            text: { ...newItems[index].text, en: e.target.value }
                          };
                          updateContent('menuItems', newItems);
                        }}
                        placeholder="Menu item text in English"
                      />
                    </div>
                    <div className="language-input">
                      <label>Tamil</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={item.text?.ta || ''}
                        onChange={(e) => {
                          const newItems = [...(formData.content.menuItems || [])];
                          newItems[index] = {
                            ...newItems[index],
                            text: { ...newItems[index].text, ta: e.target.value }
                          };
                          updateContent('menuItems', newItems);
                        }}
                        placeholder="Menu item text in Tamil"
                      />
                    </div>
                  </div>
                  <div className="modern-field-group">
                    <label>URL</label>
                    <input
                      type="url"
                      className="modern-input"
                      value={item.url || ''}
                      onChange={(e) => {
                        const newItems = [...(formData.content.menuItems || [])];
                        newItems[index] = { ...newItems[index], url: e.target.value };
                        updateContent('menuItems', newItems);
                      }}
                      placeholder="Menu item URL"
                    />
                  </div>
                  <div className="modern-field-group">
                    <label>Target</label>
                    <select
                      className="modern-select"
                      value={item.target || '_self'}
                      onChange={(e) => {
                        const newItems = [...(formData.content.menuItems || [])];
                        newItems[index] = { ...newItems[index], target: e.target.value };
                        updateContent('menuItems', newItems);
                      }}
                    >
                      <option value="_self">Same Window</option>
                      <option value="_blank">New Window</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => {
                      const newItems = formData.content.menuItems.filter((_: any, i: number) => i !== index);
                      updateContent('menuItems', newItems);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={() => {
                  const currentItems = formData.content.menuItems || [];
                  updateContent('menuItems', [
                    ...currentItems,
                    { text: { en: '', ta: '' }, url: '', target: '_self' }
                  ]);
                }}
              >
                <FaPlus /> Add Menu Item
              </button>
            </div>
          </div>

          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          {renderColorInput('hoverColor', 'Hover Color')}
          
          <div className="modern-field-group">
            <label className="modern-label">Navbar Style</label>
            <select
              className="modern-select"
              value={formData.content.style || 'default'}
              onChange={(e) => updateContent('style', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="transparent">Transparent</option>
              <option value="fixed">Fixed Top</option>
              <option value="sticky">Sticky</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Mobile Menu</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showMobileMenu !== false}
                  onChange={(e) => updateContent('showMobileMenu', e.target.checked)}
                />
                Show Mobile Menu
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showSearch || false}
                  onChange={(e) => updateContent('showSearch', e.target.checked)}
                />
                Show Search
              </label>
            </div>
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="content-fields">
          {renderImageUpload('logo', 'Footer Logo', formData.content.logo)}
          {renderBilingualInput('logoText', 'Logo Text')}
          {renderBilingualInput('description', 'Footer Description', 'textarea')}
          
          <div className="modern-field-group">
            <label className="modern-label">Social Media Links</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="modern-field-group">
                <label>Facebook URL</label>
                <input
                  type="url"
                  className="modern-input"
                  value={formData.content.socialLinks?.facebookUrl || ''}
                  onChange={(e) => {
                    const currentSocialLinks = formData.content.socialLinks || {};
                    updateContent('socialLinks', {
                      ...currentSocialLinks,
                      facebookUrl: e.target.value
                    });
                  }}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="modern-field-group">
                <label>Twitter URL</label>
                <input
                  type="url"
                  className="modern-input"
                  value={formData.content.socialLinks?.twitterUrl || ''}
                  onChange={(e) => {
                    const currentSocialLinks = formData.content.socialLinks || {};
                    updateContent('socialLinks', {
                      ...currentSocialLinks,
                      twitterUrl: e.target.value
                    });
                  }}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="modern-field-group">
                <label>Instagram URL</label>
                <input
                  type="url"
                  className="modern-input"
                  value={formData.content.socialLinks?.instagramUrl || ''}
                  onChange={(e) => {
                    const currentSocialLinks = formData.content.socialLinks || {};
                    updateContent('socialLinks', {
                      ...currentSocialLinks,
                      instagramUrl: e.target.value
                    });
                  }}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="modern-field-group">
                <label>YouTube URL</label>
                <input
                  type="url"
                  className="modern-input"
                  value={formData.content.socialLinks?.youtubeUrl || ''}
                  onChange={(e) => {
                    const currentSocialLinks = formData.content.socialLinks || {};
                    updateContent('socialLinks', {
                      ...currentSocialLinks,
                      youtubeUrl: e.target.value
                    });
                  }}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Footer Links</label>
            <div className="array-field">
              {(formData.content.footerLinks || []).map((link: any, index: number) => (
                <div key={index} className="array-item">
                  <div className="bilingual-input-group">
                    <div className="language-input">
                      <label>English</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={link.text?.en || ''}
                        onChange={(e) => {
                          const newLinks = [...(formData.content.footerLinks || [])];
                          newLinks[index] = {
                            ...newLinks[index],
                            text: { ...newLinks[index].text, en: e.target.value }
                          };
                          updateContent('footerLinks', newLinks);
                        }}
                        placeholder="Link text in English"
                      />
                    </div>
                    <div className="language-input">
                      <label>Tamil</label>
                      <input
                        type="text"
                        className="modern-input"
                        value={link.text?.ta || ''}
                        onChange={(e) => {
                          const newLinks = [...(formData.content.footerLinks || [])];
                          newLinks[index] = {
                            ...newLinks[index],
                            text: { ...newLinks[index].text, ta: e.target.value }
                          };
                          updateContent('footerLinks', newLinks);
                        }}
                        placeholder="Link text in Tamil"
                      />
                    </div>
                  </div>
                  <div className="modern-field-group">
                    <label>URL</label>
                    <input
                      type="url"
                      className="modern-input"
                      value={link.url || ''}
                      onChange={(e) => {
                        const newLinks = [...(formData.content.footerLinks || [])];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        updateContent('footerLinks', newLinks);
                      }}
                      placeholder="Link URL"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => {
                      const newLinks = formData.content.footerLinks.filter((_: any, i: number) => i !== index);
                      updateContent('footerLinks', newLinks);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={() => {
                  const currentLinks = formData.content.footerLinks || [];
                  updateContent('footerLinks', [
                    ...currentLinks,
                    { text: { en: '', ta: '' }, url: '' }
                  ]);
                }}
              >
                <FaPlus /> Add Footer Link
              </button>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Newsletter Section</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showNewsletter !== false}
                  onChange={(e) => updateContent('showNewsletter', e.target.checked)}
                />
                Show Newsletter Signup
              </label>
            </div>
            {formData.content.showNewsletter !== false && (
              <>
                {renderBilingualInput('newsletterTitle', 'Newsletter Title')}
                {renderBilingualInput('newsletterDescription', 'Newsletter Description')}
                {renderBilingualInput('newsletterPlaceholder', 'Email Placeholder')}
                {renderBilingualInput('newsletterButtonText', 'Subscribe Button Text')}
              </>
            )}
          </div>

          {renderBilingualInput('copyrightText', 'Copyright Text')}
          
          {renderColorInput('backgroundColor', 'Background Color')}
          {renderColorInput('textColor', 'Text Color')}
          {renderColorInput('linkColor', 'Link Color')}
          
          <div className="modern-field-group">
            <label className="modern-label">Footer Layout</label>
            <select
              className="modern-select"
              value={formData.content.layout || 'default'}
              onChange={(e) => updateContent('layout', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="centered">Centered</option>
              <option value="columns">Multi-Column</option>
            </select>
          </div>
        </div>
      );

    case 'seo':
      return (
        <div className="content-fields">
          {renderBilingualInput('title', 'Page Title')}
          {renderBilingualInput('description', 'Meta Description', 'textarea')}
          {renderBilingualInput('keywords', 'Keywords (comma-separated)')}
          
          <div className="modern-field-group">
            <label className="modern-label">Canonical URL</label>
            <input
              type="url"
              className="modern-input"
              value={formData.content.canonicalUrl || ''}
              onChange={(e) => updateContent('canonicalUrl', e.target.value)}
              placeholder="https://example.com/page"
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Open Graph Settings</label>
            {renderBilingualInput('ogTitle', 'OG Title')}
            {renderBilingualInput('ogDescription', 'OG Description', 'textarea')}
            {renderImageUpload('ogImage', 'OG Image', formData.content.ogImage)}
            
            <div className="modern-field-group">
              <label className="modern-label">OG Type</label>
              <select
                className="modern-select"
                value={formData.content.ogType || 'website'}
                onChange={(e) => updateContent('ogType', e.target.value)}
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="book">Book</option>
                <option value="profile">Profile</option>
                <option value="video">Video</option>
                <option value="music">Music</option>
              </select>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Twitter Card Settings</label>
            {renderBilingualInput('twitterTitle', 'Twitter Title')}
            {renderBilingualInput('twitterDescription', 'Twitter Description', 'textarea')}
            {renderImageUpload('twitterImage', 'Twitter Image', formData.content.twitterImage)}
            
            <div className="modern-field-group">
              <label className="modern-label">Twitter Card Type</label>
              <select
                className="modern-select"
                value={formData.content.twitterCard || 'summary'}
                onChange={(e) => updateContent('twitterCard', e.target.value)}
              >
                <option value="summary">Summary</option>
                <option value="summary_large_image">Summary Large Image</option>
                <option value="app">App</option>
                <option value="player">Player</option>
              </select>
            </div>

            <div className="modern-field-group">
              <label className="modern-label">Twitter Site Handle</label>
              <input
                type="text"
                className="modern-input"
                value={formData.content.twitterSite || ''}
                onChange={(e) => updateContent('twitterSite', e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Schema.org Settings</label>
            <div className="modern-field-group">
              <label className="modern-label">Schema Type</label>
              <select
                className="modern-select"
                value={formData.content.schemaType || 'WebPage'}
                onChange={(e) => updateContent('schemaType', e.target.value)}
              >
                <option value="WebPage">Web Page</option>
                <option value="Article">Article</option>
                <option value="BlogPosting">Blog Post</option>
                <option value="NewsArticle">News Article</option>
                <option value="Organization">Organization</option>
                <option value="Person">Person</option>
                <option value="Event">Event</option>
                <option value="Product">Product</option>
              </select>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Additional Meta Tags</label>
            <div className="array-field">
              {(formData.content.additionalMeta || []).map((meta: any, index: number) => (
                <div key={index} className="array-item">
                  <div className="modern-field-group">
                    <label>Name/Property</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={meta.name || ''}
                      onChange={(e) => {
                        const newMeta = [...(formData.content.additionalMeta || [])];
                        newMeta[index] = { ...newMeta[index], name: e.target.value };
                        updateContent('additionalMeta', newMeta);
                      }}
                      placeholder="Meta tag name or property"
                    />
                  </div>
                  <div className="modern-field-group">
                    <label>Content</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={meta.content || ''}
                      onChange={(e) => {
                        const newMeta = [...(formData.content.additionalMeta || [])];
                        newMeta[index] = { ...newMeta[index], content: e.target.value };
                        updateContent('additionalMeta', newMeta);
                      }}
                      placeholder="Meta tag content"
                    />
                  </div>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => {
                      const newMeta = formData.content.additionalMeta.filter((_: any, i: number) => i !== index);
                      updateContent('additionalMeta', newMeta);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="add-button"
                onClick={() => {
                  const currentMeta = formData.content.additionalMeta || [];
                  updateContent('additionalMeta', [
                    ...currentMeta,
                    { name: '', content: '' }
                  ]);
                }}
              >
                <FaPlus /> Add Meta Tag
              </button>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">SEO Settings</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.noIndex || false}
                  onChange={(e) => updateContent('noIndex', e.target.checked)}
                />
                No Index (prevent search engine indexing)
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.noFollow || false}
                  onChange={(e) => updateContent('noFollow', e.target.checked)}
                />
                No Follow (prevent following links)
              </label>
            </div>
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="content-fields">
          <div className="modern-field-group">
            <label className="modern-label">Target Date & Time</label>
            <input
              type="datetime-local"
              className="modern-input"
              value={formData.content.targetDate || ''}
              onChange={(e) => updateContent('targetDate', e.target.value)}
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Timezone</label>
            <select
              className="modern-select"
              value={formData.content.timezone || 'UTC'}
              onChange={(e) => updateContent('timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Kolkata">India</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Time Unit Labels</label>
            {renderBilingualInput('daysLabel', 'Days Label')}
            {renderBilingualInput('hoursLabel', 'Hours Label')}
            {renderBilingualInput('minutesLabel', 'Minutes Label')}
            {renderBilingualInput('secondsLabel', 'Seconds Label')}
          </div>

          {renderBilingualInput('expiredMessage', 'Expired Message', 'textarea')}

          {renderImageUpload('backgroundImage', 'Background Image', formData.content.backgroundImage)}

          <div className="modern-field-group">
            <label className="modern-label">Background Color</label>
            <input
              type="color"
              className="modern-input"
              value={formData.content.backgroundColor || '#000000'}
              onChange={(e) => updateContent('backgroundColor', e.target.value)}
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Text Color</label>
            <input
              type="color"
              className="modern-input"
              value={formData.content.textColor || '#ffffff'}
              onChange={(e) => updateContent('textColor', e.target.value)}
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Number Color</label>
            <input
              type="color"
              className="modern-input"
              value={formData.content.numberColor || '#ffffff'}
              onChange={(e) => updateContent('numberColor', e.target.value)}
            />
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Countdown Style</label>
            <select
              className="modern-select"
              value={formData.content.countdownStyle || 'default'}
              onChange={(e) => updateContent('countdownStyle', e.target.value)}
            >
              <option value="default">Default</option>
              <option value="circular">Circular</option>
              <option value="flip">Flip Cards</option>
              <option value="minimal">Minimal</option>
              <option value="neon">Neon</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Size</label>
            <select
              className="modern-select"
              value={formData.content.size || 'medium'}
              onChange={(e) => updateContent('size', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Display Options</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showDays !== false}
                  onChange={(e) => updateContent('showDays', e.target.checked)}
                />
                Show Days
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showHours !== false}
                  onChange={(e) => updateContent('showHours', e.target.checked)}
                />
                Show Hours
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showMinutes !== false}
                  onChange={(e) => updateContent('showMinutes', e.target.checked)}
                />
                Show Minutes
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.showSeconds !== false}
                  onChange={(e) => updateContent('showSeconds', e.target.checked)}
                />
                Show Seconds
              </label>
            </div>
          </div>

          <div className="modern-field-group">
            <label className="modern-label">Animation</label>
            <div className="visibility-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.enableAnimation || false}
                  onChange={(e) => updateContent('enableAnimation', e.target.checked)}
                />
                Enable Animation
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.content.enableSound || false}
                  onChange={(e) => updateContent('enableSound', e.target.checked)}
                />
                Enable Sound Effects
              </label>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="content-fields">
          <div className="modern-field-group">
            <p className="modern-label">Please select a component type to see available fields.</p>
          </div>
        </div>
      );
  }
};

export default DynamicFormFields;