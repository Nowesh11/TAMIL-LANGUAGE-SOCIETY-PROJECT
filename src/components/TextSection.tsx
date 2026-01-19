"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };

type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  format?: 'plain' | 'markdown' | 'html';
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
};

type ComponentRecord = {
  type: string;
  content: TextContent;
  slug?: string;
};

export default function TextSection({ page = 'about', slug, data: propData }: { page?: string; slug?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TextContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as TextContent);
      setLoading(false);
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
        let record = list.find((c) => c.type === 'text');
        if (slug) {
          const bySlug = list.find((c) => c.type === 'text' && c.slug === slug);
          if (bySlug) record = bySlug;
        }
        if (record?.content) setData(record.content);
        else setData(null);
      } catch (e) {
        console.error('Failed to load text section', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, slug, propData]);

  const content: TextContent | null = data;

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-7 bg-slate-300/40 dark:bg-white/10 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-2/3 mx-auto" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-2/3 mx-auto" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-1/2 mx-auto" />
        </div>
      </section>
    );
  }

  if (!content) return null;

    const Title = content?.title ? (
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
        {content.title?.[lang] || content.title?.en || ''}
      </h2>
    ) : null;

    const fontSize = content?.fontSize ?? 'md';
    const fontWeight = content?.fontWeight ?? 'normal';
    const alignment = content?.alignment ?? 'left';

    const bodyClass = `text-slate-700 dark:text-slate-300 ${
      fontSize === 'sm' ? 'text-sm' :
      fontSize === 'md' ? 'text-base' :
      fontSize === 'lg' ? 'text-lg' :
      fontSize === 'xl' ? 'text-xl' :
      fontSize === '2xl' ? 'text-2xl' : 'text-base'
    } ${
      fontWeight === 'normal' ? 'font-normal' :
      fontWeight === 'medium' ? 'font-medium' :
      fontWeight === 'semibold' ? 'font-semibold' :
      fontWeight === 'bold' ? 'font-bold' : 'font-normal'
    } ${
      alignment === 'center' ? 'text-center' :
      alignment === 'right' ? 'text-right' :
      alignment === 'justify' ? 'text-justify' : 'text-left'
    }`;

    const Body = (
      <div className={bodyClass}>
        {content?.format === 'html' ? (
          <div dangerouslySetInnerHTML={{ __html: content?.content?.[lang] || content?.content?.en || '' }} />
        ) : content ? (
          <p>{content?.content?.[lang] || content?.content?.en || ''}</p>
        ) : null}
      </div>
    );

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10 max-w-5xl">
        <div className="card-morphism p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl animate-slide-in-up">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-white/10 rounded w-full" />
              <div className="h-4 bg-white/10 rounded w-5/6" />
              <div className="h-4 bg-white/10 rounded w-4/5" />
            </div>
          ) : error ? null : (
            <>
              {content?.title && (
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white drop-shadow-lg text-center gradient-title">
                  <span className="animate-text-glow">{content.title?.[lang] || content.title?.en || ''}</span>
                </h2>
              )}
              
              <div className={`text-gray-300 leading-relaxed ${
                fontSize === 'sm' ? 'text-sm' :
                fontSize === 'md' ? 'text-base' :
                fontSize === 'lg' ? 'text-lg' :
                fontSize === 'xl' ? 'text-xl' :
                fontSize === '2xl' ? 'text-2xl' : 'text-base'
              } ${
                fontWeight === 'normal' ? 'font-normal' :
                fontWeight === 'medium' ? 'font-medium' :
                fontWeight === 'semibold' ? 'font-semibold' :
                fontWeight === 'bold' ? 'font-bold' : 'font-normal'
              } ${
                alignment === 'center' ? 'text-center' :
                alignment === 'right' ? 'text-right' :
                alignment === 'justify' ? 'text-justify' : 'text-left'
              }`}>
                {content?.format === 'html' ? (
                  <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content?.content?.[lang] || content?.content?.en || '' }} />
                ) : (
                  <p className="whitespace-pre-line">{content?.content?.[lang] || content?.content?.en || ''}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}