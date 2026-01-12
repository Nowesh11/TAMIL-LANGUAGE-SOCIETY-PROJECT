"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../hooks/LanguageContext';
// Using unified modern modal styles (imported globally in layout)

type Bilingual = { en: string; ta: string };
type ItemDetail = {
  _id: string;
  type: 'project' | 'activity' | 'initiative';
  bureau?: string;
  title: Bilingual;
  shortDesc: Bilingual;
  fullDesc: Bilingual;
  goals?: Bilingual;
  achievement?: Bilingual;
  directorName?: Bilingual;
  location?: Bilingual;
  status: string;
  progress?: string;
  progressPercent?: number;
  images: string[];
  heroImagePath?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  participants?: number;
};

export default function ProjectItemDetail({ id, type }: { id: string; type?: 'project' | 'activity' | 'initiative' }) {
  const { lang } = useLanguage();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [form, setForm] = useState<null | {
    _id: string;
    title?: Bilingual;
    description?: Bilingual;
    role: 'crew' | 'volunteer' | 'participant' | string;
    status: 'inactive' | 'upcoming' | 'expired' | 'open' | 'full';
    fields?: {
      id: string;
      label: Bilingual;
      type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number' | 'date' | 'tel' | 'url' | 'grid_radio' | 'grid_checkbox' | 'scale' | 'time';
      required?: boolean;
      placeholder?: Bilingual;
      options?: ({ value: string } & Bilingual)[];
      validation?: { min?: number; max?: number };
    }[];
  }>(null);
  const [showForm, setShowForm] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/project-items/${id}`, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) {
          if (isMounted) setItem(null);
          return;
        }
        const json = await res.json();
        if (isMounted) setItem(json.item || null);
      } catch (e) {
        console.warn('Failed to load item', e);
        if (isMounted) setItem(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; controller.abort(); };
  }, [id]);

  // Load recruitment form (single role window)
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function loadForm() {
      try {
        const res = await fetch(`/api/project-items/${id}/recruitment`, { cache: 'no-store', signal: controller.signal });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        setForm(json.form || null);
      } catch (e) {
        console.warn('Recruitment form fetch failed', e);
      }
    }
    loadForm();
    return () => { active = false; controller.abort(); };
  }, [id]);

  const handleFileUpload = async (fieldId: string, file: File) => {
    if (!file) return;

    setUploadingFiles(prev => ({ ...prev, [fieldId]: true }));
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      formData.append('responseId', `temp_${Date.now()}`); // Temporary ID, will be updated after submission

      const response = await fetch('/api/upload/recruitment', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      setFileUploads(prev => ({ ...prev, [fieldId]: file }));
      setAnswers(prev => ({ ...prev, [fieldId]: result.filePath }));
    } catch (error) {
      console.error('File upload error:', error);
      setSubmitError(lang === 'en' ? 'File upload failed. Please try again.' : 'கோப்பு பதிவேற்றம் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldId]: false }));
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Memoized labels must be declared before any early returns
  const roleButtonText = useMemo(() => {
    if (!form) return lang === 'en' ? 'Join' : 'சேருங்கள்';
    switch (form.role) {
      case 'crew':
        return lang === 'en' ? 'Join Project' : 'திட்டத்தில் சேருங்கள்';
      case 'volunteer':
        return lang === 'en' ? 'Be a Volunteer' : 'தன்னார்வலராக இருங்கள்';
      case 'participant':
        return lang === 'en' ? 'Join Us' : 'எங்களுடன் சேருங்கள்';
      default:
        return lang === 'en' ? 'Join' : 'சேருங்கள்';
    }
  }, [form, lang]);

  const formStatusLabel = useMemo(() => {
    switch (form?.status) {
      case 'open': return lang === 'en' ? 'Open' : 'திறந்தது';
      case 'upcoming': return lang === 'en' ? 'Upcoming' : 'விரைவில்';
      case 'expired': return lang === 'en' ? 'Closed' : 'மூடப்பட்டது';
      case 'full': return lang === 'en' ? 'Full' : 'நிறைந்தது';
      case 'inactive': return lang === 'en' ? 'Inactive' : 'செயலற்றது';
      default: return '';
    }
  }, [form, lang]);

  const renderField = (f: NonNullable<NonNullable<typeof form>['fields']>[number]) => {
    const label = f.label?.[lang] || f.label?.en || f.id;
    const placeholder = f.placeholder?.[lang] || f.placeholder?.en || '';
    const isRequired = !!f.required;

    // Helper for grid/scale options
    const renderScale = () => {
      const min = f.validation?.min || 1;
      const max = f.validation?.max || 5;
      const range = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      
      return (
        <div className="scale-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', overflowX: 'auto', padding: '1rem 0' }}>
           <span className="scale-label-min" style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>{f.options?.[0]?.[lang] || f.options?.[0]?.en || min}</span>
           <div className="scale-options" style={{ display: 'flex', gap: '1.5rem' }}>
             {range.map(val => (
               <label key={val} className="scale-option" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                 <span style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--foreground)' }}>{val}</span>
                 <input
                   type="radio"
                   name={f.id}
                   value={val}
                   checked={answers[f.id] === String(val)}
                   onChange={(e) => setAnswers(prev => ({ ...prev, [f.id]: e.target.value }))}
                   className="modern-radio"
                   style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                   required={isRequired}
                 />
               </label>
             ))}
           </div>
           <span className="scale-label-max" style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>{f.options?.[1]?.[lang] || f.options?.[1]?.en || max}</span>
        </div>
      );
    };

    const renderGrid = (type: 'radio' | 'checkbox') => {
      // Default columns if not defined (assuming options are Rows)
      const columns = ['1', '2', '3', '4', '5']; 
      
      return (
        <div className="grid-container" style={{ overflowX: 'auto' }}>
          <table className="modern-grid-table" style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px' }}></th>
                {columns.map(c => <th key={c} style={{ textAlign: 'center', padding: '10px', color: 'var(--foreground-muted)', fontWeight: 500 }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {f.options?.map((opt, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 10px', fontWeight: 500, color: 'var(--foreground)' }}>{opt[lang] || opt.en}</td>
                  {columns.map(c => (
                    <td key={c} style={{ textAlign: 'center', padding: '12px 10px' }}>
                      <input
                        type={type}
                        name={`${f.id}_${opt.value}`} // Unique name per row
                        value={c}
                        checked={answers[`${f.id}::${opt.value}`] === c}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [`${f.id}::${opt.value}`]: e.target.value }))}
                        className={type === 'radio' ? 'modern-radio' : 'modern-checkbox'}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    switch (f.type) {
      case 'textarea':
        return (
          <textarea
            className="modern-textarea"
            value={answers[f.id] || ''}
            placeholder={placeholder}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px', backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)' }}
          />
        );
      case 'select':
        return (
          <select
            className="modern-select"
            value={answers[f.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px', backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)' }}
          >
            <option value="">{lang === 'en' ? 'Select an option' : 'ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்'}</option>
            {f.options?.map((opt, idx) => (
              <option key={idx} value={opt.value}>{opt[lang] || opt.en}</option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="radio-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '8px' }}>
            {f.options?.map((opt, idx) => (
              <label key={idx} className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background-secondary)' }}>
                <input
                  type="radio"
                  name={f.id}
                  value={opt.value}
                  checked={answers[f.id] === opt.value}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [f.id]: e.target.value }))}
                  required={isRequired}
                  className="modern-radio"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <span style={{ color: 'var(--foreground)' }}>{opt[lang] || opt.en}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '8px' }}>
            {f.options?.map((opt, idx) => (
              <label key={idx} className="checkbox-option" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--background-secondary)' }}>
                <input
                  type="checkbox"
                  name={f.id}
                  value={opt.value}
                  checked={(answers[f.id] || '').split(',').includes(opt.value)}
                  onChange={(e) => {
                    const current = (answers[f.id] || '').split(',').filter(Boolean);
                    const newVal = e.target.checked 
                      ? [...current, opt.value]
                      : current.filter(v => v !== opt.value);
                    setAnswers(prev => ({ ...prev, [f.id]: newVal.join(',') }));
                  }}
                  className="modern-checkbox"
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <span style={{ color: 'var(--foreground)' }}>{opt[lang] || opt.en}</span>
              </label>
            ))}
          </div>
        );
      case 'scale':
        return renderScale();
      case 'grid_radio':
        return renderGrid('radio');
      case 'grid_checkbox':
        return renderGrid('checkbox');
      case 'file':
        return (
          <div className="file-upload-container" style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '2px dashed var(--border)', borderRadius: '8px', backgroundColor: 'var(--background-secondary)' }}>
              <input
                type="file"
                id={`file-${f.id}`}
                className="hidden-file-input"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(f.id, file);
                }}
                required={isRequired && !answers[f.id]}
                disabled={uploadingFiles[f.id]}
                style={{ display: 'none' }}
              />
              <label htmlFor={`file-${f.id}`} className="modern-btn modern-btn-secondary compact-btn" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid var(--border)' }}>
                <i className="fas fa-cloud-upload-alt" />
                {lang === 'en' ? 'Choose File' : 'கோப்பைத் தேர்ந்தெடுக்கவும்'}
              </label>
              <span style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)' }}>
                {fileUploads[f.id]?.name || (lang === 'en' ? 'No file chosen' : 'கோப்பு எதுவும் தேர்ந்தெடுக்கப்படவில்லை')}
              </span>
            </div>
            {uploadingFiles[f.id] && (
              <div className="upload-status" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--info)' }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }} />
                <span>{lang === 'en' ? 'Uploading...' : 'பதிவேற்றுகிறது...'}</span>
              </div>
            )}
            {fileUploads[f.id] && !uploadingFiles[f.id] && (
              <div className="upload-success" style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--success)' }}>
                <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }} />
                <span>{lang === 'en' ? 'File uploaded successfully' : 'கோப்பு வெற்றிகரமாக பதிவேற்றப்பட்டது'}</span>
              </div>
            )}
          </div>
        );
      case 'date':
      case 'time':
        return (
          <input
            type={f.type}
            className="modern-input"
            value={answers[f.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px', backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)' }}
          />
        );
      default:
        // Default text input for text, email, number, tel, url, etc.
        return (
          <input
            className="modern-input"
            type={['text','email','number','tel','url'].includes(f.type) ? f.type : 'text'}
            value={answers[f.id] || ''}
            placeholder={placeholder}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px', backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)' }}
          />
        );
    }
  };
  if (!item) return <div className="layout-container">Not found</div>;

  const hero = item.heroImagePath || item.images?.[0];
  const gallery = (item.images || []).slice(0, 10);
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;
  const roundedPct = typeof pct === 'number' ? Math.max(0, Math.min(100, Math.round(pct / 5) * 5)) : undefined;
  const bureauLabels: Record<string, Bilingual> = {
    sports_leadership: { en: 'Sports & Leadership Bureau', ta: 'விளையாட்டு & தலைமைக் கழகம்' },
    education_intellectual: { en: 'Education & Intellectual Bureau', ta: 'கல்வி & அறிவாற்றல் கழகம்' },
    arts_culture: { en: 'Arts & Culture Bureau', ta: 'கலை & பண்பாட்டுக் கழகம்' },
    social_welfare_voluntary: { en: 'Social Welfare & Voluntary Bureau', ta: 'சமூக நலன் & தன்னார்வக் கழகம்' },
    language_literature: { en: 'Language & Literature Bureau', ta: 'மொழி & இலக்கியக் கழகம்' },
  };
  const bureauLabel = item.bureau ? (bureauLabels[item.bureau] || { en: item.bureau, ta: item.bureau })[lang] : undefined;

  

  async function submitRecruitment() {
    if (!form || form.status !== 'open') return;
    setSubmitting(true);
    setSubmitOk(null);
    setSubmitError(null);
    try {
      // Client-side validation for required fields
      if (!applicantName.trim()) {
        setSubmitError(lang === 'en' ? 'Please enter your name.' : 'தயவுசெய்து உங்கள் பெயரை உள்ளிடுங்கள்.');
        return;
      }
      if (!applicantEmail.trim()) {
        setSubmitError(lang === 'en' ? 'Please enter your email.' : 'தயவுசெய்து உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்.');
        return;
      }
      const missingFields = (form.fields || []).filter(f => {
        if (!f.required) return false;

        // Grid validation: check if all rows have values
        if (f.type === 'grid_radio' || f.type === 'grid_checkbox') {
          if (!f.options || f.options.length === 0) return false;
          // Check if every row has an answer
          return !f.options.every(opt => {
            const key = `${f.id}::${opt.value}`;
            const val = answers[key];
            return val && val.trim() !== '';
          });
        }

        const v = answers[f.id];
        return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
      });

      if (missingFields.length > 0) {
        const missingLabels = missingFields.map(f => f.label?.[lang] || f.label?.en || f.id);
        setSubmitError(
          (lang === 'en'
            ? `Please fill required fields: ${missingLabels.join(', ')}`
            : `தேவையான புலங்களை நிரப்பவும்: ${missingLabels.join(', ')}`)
        );
        return;
      }

      // Transform answers to handle grid fields (group by field ID)
      const formattedAnswers: Record<string, any> = {};
      
      // First pass: copy non-grid answers
      Object.entries(answers).forEach(([key, value]) => {
        if (!key.includes('::')) {
          formattedAnswers[key] = value;
        }
      });

      // Second pass: group grid answers
      Object.entries(answers).forEach(([key, value]) => {
        if (key.includes('::')) {
          const [fieldId, rowKey] = key.split('::');
          if (!formattedAnswers[fieldId]) {
            formattedAnswers[fieldId] = {};
          }
          if (typeof formattedAnswers[fieldId] === 'object') {
            formattedAnswers[fieldId][rowKey] = value;
          }
        }
      });

      const payload = {
        applicantName,
        applicantEmail,
        answers: Object.entries(formattedAnswers).map(([key, value]) => ({ key, value })),
      };
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const res = await fetch(`/api/project-items/${id}/recruitment/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setSubmitOk(true);
        setSubmitError(null);
        setShowForm(false);
      } else {
        setSubmitOk(false);
        setSubmitError((json && json.error) || (lang === 'en' ? 'Submission failed. Please try again.' : 'சமர்ப்பிப்பு தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'));
      }
    } catch (e) {
      console.warn(e);
      setSubmitOk(false);
      setSubmitError(lang === 'en' ? 'Network error. Please try again.' : 'நெட்வொர்க் பிழை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="layout-page">
      {/* Hero */}
      <section className="detail-hero">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="detail-hero-media" aria-hidden="true" />
        ) : null}
        <div className="layout-container detail-hero-content">
          <h1 className="gradient-title detail-hero-title">
            {typeof item.title === 'string' 
              ? item.title 
              : item.title?.[lang] || item.title?.en || ''}
          </h1>
          <p className="detail-hero-subtitle">
            {typeof item.shortDesc === 'string' 
              ? item.shortDesc 
              : item.shortDesc?.[lang] || item.shortDesc?.en || ''}
          </p>
        </div>
      </section>

      {/* Summary Grid */}
      <section className="layout-section">
        <div className="layout-container">
          <div className="projects-grid">
            {/* Bureau */}
            <div className="project-card">
              <div className="project-card-content">
                <div className="project-content">
                  <span className="project-category">{lang === 'en' ? 'Bureau' : 'துறை'}</span>
                  <h3>{bureauLabel || (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                  <p>{lang === 'en' ? 'Responsible department' : 'பெறுப்பான துறை'}</p>
                </div>
              </div>
            </div>

            {/* Director */}
            <div className="project-card">
              <div className="project-card-content">
                <div className="project-content">
                  <span className="project-category">{lang === 'en' ? 'Director' : 'இயக்குநர்'}</span>
                  <h3>{(item.directorName && (item.directorName?.[lang] || item.directorName?.en)) || (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                  <p>{lang === 'en' ? 'Lead person' : 'முன்னணி பொறுப்பாளர்'}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="project-card">
              <div className="project-card-content">
                <div className="project-content">
                  <span className="project-category">{lang === 'en' ? 'Status' : 'நிலை'}</span>
                  <h3 className="text-capitalize">{(item.progress || item.status || '').replace(/-/g, ' ')}</h3>
                  {typeof pct === 'number' ? (
                    <div className="project-progress">
                      <div>
                        <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="bar">
                        {typeof roundedPct === 'number' ? (
                          <div className={`bar-fill w-pct-${roundedPct}`} />
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="project-card">
              <div className="project-card-content">
                <div className="project-content">
                  <span className="project-category">{lang === 'en' ? 'Timeline' : 'காலக்கெடு'}</span>
                  <h3>{lang === 'en' ? 'Start' : 'தொடக்கம்'}: {item.startDate ? new Date(item.startDate).toLocaleDateString() : (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                  <h4>{lang === 'en' ? 'End' : 'முடிவு'}: {item.endDate ? new Date(item.endDate).toLocaleDateString() : (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="layout-section">
        <div className="layout-container">
          <div className="layout-card">
            <p className="detail-full-desc">
              {typeof item.fullDesc === 'string' 
                ? item.fullDesc 
                : item.fullDesc?.[lang] || item.fullDesc?.en || ''}
            </p>
          </div>
        </div>
      </section>

      {/* Share & Recruitment */}
      <section className="layout-section">
        <div className="layout-container">
          <div className="detail-aside-grid">
            {/* Share Section */}
            <div className="layout-card share-section">
              <h4>{lang === 'en' ? 'Share This Project' : 'இந்த திட்டத்தை பகிரவும்'}</h4>
              <div className="share-buttons">
                <a className="share-btn facebook" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook-f" />
                  <span>{lang === 'en' ? 'Facebook' : 'ஃபேஸ்புக்'}</span>
                </a>
                <a className="share-btn twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || ''))}`} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter" />
                  <span>{lang === 'en' ? 'Twitter' : 'ட்விட்டர்'}</span>
                </a>
                <a className="share-btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent((typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || '')) + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp" />
                  <span>{lang === 'en' ? 'WhatsApp' : 'வாட்ஸ்அப்'}</span>
                </a>
                <button className="share-btn copy" type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                  <i className="fas fa-link" />
                  <span>{lang === 'en' ? 'Copy Link' : 'இணைப்பை நகலெடு'}</span>
                </button>
              </div>
            </div>

            {/* Recruitment Section - single role */}
            <div className="layout-card recruitment-section" id="recruitment-section">
              <div className="recruitment-header">
                <h4 className="recruitment-title">{lang === 'en' ? 'Join Our Team' : 'எங்கள் அணியில் சேருங்கள்'}</h4>
                <span className="recruitment-status">{formStatusLabel}</span>
              </div>
              <p className="description">{form?.description?.[lang] || (lang === 'en' ? 'Be part of this initiative and help us preserve Tamil language and culture.' : 'இந்த முயற்சியின் ஒரு பகுதியாக இருந்து தமிழ் மொழி மற்றும் பண்பாட்டை பாதுகாக்க நம்முடன் சேருங்கள்.')}</p>
              <div className="recruitment-cta">
                <button
                  className="recruitment-btn"
                  type="button"
                  disabled={!form || form.status !== 'open'}
                  onClick={() => setShowForm(true)}
                >
                  <i className="fas fa-users" />
                  <span>{roleButtonText}</span>
                </button>
              </div>
              {showForm && form && (
                <div className="component-modal-overlay modern-modal-overlay" onClick={() => setShowForm(false)} style={{ zIndex: 1000 }}>
                  <div className="component-modal-container modern-modal-container" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', borderColor: 'var(--border)', maxWidth: '800px' }}>
                    <div className="modern-modal-header" style={{ borderBottomColor: 'var(--border)' }}>
                      <div className="modal-title-section">
                        <h2 className="modern-modal-title" style={{ color: 'var(--foreground)' }}>
                          <i className="fas fa-users" style={{ marginRight: '12px' }} />
                          {form.title?.[lang] || (lang === 'en' ? 'Join Our Team' : 'எங்கள் அணியில் சேருங்கள்')}
                        </h2>
                        <p className="modal-subtitle" style={{ color: 'var(--foreground-muted)' }}>{form.description?.[lang] || (lang === 'en' ? 'Be part of this initiative' : 'இந்த முயற்சியின் ஒரு பகுதியாக இருங்கள்')}</p>
                      </div>
                      <button 
                        className="modern-close-button" 
                        onClick={() => setShowForm(false)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--background-secondary)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                    
                    <div className="modern-modal-body">
                      <div className="form-section">
                        <h3 className="section-title" style={{ color: 'var(--foreground-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{lang === 'en' ? 'Personal Information' : 'தனிப்பட்ட தகவல்கள்'}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="modern-field-group">
                            <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>{lang === 'en' ? 'Your Name' : 'உங்கள் பெயர்'}</label>
                            <input 
                              className={`modern-input ${fieldErrors.applicantName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                              type="text" 
                              value={applicantName} 
                              onChange={(e) => {
                                setApplicantName(e.target.value);
                                if (fieldErrors.applicantName) setFieldErrors(prev => ({ ...prev, applicantName: '' }));
                              }} 
                              placeholder={lang === 'en' ? 'Enter your full name' : 'உங்கள் முழு பெயரை உள்ளிடவும்'}
                              style={{ backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)', borderColor: fieldErrors.applicantName ? 'var(--error)' : 'var(--border)' }}
                            />
                            {fieldErrors.applicantName && (
                              <div className="field-error-message" style={{ color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <i className="fas fa-exclamation-circle" />
                                <span>{fieldErrors.applicantName}</span>
                              </div>
                            )}
                          </div>
                          <div className="modern-field-group">
                            <label className="modern-label required" style={{ color: 'var(--foreground-muted)' }}>{lang === 'en' ? 'Email' : 'மின்னஞ்சல்'}</label>
                            <input 
                              className={`modern-input ${fieldErrors.applicantEmail ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                              type="email" 
                              value={applicantEmail} 
                              onChange={(e) => {
                                setApplicantEmail(e.target.value);
                                if (fieldErrors.applicantEmail) setFieldErrors(prev => ({ ...prev, applicantEmail: '' }));
                              }} 
                              placeholder={lang === 'en' ? 'Enter your email address' : 'உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்'}
                              style={{ backgroundColor: 'var(--background-tertiary)', color: 'var(--foreground)', borderColor: fieldErrors.applicantEmail ? 'var(--error)' : 'var(--border)' }}
                            />
                            {fieldErrors.applicantEmail && (
                              <div className="field-error-message" style={{ color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                <i className="fas fa-exclamation-circle" />
                                <span>{fieldErrors.applicantEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {(form.fields || []).length > 0 && (
                        <div className="form-section" style={{ marginTop: '1.5rem' }}>
                          <h3 className="section-title" style={{ color: 'var(--foreground-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{lang === 'en' ? 'Additional Information' : 'கூடுதல் தகவல்கள்'}</h3>
                          <div className="space-y-4">
                            {(form.fields || []).map((f) => (
                              <div key={f.id} className="modern-field-group">
                                <label className={`modern-label ${f.required ? 'required' : 'optional'}`} style={{ color: 'var(--foreground-muted)' }}>{f.label?.[lang] || f.id}</label>
                                {renderField(f)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(submitError || submitOk !== null) && (
                        <div className="form-section" style={{ marginTop: '1.5rem' }}>
                          {submitError && (
                            <div className="error-message" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                              <i className="fas fa-exclamation-triangle" style={{ marginRight: '0.5rem' }} />
                              <span>{submitError}</span>
                            </div>
                          )}
                          {submitOk === true && (
                            <div className="success-message" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '0.5rem' }}>
                              <i className="fas fa-check-circle" style={{ marginRight: '0.5rem' }} />
                              <span>{lang === 'en' ? 'Thank you! We received your application.' : 'நன்றி! உங்கள் விண்ணப்பத்தை பெற்றோம்.'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="modern-modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                      <button 
                        className="modern-button secondary-button" 
                        type="button" 
                        onClick={() => setShowForm(false)}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background-secondary)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <i className="fas fa-times" />
                        <span>{lang === 'en' ? 'Cancel' : 'ரத்து செய்யவும்'}</span>
                      </button>
                      <button 
                        className="modern-button primary-button" 
                        type="button" 
                        onClick={submitRecruitment} 
                        disabled={submitting}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}
                      >
                        {submitting ? (
                          <>
                            <i className="fas fa-spinner fa-spin" />
                            <span>{lang === 'en' ? 'Submitting...' : 'சமர்ப்பித்து வருகிறது...'}</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane" />
                            <span>{lang === 'en' ? 'Submit Application' : 'விண்ணப்பத்தை சமர்ப்பிக்கவும்'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery - max 10 */}
      <section className="layout-section">
        <div className="layout-container">
          <h2 className="section-title">{lang === 'en' ? 'Gallery' : 'காட்சி'}</h2>
          <div className="detail-gallery-grid">
            {gallery.slice(0, 10).map((src, idx) => (
              <div key={idx} className="layout-card gallery-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${item.title?.[lang] || item.title?.en || item.title || ''} image ${idx + 1}`} className="gallery-img" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details Overview - show all available info except IDs */}
      <section className="layout-section">
        <div className="layout-container">
          <h2 className="section-title">{lang === 'en' ? 'Details Overview' : 'விவரங்களின் கண்ணோட்டம்'}</h2>
          <div className="projects-grid">
            {item.goals?.[lang] && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Goals' : 'இலக்குகள்'}</span>
                <p>{typeof item.goals === 'string' ? item.goals : (item.goals?.[lang] || item.goals?.en || '')}</p>
              </div></div></div>
            )}
            {item.achievement?.[lang] && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Achievement' : 'சாதனை'}</span>
                <p>{typeof item.achievement === 'string' ? item.achievement : (item.achievement?.[lang] || item.achievement?.en || '')}</p>
              </div></div></div>
            )}
            {item.location?.[lang] && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Location' : 'இடம்'}</span>
                <p>{typeof item.location === 'string' ? item.location : (item.location?.[lang] || item.location?.en || '')}</p>
              </div></div></div>
            )}
            {typeof item.budget === 'number' && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Budget' : 'நிதி'}</span>
                <p>{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.budget)}</p>
              </div></div></div>
            )}
            {typeof item.participants === 'number' && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Participants' : 'பங்கேற்பாளர்கள்'}</span>
                <p>{item.participants}</p>
              </div></div></div>
            )}
            {item.type && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Type' : 'வகை'}</span>
                <p className="text-capitalize">{
                  item.type === 'project' ? (lang === 'en' ? 'Project' : 'திட்டம்') :
                  item.type === 'activity' ? (lang === 'en' ? 'Activity' : 'செயல்பாடு') :
                  item.type === 'initiative' ? (lang === 'en' ? 'Initiative' : 'முயற்சி') :
                  item.type
                }</p>
              </div></div></div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}