"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };
type Button = { text: Bilingual; url: string; variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; target?: '_blank' | '_self' };

type CTAContent = {
  title: Bilingual;
  subtitle?: Bilingual;
  description?: Bilingual;
  buttons: Button[];
};

type ComponentRecord = { type: string; content: CTAContent };

export default function CTA({ page = 'home', bureau }: { page?: string; bureau?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<CTAContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const url = (() => {
          try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const u = new URL('/api/components/page', origin || 'http://localhost:3000');
            u.searchParams.set('page', page);
            if (bureau) u.searchParams.set('bureau', bureau);
            return u.toString();
          } catch {
            const qs = new URLSearchParams({ page });
            if (bureau) qs.set('bureau', bureau);
            return `/api/components/page?${qs.toString()}`;
          }
        })();
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'cta');
        if (record?.content) setData(record.content);
        else {
          // Provide a graceful fallback CTA content
          setData({
            title: { en: 'Join Us', ta: 'எங்களுடன் சேருங்கள்' },
            subtitle: { en: 'Be part of our journey', ta: 'எங்கள் பயணத்தில் பங்கேற்கவும்' },
            description: { en: 'Support Tamil language and culture by engaging with our projects and events.', ta: 'எங்கள் திட்டங்கள் மற்றும் நிகழ்வுகளில் பங்கேற்பதன் மூலம் தமிழ் மொழி மற்றும் பண்பாட்டை ஆதரிக்கவும்.' },
            buttons: [
              { text: { en: 'Explore Projects', ta: 'திட்டங்களை பாருங்கள்' }, url: '/projects', variant: 'primary' },
              { text: { en: 'Learn More', ta: 'மேலும் அறிக' }, url: '/about', variant: 'secondary' }
            ]
          });
          setError(null);
        }
      } catch (e) {
        console.error('Failed to load CTA', e);
        // Keep UI stable with default CTA on network errors
        setData({
          title: { en: 'Join Us', ta: 'எங்களுடன் சேருங்கள்' },
          subtitle: { en: 'Be part of our journey', ta: 'எங்கள் பயணத்தில் பங்கேற்கவும்' },
          description: { en: 'Support Tamil language and culture by engaging with our projects and events.', ta: 'எங்கள் திட்டங்கள் மற்றும் நிகழ்வுகளில் பங்கேற்பதன் மூலம் தமிழ் மொழி மற்றும் பண்பாட்டை ஆதரிக்கவும்.' },
          buttons: [
            { text: { en: 'Explore Projects', ta: 'திட்டங்களை பாருங்கள்' }, url: '/projects', variant: 'primary' }
          ]
        });
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, bureau]);

  if (loading) {
    return (
      <section className="features">
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', padding: '3rem' }}>
            <p className="text-muted">Loading call to action...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!data || error) {
    return null;
  }

  const { title, subtitle, description, buttons } = data;

  return (
    <section className="features">
      <div className="container">
        <div className="card" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>{title[lang]}</h2>
          {subtitle ? (
            <p style={{ fontSize: '1rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>{subtitle[lang]}</p>
          ) : null}
          {description ? (
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', marginBottom: '2rem', lineHeight: 1.8 }}>{description[lang]}</p>
          ) : null}
          {buttons && buttons.length > 0 ? (
            <div className="hero-buttons" style={{ justifyContent: 'center', display: 'flex', gap: '1rem' }}>
              {buttons.map((b, i) => (
                <a
                  key={i}
                  href={b.url}
                  target={b.target || '_self'}
                  className={b.variant === 'secondary' ? 'btn btn-secondary' : 'btn btn-primary'}
                >
                  {b.text[lang]}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}