"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../hooks/LanguageContext';
import { FaTimes, FaUser, FaEnvelope, FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaUsers, FaCloudUploadAlt, FaChevronDown, FaFacebookF, FaTwitter, FaWhatsapp, FaLink } from 'react-icons/fa';
import '../../styles/admin/modals.css'; // Import unified modal styles

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
      toast.success(lang === 'en' ? 'File uploaded successfully' : 'கோப்பு வெற்றிகரமாக பதிவேற்றப்பட்டது');
    } catch (error) {
      console.error('File upload error:', error);
      const msg = lang === 'en' ? 'File upload failed. Please try again.' : 'கோப்பு பதிவேற்றம் தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.';
      setSubmitError(msg);
      toast.error(msg);
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
        <div className="scale-container flex justify-between items-center gap-4 overflow-x-auto py-4">
           <span className="text-sm text-gray-400 font-medium">{f.options?.[0]?.[lang] || f.options?.[0]?.en || min}</span>
           <div className="flex gap-6">
             {range.map(val => (
               <label key={val} className="flex flex-col items-center cursor-pointer group">
                 <span className="mb-2 text-sm text-gray-300 group-hover:text-cyan-400 transition-colors font-medium">{val}</span>
                 <input
                   type="radio"
                   name={f.id}
                   value={val}
                   checked={answers[f.id] === String(val)}
                   onChange={(e) => setAnswers(prev => ({ ...prev, [f.id]: e.target.value }))}
                   className="w-5 h-5 accent-primary"
                   required={isRequired}
                 />
               </label>
             ))}
           </div>
           <span className="text-sm text-gray-400 font-medium">{f.options?.[1]?.[lang] || f.options?.[1]?.en || max}</span>
        </div>
      );
    };

    const renderGrid = (type: 'radio' | 'checkbox') => {
      // Default columns if not defined (assuming options are Rows)
      const columns = ['1', '2', '3', '4', '5']; 
      
      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3"></th>
                {columns.map(c => <th key={c} className="text-center p-3 text-foreground-muted font-medium">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {f.options?.map((opt, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-surface-hover transition-colors">
                  <td className="p-3 font-medium text-foreground-secondary">{opt[lang] || opt.en}</td>
                  {columns.map(c => (
                    <td key={c} className="text-center p-3">
                      <input
                        type={type}
                        name={`${f.id}_${opt.value}`} // Unique name per row
                        value={c}
                        checked={answers[`${f.id}::${opt.value}`] === c}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [`${f.id}::${opt.value}`]: e.target.value }))}
                        className={type === 'radio' ? 'modern-radio w-5 h-5 accent-cyan-500' : 'modern-checkbox w-5 h-5 accent-cyan-500'}
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
            className="w-full bg-surface-hover/50 border border-border rounded-lg p-4 text-foreground placeholder-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            value={answers[f.id] || ''}
            placeholder={placeholder}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
            rows={4}
          />
        );
      case 'select':
        return (
          <div className="relative">
            <select
              className="w-full bg-surface-hover/50 border border-border rounded-lg px-4 py-2 text-foreground appearance-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              value={answers[f.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
              required={isRequired}
            >
              <option value="" className="bg-background text-foreground-muted">{lang === 'en' ? 'Select an option' : 'ஒரு விருப்பத்தைத் தேர்ந்தெடுக்கவும்'}</option>
              {f.options?.map((opt, idx) => (
                <option key={idx} value={opt.value} className="bg-background text-foreground">{opt[lang] || opt.en}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted">
              <FaChevronDown />
            </div>
          </div>
        );
      case 'radio':
        return (
          <div className="flex flex-col gap-3 mt-2">
            {f.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover hover:border-primary/30 transition-all group">
                <input
                  type="radio"
                  name={f.id}
                  value={opt.value}
                  checked={answers[f.id] === opt.value}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [f.id]: e.target.value }))}
                  required={isRequired}
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-foreground-secondary group-hover:text-foreground font-medium transition-colors">{opt[lang] || opt.en}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex flex-col gap-3 mt-2">
            {f.options?.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border bg-surface-hover/50 hover:bg-surface-hover hover:border-primary/30 transition-all group">
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
                  className="w-5 h-5 accent-primary"
                />
                <span className="text-foreground-secondary group-hover:text-foreground font-medium transition-colors">{opt[lang] || opt.en}</span>
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
          <div className="mt-2">
            <div className={`flex items-center gap-4 p-4 border-2 dashed rounded-xl bg-surface transition-all ${fileUploads[f.id] ? 'border-success/50 bg-success/10' : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}>
              <input
                type="file"
                id={`file-${f.id}`}
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(f.id, file);
                }}
                required={isRequired && !answers[f.id]}
                disabled={uploadingFiles[f.id]}
              />
              <label htmlFor={`file-${f.id}`} className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface text-foreground cursor-pointer flex items-center gap-2 transition-all border border-border">
                <FaCloudUploadAlt className="text-lg" />
                {lang === 'en' ? 'Choose File' : 'கோப்பைத் தேர்ந்தெடுக்கவும்'}
              </label>
              <span className="text-sm text-foreground-muted truncate max-w-[200px]">
                {fileUploads[f.id]?.name || (lang === 'en' ? 'No file chosen' : 'கோப்பு எதுவும் தேர்ந்தெடுக்கப்படவில்லை')}
              </span>
            </div>
            {uploadingFiles[f.id] && (
              <div className="flex items-center gap-2 mt-2 text-sm text-primary animate-pulse">
                <FaSpinner className="animate-spin" />
                <span>{lang === 'en' ? 'Uploading...' : 'பதிவேற்றுகிறது...'}</span>
              </div>
            )}
            {fileUploads[f.id] && !uploadingFiles[f.id] && (
              <div className="flex items-center gap-2 mt-2 text-sm text-success">
                <FaCheckCircle />
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
            className="w-full bg-surface-hover/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors mt-2"
            value={answers[f.id] || ''}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
          />
        );
      default:
        // Default text input for text, email, number, tel, url, etc.
        return (
          <input
            className="w-full bg-surface-hover/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder-foreground-muted focus:border-primary focus:ring-1 focus:ring-primary transition-colors mt-2"
            type={['text','email','number','tel','url'].includes(f.type) ? f.type : 'text'}
            value={answers[f.id] || ''}
            placeholder={placeholder}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
            required={isRequired}
          />
        );
    }
  };
  if (!item) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <FaSpinner className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
        <p className="text-foreground-muted">Loading details...</p>
      </div>
    </div>
  );

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
        const msg = lang === 'en' ? 'Please enter your name.' : 'தயவுசெய்து உங்கள் பெயரை உள்ளிடுங்கள்.';
        setSubmitError(msg);
        toast.error(msg);
        return;
      }
      if (!applicantEmail.trim()) {
        const msg = lang === 'en' ? 'Please enter your email.' : 'தயவுசெய்து உங்கள் மின்னஞ்சலை உள்ளிடுங்கள்.';
        setSubmitError(msg);
        toast.error(msg);
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
        const msg = lang === 'en'
            ? `Please fill required fields: ${missingLabels.join(', ')}`
            : `தேவையான புலங்களை நிரப்பவும்: ${missingLabels.join(', ')}`;
        setSubmitError(msg);
        toast.error(msg);
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
        toast.success(lang === 'en' ? 'Application submitted successfully!' : 'விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!');
      } else {
        setSubmitOk(false);
        const msg = (json && json.error) || (lang === 'en' ? 'Submission failed. Please try again.' : 'சமர்ப்பிப்பு தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
        setSubmitError(msg);
        toast.error(msg);
      }
    } catch (e) {
      console.warn(e);
      setSubmitOk(false);
      const msg = lang === 'en' ? 'Network error. Please try again.' : 'நெட்வொர்க் பிழை. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.';
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="w-full h-full object-cover" aria-hidden="true" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
            {typeof item.title === 'string' 
              ? item.title 
              : item.title?.[lang] || item.title?.en || ''}
          </h1>
          <p className="text-xl text-foreground-secondary max-w-3xl">
            {typeof item.shortDesc === 'string' 
              ? item.shortDesc 
              : item.shortDesc?.[lang] || item.shortDesc?.en || ''}
          </p>
        </div>
      </section>

      {/* Summary Grid */}
      <section className="py-12 -mt-10 relative z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bureau */}
            <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md">
              <div className="flex flex-col h-full">
                <span className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{lang === 'en' ? 'Bureau' : 'துறை'}</span>
                <h3 className="text-lg font-bold text-foreground mb-1">{bureauLabel || (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                <p className="text-sm text-foreground-muted mt-auto">{lang === 'en' ? 'Responsible department' : 'பெறுப்பான துறை'}</p>
              </div>
            </div>

            {/* Director */}
            <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md">
              <div className="flex flex-col h-full">
                <span className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">{lang === 'en' ? 'Director' : 'இயக்குநர்'}</span>
                <h3 className="text-lg font-bold text-foreground mb-1">{(item.directorName && (item.directorName?.[lang] || item.directorName?.en)) || (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                <p className="text-sm text-foreground-muted mt-auto">{lang === 'en' ? 'Lead person' : 'முன்னணி பொறுப்பாளர்'}</p>
              </div>
            </div>

            {/* Status */}
            <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md">
              <div className="flex flex-col h-full">
                <span className="text-sm font-semibold text-success mb-2 uppercase tracking-wider">{lang === 'en' ? 'Status' : 'நிலை'}</span>
                <h3 className="text-lg font-bold text-foreground mb-3 text-capitalize">{(item.progress || item.status || '').replace(/-/g, ' ')}</h3>
                {typeof pct === 'number' ? (
                  <div className="w-full mt-auto">
                    <div className="flex justify-between text-xs text-foreground-muted mb-1">
                      <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                      <span className="text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      {typeof roundedPct === 'number' ? (
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative"
                          style={{ width: `${pct}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Timeline */}
            <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md">
              <div className="flex flex-col h-full">
                <span className="text-sm font-semibold text-warning mb-2 uppercase tracking-wider">{lang === 'en' ? 'Timeline' : 'காலக்கெடு'}</span>
                <h3 className="text-base text-foreground mb-1"><span className="text-foreground-muted">{lang === 'en' ? 'Start' : 'தொடக்கம்'}:</span> {item.startDate ? new Date(item.startDate).toLocaleDateString() : (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                <h4 className="text-base text-foreground"><span className="text-foreground-muted">{lang === 'en' ? 'End' : 'முடிவு'}:</span> {item.endDate ? new Date(item.endDate).toLocaleDateString() : (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="py-12 relative z-20">
        <div className="container mx-auto px-4">
          <div className="card-morphism p-8 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md">
            <p className="text-foreground-secondary leading-relaxed text-lg">
              {typeof item.fullDesc === 'string' 
                ? item.fullDesc 
                : item.fullDesc?.[lang] || item.fullDesc?.en || ''}
            </p>
          </div>
        </div>
      </section>

      {/* Share & Recruitment */}
      <section className="py-12 bg-surface/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Share Section */}
            <div className="card-morphism p-8 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md h-full">
              <h4 className="text-xl font-bold text-foreground mb-6 border-b border-border/10 pb-4">{lang === 'en' ? 'Share This Project' : 'இந்த திட்டத்தை பகிரவும்'}</h4>
              <div className="flex flex-col gap-4">
                <a className="flex items-center gap-4 p-4 rounded-xl bg-[#1877f2]/20 hover:bg-[#1877f2]/30 text-foreground transition-all border border-[#1877f2]/30" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer">
                  <FaFacebookF className="text-2xl text-[#1877f2]" />
                  <span className="font-medium">{lang === 'en' ? 'Facebook' : 'ஃபேஸ்புக்'}</span>
                </a>
                <a className="flex items-center gap-4 p-4 rounded-xl bg-[#1da1f2]/20 hover:bg-[#1da1f2]/30 text-foreground transition-all border border-[#1da1f2]/30" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || ''))}`} target="_blank" rel="noopener noreferrer">
                  <FaTwitter className="text-2xl text-[#1da1f2]" />
                  <span className="font-medium">{lang === 'en' ? 'Twitter' : 'ட்விட்டர்'}</span>
                </a>
                <a className="flex items-center gap-4 p-4 rounded-xl bg-[#25d366]/20 hover:bg-[#25d366]/30 text-foreground transition-all border border-[#25d366]/30" href={`https://wa.me/?text=${encodeURIComponent((typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || '')) + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">
                  <FaWhatsapp className="text-2xl text-[#25d366]" />
                  <span className="font-medium">{lang === 'en' ? 'WhatsApp' : 'வாட்ஸ்அப்'}</span>
                </a>
                <button className="flex items-center gap-4 p-4 rounded-xl bg-surface/5 hover:bg-surface/10 text-foreground transition-all border border-border/10" type="button" onClick={() => navigator.clipboard?.writeText(shareUrl)}>
                  <FaLink className="text-2xl text-foreground-muted" />
                  <span className="font-medium">{lang === 'en' ? 'Copy Link' : 'இணைப்பை நகலெடு'}</span>
                </button>
              </div>
            </div>

            {/* Recruitment Section - single role */}
            <div className="lg:col-span-2 card-morphism p-8 rounded-2xl border border-border/10 bg-gradient-to-br from-surface/80 to-primary/10 backdrop-blur-md relative overflow-hidden" id="recruitment-section">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <FaUsers className="text-9xl text-foreground" />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 border-b border-border/10 pb-4">
                  <h4 className="text-2xl font-bold text-foreground">{lang === 'en' ? 'Join Our Team' : 'எங்கள் அணியில் சேருங்கள்'}</h4>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 uppercase tracking-wide">{formStatusLabel}</span>
                </div>
                <p className="text-foreground-secondary text-lg mb-8 leading-relaxed">{form?.description?.[lang] || (lang === 'en' ? 'Be part of this initiative and help us preserve Tamil language and culture.' : 'இந்த முயற்சியின் ஒரு பகுதியாக இருந்து தமிழ் மொழி மற்றும் பண்பாட்டை பாதுகாக்க நம்முடன் சேருங்கள்.')}</p>
                <div className="flex justify-start">
                  <button
                    className="flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-lg hover:from-primary-dark hover:to-secondary-dark transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                    type="button"
                    disabled={!form || form.status !== 'open'}
                    onClick={() => setShowForm(true)}
                  >
                    <FaUsers />
                    <span>{roleButtonText}</span>
                  </button>
                </div>
              </div>
              
              {showForm && form && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4 bg-background/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowForm(false)}>
                  <div className="w-full h-full md:h-[90vh] md:max-w-7xl bg-surface/95 border border-border/50 md:rounded-2xl shadow-2xl backdrop-blur-xl animate-slide-in-up overflow-y-auto custom-scrollbar relative z-[10000] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="modern-modal-header sticky top-0 bg-surface/95 backdrop-blur z-20 border-b border-border/50 px-6 py-4 flex justify-between items-center shrink-0">
                      <div>
                        <h2 className="modern-modal-title flex items-center gap-3 text-2xl font-bold text-foreground">
                          <FaUsers className="text-primary" />
                          {form.title?.[lang] || (lang === 'en' ? 'Join Our Team' : 'எங்கள் அணியில் சேருங்கள்')}
                        </h2>
                        <p className="modal-subtitle mt-1 text-foreground-secondary">{form.description?.[lang] || (lang === 'en' ? 'Be part of this initiative' : 'இந்த முயற்சியின் ஒரு பகுதியாக இருங்கள்')}</p>
                      </div>
                      <button 
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-hover hover:bg-error/10 hover:text-error transition-colors text-foreground-secondary" 
                        onClick={() => setShowForm(false)}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>
                    
                    <div className="modern-modal-body space-y-8 p-6 md:p-8 overflow-y-auto flex-grow">
                      <div className="form-section">
                        <h3 className="section-title text-primary">
                          {lang === 'en' ? 'Personal Information' : 'தனிப்பட்ட தகவல்கள்'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="modern-field-group">
                            <label className="modern-label">{lang === 'en' ? 'Your Name' : 'உங்கள் பெயர்'} <span className="text-error">*</span></label>
                            <div className="relative">
                              <input 
                                className={`modern-input pl-10 ${fieldErrors.applicantName ? 'border-error' : ''}`}
                                type="text" 
                                value={applicantName} 
                                onChange={(e) => {
                                  setApplicantName(e.target.value);
                                  if (fieldErrors.applicantName) setFieldErrors(prev => ({ ...prev, applicantName: '' }));
                                }} 
                                placeholder={lang === 'en' ? 'Enter your full name' : 'உங்கள் முழு பெயரை உள்ளிடவும்'}
                              />
                              <FaUser className="absolute left-3 top-3.5 text-foreground-muted" />
                            </div>
                            {fieldErrors.applicantName && (
                              <div className="error-message">
                                <FaExclamationTriangle />
                                <span>{fieldErrors.applicantName}</span>
                              </div>
                            )}
                          </div>
                          <div className="modern-field-group">
                            <label className="modern-label">{lang === 'en' ? 'Email' : 'மின்னஞ்சல்'} <span className="text-error">*</span></label>
                            <div className="relative">
                              <input 
                                className={`modern-input pl-10 ${fieldErrors.applicantEmail ? 'border-error' : ''}`}
                                type="email" 
                                value={applicantEmail} 
                                onChange={(e) => {
                                  setApplicantEmail(e.target.value);
                                  if (fieldErrors.applicantEmail) setFieldErrors(prev => ({ ...prev, applicantEmail: '' }));
                                }} 
                                placeholder={lang === 'en' ? 'Enter your email address' : 'உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்'}
                              />
                              <FaEnvelope className="absolute left-3 top-3.5 text-foreground-muted" />
                            </div>
                            {fieldErrors.applicantEmail && (
                              <div className="error-message">
                                <FaExclamationTriangle />
                                <span>{fieldErrors.applicantEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {(form.fields || []).length > 0 && (
                        <div className="form-section">
                          <h3 className="section-title text-primary">
                            {lang === 'en' ? 'Additional Information' : 'கூடுதல் தகவல்கள்'}
                          </h3>
                          <div className="space-y-6">
                            {(form.fields || []).map((f) => (
                              <div key={f.id} className="modern-field-group">
                                <label className="modern-label">
                                  {f.label?.[lang] || f.id}
                                  {f.required && <span className="text-error ml-1">*</span>}
                                </label>
                                {renderField(f)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(submitError || submitOk !== null) && (
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${submitError ? 'bg-error/10 border-error/20 text-error' : 'bg-success/10 border-success/20 text-success'}`}>
                          {submitError ? <FaExclamationTriangle /> : <FaCheckCircle />}
                          <span>{submitError || (lang === 'en' ? 'Thank you! We received your application.' : 'நன்றி! உங்கள் விண்ணப்பத்தை பெற்றோம்.')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="modern-modal-footer border-t border-border/10 p-6 bg-background/95 backdrop-blur z-20 shrink-0 flex justify-end gap-4">
                      <button 
                        className="px-6 py-3 rounded-xl border border-border bg-surface hover:bg-surface-hover text-foreground font-medium transition-all" 
                        type="button" 
                        onClick={() => setShowForm(false)}
                      >
                        {lang === 'en' ? 'Cancel' : 'ரத்து செய்யவும்'}
                      </button>
                      <button 
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2" 
                        type="button" 
                        onClick={submitRecruitment} 
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            <span>{lang === 'en' ? 'Submitting...' : 'சமர்ப்பித்து வருகிறது...'}</span>
                          </>
                        ) : (
                          <>
                            <FaPaperPlane />
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
      <section className="py-12 relative z-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 border-l-4 border-primary pl-4">{lang === 'en' ? 'Gallery' : 'காட்சி'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {gallery.slice(0, 10).map((src, idx) => (
              <div key={idx} className="card-morphism rounded-xl overflow-hidden group hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-300 border border-border/10 bg-surface/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={src} 
                  alt={`${item.title?.[lang] || item.title?.en || item.title || ''} image ${idx + 1}`} 
                  className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700" 
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details Overview - show all available info except IDs */}
      <section className="py-12 bg-surface/20 relative z-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 border-l-4 border-primary pl-4">{lang === 'en' ? 'Details Overview' : 'விவரங்களின் கண்ணோட்டம்'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {item.goals?.[lang] && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-primary/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{lang === 'en' ? 'Goals' : 'இலக்குகள்'}</span>
                  <p className="text-foreground-secondary leading-relaxed">{typeof item.goals === 'string' ? item.goals : (item.goals?.[lang] || item.goals?.en || '')}</p>
                </div>
              </div>
            )}
            {item.achievement?.[lang] && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-secondary/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-secondary mb-2 uppercase tracking-wider">{lang === 'en' ? 'Achievement' : 'சாதனை'}</span>
                  <p className="text-foreground-secondary leading-relaxed">{typeof item.achievement === 'string' ? item.achievement : (item.achievement?.[lang] || item.achievement?.en || '')}</p>
                </div>
              </div>
            )}
            {item.location?.[lang] && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-error/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-error mb-2 uppercase tracking-wider">{lang === 'en' ? 'Location' : 'இடம்'}</span>
                  <p className="text-foreground-secondary leading-relaxed">{typeof item.location === 'string' ? item.location : (item.location?.[lang] || item.location?.en || '')}</p>
                </div>
              </div>
            )}
            {typeof item.budget === 'number' && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-success/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-success mb-2 uppercase tracking-wider">{lang === 'en' ? 'Budget' : 'நிதி'}</span>
                  <p className="text-2xl font-bold text-foreground">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.budget)}</p>
                </div>
              </div>
            )}
            {typeof item.participants === 'number' && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-warning/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-warning mb-2 uppercase tracking-wider">{lang === 'en' ? 'Participants' : 'பங்கேற்பாளர்கள்'}</span>
                  <p className="text-2xl font-bold text-foreground">{item.participants}</p>
                </div>
              </div>
            )}
            {item.type && (
              <div className="card-morphism p-6 rounded-2xl border border-border/10 bg-surface/60 backdrop-blur-md hover:border-info/30 transition-colors">
                <div className="flex flex-col h-full">
                  <span className="text-sm font-semibold text-info mb-2 uppercase tracking-wider">{lang === 'en' ? 'Type' : 'வகை'}</span>
                  <p className="text-xl font-bold text-foreground text-capitalize">{
                    item.type === 'project' ? (lang === 'en' ? 'Project' : 'திட்டம்') :
                    item.type === 'activity' ? (lang === 'en' ? 'Activity' : 'செயல்பாடு') :
                    item.type === 'initiative' ? (lang === 'en' ? 'Initiative' : 'முயற்சி') :
                    item.type
                  }</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}