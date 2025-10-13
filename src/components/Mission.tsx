"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type TextContent = {
  title?: Bilingual;
  content: Bilingual;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  format?: 'plain' | 'markdown' | 'html';
};
type ComponentRecord = { type: string; content: TextContent; slug?: string };

export default function Mission({ page = 'about' }: { page?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TextContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          setData({
            title: { en: 'Our Mission', ta: 'எங்கள் பணி' },
            content: {
              en: 'Promote and preserve Tamil language, literature, and heritage through inclusive programs.',
              ta: 'அனைவரையும் உள்ளடக்கிய நிகழ்ச்சிகள் மூலம் தமிழ் மொழி, இலக்கியம், மரபை வளர்த்தல் மற்றும் பாதுகாத்தல்.',
            },
            alignment: 'center',
            format: 'plain',
          });
        }
      } catch (e) {
        console.error('Failed to load mission', e);
        setData({
          title: { en: 'Our Mission', ta: 'எங்கள் பணி' },
          content: {
            en: 'Promote and preserve Tamil language, literature, and heritage through inclusive programs.',
            ta: 'அனைவரையும் உள்ளடக்கிய நிகழ்ச்சிகள் மூலம் தமிழ் மொழி, இலக்கியம், மரபை வளர்த்தல் மற்றும் பாதுகாத்தல்.',
          },
          alignment: 'center',
          format: 'plain',
        });
        setError(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);
  const content: TextContent | null = data;

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {loading ? (
        <div className="space-y-3 animate-pulse text-center">
          <div className="h-7 bg-slate-300/40 dark:bg-white/10 rounded w-1/3 mx-auto" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-2/3 mx-auto" />
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <p className="text-red-700 dark:text-red-300">{lang === 'en' ? 'Unable to load mission.' : 'எங்கள் பணியை ஏற்ற முடியவில்லை.'}</p>
        </div>
      ) : content ? (
        <>
          {content.title && (
            <h2 className="text-3xl font-bold mb-4 animate-text-glow text-center">{content.title[lang]}</h2>
          )}
          <p className="text-lg leading-relaxed text-center opacity-90 card-morphism p-6">
            {content.content[lang]}
          </p>
        </>
      ) : null}
    </section>
  );
}