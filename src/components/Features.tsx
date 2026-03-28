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

export default function Features({
  page = 'home',
  data: propData,
  alignment = 'center'
}: {
  page?: string;
  data?: any;
  alignment?: 'left' | 'center' | 'right';
}) {
  const { lang } = useLanguage();
  const [data, setData] = useState<FeaturesContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (propData) {
      setData(propData as FeaturesContent);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(
          `/api/components/page?page=${encodeURIComponent(page)}`
        );
        const list = Array.isArray(json.components)
          ? (json.components as ComponentRecord[])
          : [];
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
        <div className="layout-container relative z-10 flex justify-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-morphism h-64 animate-pulse rounded-2xl border border-white/10" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const content = data;
  if (!content) return null;

  const cols = content.columns || 4;
  const gridColsClass =
    cols === 2
      ? 'lg:grid-cols-2'
      : cols === 3
      ? 'lg:grid-cols-3'
      : 'lg:grid-cols-4';

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">

        {/* TITLE */}
        {content.title && (
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              <span className="animate-text-glow">
                {content.title?.[lang] || content.title?.en || ''}
              </span>
            </h2>

            {content.subtitle && (
              <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                {content.subtitle?.[lang] || content.subtitle?.en || ''}
              </p>
            )}
          </div>
        )}

        {/* GRID CENTER FIX */}
        <div className="flex justify-center">
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-8 justify-center`}
          >
            {content.features.map((f, idx) => (
              <div
                key={idx}
                className="card-morphism p-8 rounded-3xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center max-w-sm mx-auto"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* ICON */}
                <div className="mb-6 p-4 rounded-2xl bg-white/5 group-hover:bg-primary/10 transition-all duration-300 border border-white/10 group-hover:border-primary/30">
                  {f.image ? (
                    <div className="relative w-16 h-16">
                      <Image
                        src={typeof f.image === 'string' ? f.image : f.image.src}
                        alt={f.title?.[lang] || 'Feature icon'}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-4xl text-primary">
                      {f.icon ? <IconRenderer iconName={f.icon} /> : null}
                    </div>
                  )}
                </div>

                {/* TITLE */}
                <h3 className="text-xl font-bold mb-3 text-white">
                  {f.title?.[lang] || f.title?.en || ''}
                </h3>

                {/* DESCRIPTION */}
                <p className="text-gray-400 leading-relaxed mb-6">
                  {f.description?.[lang] || f.description?.en || ''}
                </p>

                {/* LINK */}
                {f.link && (
                  <Link
                    href={f.link.url}
                    className="inline-flex items-center text-primary font-bold hover:text-white transition-colors text-sm uppercase tracking-wide"
                  >
                    {f.link.text?.[lang] || f.link.text?.en || ''}
                    <i className="fa-solid fa-arrow-right fa-fw ml-2"></i>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}