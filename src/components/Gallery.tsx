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

export default function Gallery({ page = 'about', slug, data: propData }: { page?: string; slug?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<GalleryContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as GalleryContent);
      setLoading(false);
      return;
    }

    // Fallback to API call if no data prop provided
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
  }, [page, slug, propData]);
  const content: GalleryContent | null = data;

  const cols = (content?.columns) || 3;
  const gridCols = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : cols === 5 ? 'grid-cols-5' : 'grid-cols-3';

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mx-auto mb-8" />
          <div className={`grid ${gridCols} gap-6`}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="rounded-2xl h-56 md:h-64 lg:h-72 bg-white/5 border border-white/10" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-xl text-center bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
          <p className="text-red-400">{lang === 'en' ? 'Unable to load gallery.' : 'கேலரியை ஏற்ற முடியவில்லை.'}</p>
        </div>
      ) : content ? (
        <>
          {content.title && (
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-10 text-center drop-shadow-lg">
              {content.title?.[lang] || content.title?.en || ''}
            </h2>
          )}
          <div className={`grid ${gridCols} gap-6`}>
            {content.images.map((img, idx) => (
              <div key={idx} className="card-morphism rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-white/10 group">
                <div className="relative h-56 md:h-64 lg:h-72 w-full overflow-hidden">
                  <Image 
                    src={img.src} 
                    alt={typeof img.alt === 'string' ? img.alt : (img.alt?.[lang] || img.alt?.en || '')} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}