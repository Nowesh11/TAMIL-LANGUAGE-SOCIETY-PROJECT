"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Vision.css';

type Bilingual = { en: string; ta: string };
type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: 'plain' | 'markdown' | 'html';
};
type ComponentRecord = { type: string; content: TextContent; slug?: string };

export default function Vision({ page = 'about', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TextContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as TextContent);
      setLoading(false);
      setError(null);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const url = (() => {
          try {
            const base = typeof window !== 'undefined' ? window.location.origin : '';
            const u = new URL('/api/components/page', base || 'http://localhost:3000');
            u.searchParams.set('page', page);
            return u.toString();
          } catch {
            const qs = new URLSearchParams({ page });
            return `/api/components/page?${qs.toString()}`;
          }
        })();
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'text' && c.slug === 'vision');
        if (record?.content) {
          setData(record.content);
        } else {
          setData(null);
          setError('Vision content not found in database');
        }
      } catch (e) {
        console.error('Failed to load vision', e);
        setError('Failed to load vision content');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  return (
    <section className="vision-section">
      <div className="vision-container">
        {loading ? (
          <div className="vision-loading">
            <div className="vision-visual-skeleton"></div>
            <div className="vision-text-skeleton">
              <div className="vision-skeleton-badge"></div>
              <div className="vision-skeleton-title"></div>
              <div className="vision-skeleton-description"></div>
              <div className="vision-skeleton-description"></div>
              <div className="vision-skeleton-description"></div>
              <div className="vision-skeleton-goals">
                <div className="vision-skeleton-goal"></div>
                <div className="vision-skeleton-goal"></div>
                <div className="vision-skeleton-goal"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="faq-no-results">
            <div className="faq-no-results-icon">⚠️</div>
            <div className="faq-no-results-text">
              {lang === 'en' ? 'Unable to load vision.' : 'எங்கள் பார்வையை ஏற்ற முடியவில்லை.'}
            </div>
          </div>
        ) : data ? (
          <div className="vision-content">
            <div className="vision-visual">
              <img 
                src="/images/vision-hero.jpg" 
                alt={lang === 'en' ? 'Our Vision' : 'எங்கள் பார்வை'}
                className="vision-image"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwQzMwNS4yMjggMTUwIDM1MCAyMDUuMjI4IDM1MCAyNjBDMzUwIDMxNC43NzIgMzA1LjIyOCAzNzAgMjUwIDM3MEM5NC43NzIgMzcwIDE1MCAzMTQuNzcyIDE1MCAyNjBDMTUwIDIwNS4yMjggMTk0Ljc3MiAxNTAgMjUwIDE1MFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIzMCAyMDBIMjcwVjMyMEgyMzBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIzMEgzMDBWMjkwSDIwMFYyMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPlZpc2lvbiBJbWFnZTwvdGV4dD4KPC9zdmc+Cg==';
                }}
              />
              
              <div className="vision-overlay">
                <div className="vision-overlay-number">2030</div>
                <div className="vision-overlay-text">
                  {lang === 'en' ? 'Vision' : 'பார்வை'}
                </div>
              </div>
            </div>
            
            <div className="vision-text">
              <div className="vision-badge">
                <span>🔮</span>
                {lang === 'en' ? 'Our Vision' : 'எங்கள் பார்வை'}
              </div>
              
              {data.title && (
                <h2 className="vision-title">
                  <span className="highlight">{data.title?.[lang] || data.title?.en || ''}</span>
                </h2>
              )}
              
              <p className="vision-description">
                {data.content?.[lang] || data.content?.en || ''}
              </p>
              
              <div className="vision-goals">
                <div className="vision-goal">
                  <div className="vision-goal-icon">🌟</div>
                  <div className="vision-goal-content">
                    <div className="vision-goal-title">
                      {lang === 'en' ? 'Global Recognition' : 'உலகளாவிய அங்கீகாரம்'}
                    </div>
                    <div className="vision-goal-description">
                      {lang === 'en' 
                        ? 'Making Tamil a globally recognized and celebrated language'
                        : 'தமிழை உலகளவில் அங்கீகரிக்கப்பட்ட மற்றும் கொண்டாடப்படும் மொழியாக மாற்றுதல்'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="vision-goal">
                  <div className="vision-goal-icon">🚀</div>
                  <div className="vision-goal-content">
                    <div className="vision-goal-title">
                      {lang === 'en' ? 'Digital Innovation' : 'டிஜிட்டல் புதுமை'}
                    </div>
                    <div className="vision-goal-description">
                      {lang === 'en' 
                        ? 'Leading Tamil language technology and digital transformation'
                        : 'தமிழ் மொழி தொழில்நுட்பம் மற்றும் டிஜிட்டல் மாற்றத்தில் முன்னணியில் இருத்தல்'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="vision-goal">
                  <div className="vision-goal-icon">🌱</div>
                  <div className="vision-goal-content">
                    <div className="vision-goal-title">
                      {lang === 'en' ? 'Future Generations' : 'எதிர்கால சந்ததியினர்'}
                    </div>
                    <div className="vision-goal-description">
                      {lang === 'en' 
                        ? 'Inspiring young minds to embrace and advance Tamil culture'
                        : 'இளம் மனங்களை தமிழ் கலாச்சாரத்தை ஏற்று முன்னேற்ற ஊக்குவித்தல்'
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="vision-cta">
                <button className="vision-btn vision-btn-primary">
                  {lang === 'en' ? 'Be Part of Our Vision' : 'எங்கள் பார்வையின் பகுதியாக இருங்கள்'}
                  <span>→</span>
                </button>
                <button className="vision-btn vision-btn-secondary">
                  {lang === 'en' ? 'Explore More' : 'மேலும் ஆராயுங்கள்'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        
        <div className="vision-timeline"></div>
      </div>
      
      <div className="vision-decoration"></div>
      <div className="vision-decoration"></div>
    </section>
  );
}