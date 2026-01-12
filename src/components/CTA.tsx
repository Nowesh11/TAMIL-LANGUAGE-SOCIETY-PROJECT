"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';
import '../styles/components/CTA.css';

type Bilingual = { en: string; ta: string };
type Button = { text: Bilingual; url: string; variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; target?: '_blank' | '_self' };

type CTAContent = {
  title: Bilingual;
  subtitle?: Bilingual;
  description?: Bilingual;
  buttons: Button[];
};

type ComponentRecord = { type: string; content: CTAContent };

export default function CTA({ page = 'home', bureau, data: propData }: { page?: string; bureau?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<CTAContent | null>(propData || null);
  const [loading, setLoading] = useState<boolean>(!propData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (propData) return;
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
        if (record?.content) {
          setData(record.content);
        } else {
          setData(null);
          setError('CTA content not found in database');
        }
      } catch (e) {
        console.error('Failed to load CTA', e);
        setError('Failed to load CTA content');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, bureau]);

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  if (loading) {
    return (
      <section className="cta-container bg-section-gradient">
        <div className="cta-content">
          <div className="card-morphism shimmer">
            <p className="text-muted animate-fade-in">Loading call to action...</p>
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
    <section className="cta-container bg-section-gradient">
      <div className="cta-content">
        <div className="cta-header">
          <h2 className="cta-title gradient-title animate-text-glow">{(title?.[lang] || title?.en || (typeof title === 'string' ? title : ''))}</h2>
          {subtitle ? (
            <p className="cta-subtitle animate-fade-in animate-stagger-1">{(subtitle?.[lang] || subtitle?.en || (typeof subtitle === 'string' ? subtitle : ''))}</p>
          ) : null}
          {description ? (
            <p className="cta-description animate-fade-in animate-stagger-2">{(description?.[lang] || description?.en || (typeof description === 'string' ? description : ''))}</p>
          ) : null}
        </div>
        {buttons && buttons.length > 0 ? (
          <div className="cta-actions">
            {buttons.map((b, i) => (
              <a
                key={i}
                href={b.url}
                target={b.target || '_self'}
                className={`cta-button ${b.variant === 'secondary' ? 'cta-button-secondary btn-glass hover-lift' : 'cta-button-primary btn-neon hover-glow'} animate-slide-in-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {(b.text?.[lang] || b.text?.en || (typeof b.text === 'string' ? b.text : ''))}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}