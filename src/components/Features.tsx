"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';
import { IconRenderer } from './ui/IconRenderer';
import { safeFetchJson } from '../lib/safeFetch';

interface Bilingual {
  en: string;
  ta: string;
}

interface FeatureItem {
  title: Bilingual;
  description: Bilingual;
  icon?: string;
  image?: { src: string; alt: Bilingual; width?: number; height?: number } | string;
  link?: { text: Bilingual; url: string; target?: '_blank' | '_self' };
}

interface FeaturesContent {
  title?: Bilingual;
  subtitle?: Bilingual;
  features: FeatureItem[];
  layout?: 'grid' | 'list' | 'cards';
  columns?: 2 | 3 | 4;
}

interface ComponentRecord {
  type: string;
  content: FeaturesContent;
}

export default function Features({ page = 'home', data: propData }: { page?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FeaturesContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as FeaturesContent);
      setLoading(false);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(`/api/components/page?page=${encodeURIComponent(page)}`);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const record = list.find((c) => c.type === 'features');
        if (record?.content) setData(record.content);
      } catch (e) {
        console.error('Failed to load features', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, propData]);

  if (loading) {
    return (
      <section className="py-20 relative overflow-hidden aurora-bg">
        <div className="layout-container relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-morphism h-64 animate-pulse rounded-2xl border border-white/10" />
            <div className="card-morphism h-64 animate-pulse rounded-2xl border border-white/10" />
            <div className="card-morphism h-64 animate-pulse rounded-2xl border border-white/10" />
            <div className="card-morphism h-64 animate-pulse rounded-2xl border border-white/10" />
          </div>
        </div>
      </section>
    );
  }

  const content = data;
  if (!content) return null;

  const cols = content.columns || 4;
  const gridColsClass = cols === 2 ? 'lg:grid-cols-2' : cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
        {content.title ? (
          <div className="text-center mb-16 animate-slide-in-up">
            <h2 className="text-3xl md:text-4xl font-bold inline-block text-white drop-shadow-lg">
              <span className="animate-text-glow">{content.title?.[lang] || content.title?.en || ''}</span>
            </h2>
            {content.subtitle && (
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto drop-shadow-md">
                {content.subtitle?.[lang] || content.subtitle?.en || ''}
              </p>
            )}
          </div>
        ) : null}
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8`}>
          {content.features.map((f, idx) => (
            <div 
              key={idx} 
              className="card-morphism p-8 hover-lift transition-all duration-300 group animate-slide-in-up rounded-3xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:border-primary/30"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="mb-6 p-4 rounded-2xl bg-white/5 inline-block group-hover:bg-primary/10 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3 border border-white/10 group-hover:border-primary/30 relative overflow-hidden">
                {f.image ? (
                   <div className="relative w-16 h-16 flex items-center justify-center">
                     <Image 
                       src={typeof f.image === 'string' ? f.image : f.image.src} 
                       alt={f.title?.[lang] || 'Feature icon'} 
                       fill 
                       className="object-contain"
                       unoptimized
                     />
                   </div>
                ) : (
                  <div className="text-4xl text-primary drop-shadow-sm flex items-center justify-center">
                    {f.icon ? <IconRenderer iconName={f.icon} /> : null}
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">
                {f.title?.[lang] || f.title?.en || ''}
              </h3>
              
              <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                {f.description?.[lang] || f.description?.en || ''}
              </p>
              
              {f.link ? (
                <Link 
                  href={f.link.url} 
                  className="inline-flex items-center text-primary font-bold hover:text-white transition-colors group-hover:translate-x-1 duration-300 text-sm uppercase tracking-wide"
                >
                  <span>{f.link.text?.[lang] || f.link.text?.en || ''}</span> 
                  <i className="fa-solid fa-arrow-right fa-fw ml-2"></i>
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
