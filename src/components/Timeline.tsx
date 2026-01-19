"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

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
        <div className="text-center text-gray-400">
          {lang === 'en' ? 'Timeline content not available' : 'காலவரிசை உள்ளடக்கம் கிடைக்கவில்லை'}
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10 max-w-5xl">
        {content.title && (
          <h2 className="text-4xl md:text-5xl font-bold mb-16 text-center text-white drop-shadow-lg animate-slide-in-up">
            <span className="animate-text-glow">{content.title?.[lang] || content.title?.en || ''}</span>
          </h2>
        )}
        <div className="relative border-l-2 border-white/10 pl-8 ml-4 md:ml-0 space-y-12">
          {timelineItems.map((item, idx) => (
            <div 
              key={idx} 
              className="relative group animate-slide-in-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-primary border-4 border-[#0f172a] shadow-lg shadow-primary/50 group-hover:scale-125 transition-transform duration-300 z-10" />
              <div className="card-morphism p-8 rounded-3xl border border-white/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary font-bold text-sm mb-4 border border-primary/20">
                  {item.year}
                </span>
                {item.title && (
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {item.title?.[lang] || item.title?.en || ''}
                  </h3>
                )}
                <p className="text-gray-300 leading-relaxed text-lg">
                  {item.description?.[lang] || item.description?.en || ''}
                </p>
                {item.image && (
                  <div className="mt-6 rounded-2xl overflow-hidden border border-white/10 shadow-lg group-hover:shadow-primary/20 transition-all duration-500">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt?.[lang] || item.image.alt?.en || ''}
                      className="w-full h-auto transform group-hover:scale-105 transition-transform duration-700"
                      width={item.image.width || 600}
                      height={item.image.height || 400}
                      unoptimized
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}