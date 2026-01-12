"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Timeline.css';

type Bilingual = { en: string; ta: string };
type ImageContent = { src: string; alt: Bilingual; width?: number; height?: number };
type TimelineItem = { year: string; title?: Bilingual; description: Bilingual; image?: ImageContent };
type TimelineContent = { title?: Bilingual; items: TimelineItem[]; layout?: 'vertical' | 'horizontal' };
type ComponentRecord = { type: string; content: TimelineContent };

export default function Timeline({ page = 'about', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<TimelineContent | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as TimelineContent);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const res = await fetch(`/api/components/page?page=${encodeURIComponent(page)}`);
        const json = await res.json();
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'timeline');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load timeline', e);
      }
    }
    load();
  }, [page, propData]);

  const content: TimelineContent | null = data;

  // Handle both 'items' and 'events' properties for backward compatibility
  const timelineItems = content?.items || (content as any)?.events || [];

  if (!content || !Array.isArray(timelineItems) || timelineItems.length === 0) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center text-slate-500 dark:text-slate-400">
          {lang === 'en' ? 'Timeline content not available' : 'காலவரிசை உள்ளடக்கம் கிடைக்கவில்லை'}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      {content.title && (
        <h2 className="text-3xl font-bold mb-6">{content.title?.[lang] || content.title?.en || ''}</h2>
      )}
      <div className="relative border-l-2 border-slate-200 dark:border-white/10 pl-6">
        {timelineItems.map((item, idx) => (
          <div key={idx} className="mb-8">
            <div className="absolute -left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
            <div className="text-sm text-slate-500 dark:text-slate-400">{item.year}</div>
            {item.title && <div className="text-xl font-semibold">{item.title?.[lang] || item.title?.en || ''}</div>}
            <p className="mt-1 text-slate-700 dark:text-slate-200">{item.description?.[lang] || item.description?.en || ''}</p>
            {item.image && (
              <Image
                src={item.image.src}
                alt={item.image.alt?.[lang] || item.image.alt?.en || ''}
                className="mt-3 rounded-lg border border-black/5 dark:border-white/10"
                width={item.image.width || 600}
                height={item.image.height || 400}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}