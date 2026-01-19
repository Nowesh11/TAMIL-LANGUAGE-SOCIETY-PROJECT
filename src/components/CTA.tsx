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
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="layout-container text-center">
          <div className="h-12 bg-white/20 rounded-lg w-2/3 mx-auto mb-6 animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded-lg w-1/2 mx-auto mb-8 animate-pulse"></div>
          <div className="h-12 bg-white/20 rounded-lg w-40 mx-auto animate-pulse"></div>
        </div>
      </section>
    );
  }

  if (!data || error) {
    return null;
  }

  const { title, subtitle, description, buttons } = data;

  return (
    <section className="py-24 relative overflow-hidden aurora-bg">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="layout-container relative z-10 text-center text-white">
        <div className="max-w-4xl mx-auto card-morphism p-12 rounded-3xl border border-white/10 shadow-2xl">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-tight text-white drop-shadow-lg">
            {(title?.[lang] || title?.en || (typeof title === 'string' ? title : ''))}
          </h2>
          
          {subtitle ? (
            <p className="text-xl md:text-2xl font-medium text-gray-200 mb-6 drop-shadow-md">
              {(subtitle?.[lang] || subtitle?.en || (typeof subtitle === 'string' ? subtitle : ''))}
            </p>
          ) : null}
          
          {description ? (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
              {(description?.[lang] || description?.en || (typeof description === 'string' ? description : ''))}
            </p>
          ) : null}
          
          {buttons && buttons.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4">
              {buttons.map((b, i) => (
                <a
                  key={i}
                  href={b.url}
                  target={b.target || '_self'}
                  className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                    b.variant === 'secondary' 
                      ? 'bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20' 
                      : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25'
                  }`}
                >
                  {(b.text?.[lang] || b.text?.en || (typeof b.text === 'string' ? b.text : ''))}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
