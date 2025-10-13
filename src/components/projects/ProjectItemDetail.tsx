"use client";
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../hooks/LanguageContext';

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
      type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'number' | 'date' | 'tel' | 'url';
      required?: boolean;
      placeholder?: Bilingual;
    }[];
  }>(null);
  const [showForm, setShowForm] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitOk, setSubmitOk] = useState<null | boolean>(null);

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

  if (loading) return <div className="layout-container">Loading...</div>;
  if (!item) return <div className="layout-container">Not found</div>;

  const hero = item.heroImagePath || item.images?.[0];
  const gallery = (item.images || []).slice(0, 10);
  const pct = typeof item.progressPercent === 'number' ? Math.max(0, Math.min(100, item.progressPercent)) : undefined;
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
    try {
      const payload = {
        applicantName,
        applicantEmail,
        answers: Object.entries(answers).map(([key, value]) => ({ key, value })),
      };
      const res = await fetch(`/api/project-items/${id}/recruitment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setSubmitOk(true);
        setShowForm(false);
      } else {
        setSubmitOk(false);
      }
    } catch (e) {
      console.warn(e);
      setSubmitOk(false);
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
          <h1 className="gradient-title detail-hero-title">{item.title[lang]}</h1>
          <p className="detail-hero-subtitle">{item.shortDesc[lang]}</p>
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
                  <h3>{(item.directorName && item.directorName[lang]) || (lang === 'en' ? 'N/A' : 'தகவல் இல்லை')}</h3>
                  <p>{lang === 'en' ? 'Lead person' : 'முன்னணி பொறுப்பாளர்'}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="project-card">
              <div className="project-card-content">
                <div className="project-content">
                  <span className="project-category">{lang === 'en' ? 'Status' : 'நிலை'}</span>
                  <h3 style={{ textTransform: 'capitalize' }}>{(item.progress || item.status || '').replace(/-/g, ' ')}</h3>
                  {typeof pct === 'number' ? (
                    <div className="project-progress">
                      <div>
                        <span>{lang === 'en' ? 'Progress' : 'முனேற்றம்'}</span>
                        <span>{pct}%</span>
                      </div>
                      <div>
                        <div style={{ width: `${pct}%` }} />
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
            <p className="detail-full-desc">{item.fullDesc[lang]}</p>
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
                <a className="share-btn twitter" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(item.title[lang])}`} target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-twitter" />
                  <span>{lang === 'en' ? 'Twitter' : 'ட்விட்டர்'}</span>
                </a>
                <a className="share-btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(item.title[lang] + ' ' + shareUrl)}`} target="_blank" rel="noopener noreferrer">
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
                <div className="recruitment-form">
                  <div className="form-row">
                    <div className="form-field">
                      <label className="form-label">{lang === 'en' ? 'Your Name' : 'உங்கள் பெயர்'}</label>
                      <input className="form-input" type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{lang === 'en' ? 'Email' : 'மின்னஞ்சல்'}</label>
                      <input className="form-input" type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} required />
                    </div>
                  </div>
                  {(form.fields || []).map((f) => (
                    <div key={f.id} className="form-field">
                      <label className="form-label">{f.label?.[lang] || f.id}</label>
                      {f.type === 'textarea' ? (
                        <textarea
                          className="form-textarea"
                          value={answers[f.id] || ''}
                          placeholder={f.placeholder?.[lang] || ''}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          required={!!f.required}
                        />
                      ) : (
                        <input
                          className="form-input"
                          type={['text','email','number','date','tel','url'].includes(f.type) ? f.type : 'text'}
                          value={answers[f.id] || ''}
                          placeholder={f.placeholder?.[lang] || ''}
                          onChange={(e) => setAnswers((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          required={!!f.required}
                        />
                      )}
                    </div>
                  ))}
                  <div className="form-actions">
                    <button className="submit-btn" type="button" onClick={submitRecruitment} disabled={submitting}>
                      {submitting ? (lang === 'en' ? 'Submitting...' : 'சமர்ப்பித்து வருகிறது...') : (lang === 'en' ? 'Submit' : 'சமர்ப்பிக்கவும்')}
                    </button>
                    <button className="cancel-btn" type="button" onClick={() => setShowForm(false)}>
                      {lang === 'en' ? 'Cancel' : 'ரத்து செய்யவும்'}
                    </button>
                  </div>
                  {submitOk === true && <div>{lang === 'en' ? 'Thank you! We received your application.' : 'நன்றி! உங்கள் விண்ணப்பத்தை பெற்றோம்.'}</div>}
                  {submitOk === false && <div>{lang === 'en' ? 'Submission failed. Please try again.' : 'சமர்ப்பிப்பு தோல்வியடைந்தது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'}</div>}
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
                <img src={src} alt={`${item.title[lang]} image ${idx + 1}`} className="gallery-img" />
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
                <p>{item.goals[lang]}</p>
              </div></div></div>
            )}
            {item.achievement?.[lang] && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Achievement' : 'சாதனை'}</span>
                <p>{item.achievement[lang]}</p>
              </div></div></div>
            )}
            {item.location?.[lang] && (
              <div className="project-card"><div className="project-card-content"><div className="project-content">
                <span className="project-category">{lang === 'en' ? 'Location' : 'இடம்'}</span>
                <p>{item.location[lang]}</p>
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
                <p style={{ textTransform: 'capitalize' }}>{item.type}</p>
              </div></div></div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}