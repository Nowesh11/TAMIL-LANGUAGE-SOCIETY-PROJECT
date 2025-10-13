"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type ImageContent = { src: string; alt: Bilingual; width?: number; height?: number };

type GalleryContent = {
  title?: Bilingual;
  images: ImageContent[];
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: 2 | 3 | 4 | 5;
  showThumbnails?: boolean;
  autoplay?: boolean;
  autoplayDelay?: number;
};

type ComponentRecord = {
  type: string;
  content: GalleryContent;
  slug?: string;
};

export default function Gallery({ page = 'about', slug }: { page?: string; slug?: string }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<GalleryContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/components/page?page=${encodeURIComponent(page)}`);
        const json = await res.json();
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        let record = list.find((c) => c.type === 'gallery');
        if (slug) {
          const bySlug = list.find((c) => c.type === 'gallery' && c.slug === slug);
          if (bySlug) record = bySlug;
        }
        if (record?.content) setData(record.content);
        else setError('No gallery content found');
      } catch (e) {
        console.error('Failed to load gallery', e);
        setError('Failed to load gallery');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, slug]);
  const content: GalleryContent | null = data;

  const cols = (content?.columns) || 3;
  const gridCols = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : cols === 5 ? 'grid-cols-5' : 'grid-cols-3';

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-7 bg-slate-300/40 dark:bg-white/10 rounded w-1/3" />
          <div className={`grid ${gridCols} gap-6`}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="rounded-xl h-56 md:h-64 lg:h-72 bg-slate-300/40 dark:bg-white/10" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl text-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
          <p className="text-red-700 dark:text-red-300">{lang === 'en' ? 'Unable to load gallery.' : 'கேலரியை ஏற்ற முடியவில்லை.'}</p>
        </div>
      ) : content ? (
        <>
          {content.title && (
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 text-center">
              {content.title[lang]}
            </h2>
          )}
          <div className={`grid ${gridCols} gap-6`}>
            {content.images.map((img, idx) => (
              <div key={idx} className="rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200/60 dark:ring-white/10">
                <Image 
                  src={img.src} 
                  alt={img.alt[lang]} 
                  width={img.width || 400} 
                  height={img.height || 300} 
                  className="object-cover w-full h-56 md:h-64 lg:h-72" 
                />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}