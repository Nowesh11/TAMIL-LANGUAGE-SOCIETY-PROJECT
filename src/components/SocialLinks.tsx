"use client";
import { useEffect, useState } from 'react';
import { safeFetchJson } from '../lib/safeFetch';

type Bilingual = { en: string; ta: string };
type SocialLinksContent = {
  title?: Bilingual;
  subtitle?: Bilingual;
  links: { label: Bilingual; url: string; icon?: string }[];
};

type ComponentRecord = { type: string; content: SocialLinksContent };

export default function SocialLinks({ page = 'contacts' }: { page?: string }) {
  const [data, setData] = useState<SocialLinksContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(`/api/components/page?page=${encodeURIComponent(page)}`);
        const list = Array.isArray(json.components) ? json.components : [];
        const record = list.find((c) => c.type === 'social-links');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load social links', e);
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
        </div>
      </section>
    );
  }

  if (!data || !data.links || data.links.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      {data.title ? (
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
          {data.title.en}
        </h2>
      ) : null}
      {data.subtitle ? (
        <p className="text-slate-700 dark:text-slate-300 mb-4">{data.subtitle.en}</p>
      ) : null}
      <div className="flex flex-wrap gap-4">
        {data.links.map((l, i) => (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary hover-pulse">
            {l.icon ? <i className={`${l.icon} fa-fw`} /> : null}
            <span style={{ marginLeft: l.icon ? '0.5rem' : 0 }}>{l.label.en}</span>
          </a>
        ))}
      </div>
    </section>
  );
}