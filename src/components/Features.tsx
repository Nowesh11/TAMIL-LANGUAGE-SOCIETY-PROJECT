"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../hooks/LanguageContext';
import '../styles/components/Features.css';

interface Bilingual {
  en: string;
  ta: string;
}

interface FeatureItem {
  title: Bilingual;
  description: Bilingual;
  icon?: string;
  image?: { src: string; alt: Bilingual; width?: number; height?: number };
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
        const res = await fetch(`/api/components/page?page=${encodeURIComponent(page)}`);
        const json = await res.json();
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
      <section className="features bg-section-gradient py-10" id="features">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-morphism h-32 shimmer" />
            <div className="card-morphism h-32 shimmer" />
            <div className="card-morphism h-32 shimmer" />
            <div className="card-morphism h-32 shimmer" />
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
    <section className="features bg-section-gradient py-10" id="features">
      <div className="container">
        {content.title ? (
          <h2 className="section-title text-3xl font-bold gradient-title"><span className="animate-text-glow">{content.title?.[lang] || content.title?.en || ''}</span></h2>
        ) : null}
        <div className={`features-grid grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-6`}>
          {content.features.map((f, idx) => (
            <div key={idx} className="feature-card card-morphism card-gradient text-white animate-slide-in-up hover-lift hover-glow">
              <div className="feature-icon animate-bounce-in hover-rotate text-2xl">
                {f.icon ? <i className={`${(f.icon || '').replace(/\bfas\b/g,'fa-solid')} fa-fw text-white`}></i> : null}
              </div>
              <h2 className="animate-text-glow">{f.title?.[lang] || f.title?.en || ''}</h2>
              <p className="animate-fade-in animate-stagger-1">{f.description?.[lang] || f.description?.en || ''}</p>
              {f.link ? (
                <Link href={f.link.url} className="feature-link btn-neon hover-pulse">
                  <span>{f.link.text?.[lang] || f.link.text?.en || ''}</span> <i className="fa-solid fa-arrow-right fa-fw"></i>
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}