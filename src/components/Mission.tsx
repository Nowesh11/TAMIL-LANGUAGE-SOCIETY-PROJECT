"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Mission.css';

type Bilingual = { en: string; ta: string };
type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: 'plain' | 'markdown' | 'html';
};
type ComponentRecord = { type: string; content: TextContent; slug?: string };

export default function Mission({ page = 'about', data: propData }: { page?: string; data?: any }) {
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
        const record = list.find((c) => c.type === 'text' && c.slug === 'mission');
        if (record?.content) setData(record.content);
        else {
          setData(null);
          setError('Mission content not found in database');
        }
      } catch (e) {
        console.error('Failed to load mission', e);
        setData(null);
        setError('Failed to load mission content');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);
  const content: TextContent | null = data;

  return (
    <section className="mission-section">
      <div className="mission-container">
        {loading ? (
          <div className="mission-loading">
            <div className="mission-text-skeleton">
              <div className="mission-skeleton-badge"></div>
              <div className="mission-skeleton-title"></div>
              <div className="mission-skeleton-description"></div>
              <div className="mission-skeleton-description"></div>
              <div className="mission-skeleton-description"></div>
            </div>
            <div className="mission-visual-skeleton"></div>
          </div>
        ) : error ? (
          <div className="faq-no-results">
            <div className="faq-no-results-icon">⚠️</div>
            <div className="faq-no-results-text">
              {lang === 'en' ? 'Unable to load mission.' : 'எங்கள் பணியை ஏற்ற முடியவில்லை.'}
            </div>
          </div>
        ) : content ? (
          <div className="mission-content">
            <div className="mission-text">
              <div className="mission-badge">
                <span>🎯</span>
                {lang === 'en' ? 'Our Mission' : 'எங்கள் பணி'}
              </div>
              
              {content.title && (
                <h2 className="mission-title">
                  <span className="highlight">{content.title?.[lang] || content.title?.en || ''}</span>
                </h2>
              )}
              
              <p className="mission-description">
                {content.content?.[lang] || content.content?.en || ''}
              </p>
              
              <div className="mission-features">
                <div className="mission-feature">
                  <div className="mission-feature-icon">📚</div>
                  <div className="mission-feature-content">
                    <div className="mission-feature-title">
                      {lang === 'en' ? 'Educational Excellence' : 'கல்வி சிறப்பு'}
                    </div>
                    <div className="mission-feature-description">
                      {lang === 'en' 
                        ? 'Promoting Tamil language education and literacy worldwide'
                        : 'உலகம் முழுவதும் தமிழ் மொழி கல்வி மற்றும் எழுத்தறிவை ஊக்குவித்தல்'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="mission-feature">
                  <div className="mission-feature-icon">🌍</div>
                  <div className="mission-feature-content">
                    <div className="mission-feature-title">
                      {lang === 'en' ? 'Cultural Preservation' : 'கலாச்சார பாதுகாப்பு'}
                    </div>
                    <div className="mission-feature-description">
                      {lang === 'en' 
                        ? 'Preserving and celebrating Tamil heritage for future generations'
                        : 'எதிர்கால சந்ததியினருக்காக தமிழ் பாரம்பரியத்தை பாதுகாத்து கொண்டாடுதல்'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="mission-feature">
                  <div className="mission-feature-icon">🤝</div>
                  <div className="mission-feature-content">
                    <div className="mission-feature-title">
                      {lang === 'en' ? 'Community Building' : 'சமூக கட்டமைப்பு'}
                    </div>
                    <div className="mission-feature-description">
                      {lang === 'en' 
                        ? 'Connecting Tamil communities across the globe'
                        : 'உலகம் முழுவதும் தமிழ் சமூகங்களை இணைத்தல்'
                      }
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mission-cta">
                <button className="mission-btn mission-btn-primary">
                  {lang === 'en' ? 'Join Our Mission' : 'எங்கள் பணியில் சேருங்கள்'}
                  <span>→</span>
                </button>
                <button className="mission-btn mission-btn-secondary">
                  {lang === 'en' ? 'Learn More' : 'மேலும் அறிக'}
                </button>
              </div>
            </div>
            
            <div className="mission-visual">
              <img 
                src="/images/mission-hero.jpg" 
                alt={lang === 'en' ? 'Our Mission' : 'எங்கள் பணி'}
                className="mission-image"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNTAgMTUwQzMwNS4yMjggMTUwIDM1MCAyMDUuMjI4IDM1MCAyNjBDMzUwIDMxNC43NzIgMzA1LjIyOCAzNzAgMjUwIDM3MEM5NC43NzIgMzcwIDE1MCAzMTQuNzcyIDE1MCAyNjBDMTUwIDIwNS4yMjggMTk0Ljc3MiAxNTAgMjUwIDE1MFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTIzMCAyMDBIMjcwVjMyMEgyMzBWMjAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjAwIDIzMEgzMDBWMjkwSDIwMFYyMzBaIiBmaWxsPSIjOUNBM0FGIi8+Cjx0ZXh0IHg9IjI1MCIgeT0iNDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjc3NDhGIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiPk1pc3Npb24gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
              
              <div className="mission-stats">
                <div className="mission-stat">
                  <div className="mission-stat-number">50+</div>
                  <div className="mission-stat-label">
                    {lang === 'en' ? 'Years' : 'ஆண்டுகள்'}
                  </div>
                </div>
                <div className="mission-stat">
                  <div className="mission-stat-number">10K+</div>
                  <div className="mission-stat-label">
                    {lang === 'en' ? 'Members' : 'உறுப்பினர்கள்'}
                  </div>
                </div>
                <div className="mission-stat">
                  <div className="mission-stat-number">100+</div>
                  <div className="mission-stat-label">
                    {lang === 'en' ? 'Events' : 'நிகழ்வுகள்'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      
      <div className="mission-decoration"></div>
      <div className="mission-decoration"></div>
    </section>
  );
}