"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };
type FAQItem = { question: Bilingual; answer: Bilingual; category?: string };
type FAQContent = { title?: Bilingual; faqs: FAQItem[]; searchable?: boolean; categories?: string[] };
type ComponentRecord = { type: string; content: FAQContent };

export default function FAQ({ page = 'contacts' }: { page?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FAQContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const url = `/api/components/page?page=${encodeURIComponent(page)}`;
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(url);
        const list = Array.isArray(json.components) ? json.components : [];
        const record = list.find((c) => c.type === 'faq');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load FAQ', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-3 animate-pulse">
          <div className="h-7 bg-slate-300/40 dark:bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-full" />
          <div className="h-4 bg-slate-300/40 dark:bg-white/10 rounded w-full" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      {data.title ? (
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
          {data.title[lang]}
        </h2>
      ) : null}
      <div className="space-y-4">
        {data.faqs.map((f, idx) => (
          <div key={idx} className="rounded-xl border border-black/5 dark:border-white/10 p-5 bg-white/70 dark:bg-white/[0.02] card-morphism">
            <div className="font-semibold text-slate-900 dark:text-white mb-2">{f.question[lang]}</div>
            <div className="text-slate-700 dark:text-slate-300">{f.answer[lang]}</div>
          </div>
        ))}
      </div>
    </section>
  );
}