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
        <div className="layout-container relative z-10">
          <div className="flex flex-wrap justify-center gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card-morphism h-64 w-full max-w-[360px] animate-pulse rounded-2xl border border-white/10"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const content = data;
  if (!content) return null;

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
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

        <div className="flex flex-wrap justify-center gap-8">
          {content.features.map((f, idx) => (
            <div
              key={idx}
              className="card-morphism w-full max-w-[360px] min-h-[470px] p-8 rounded-3xl border border-white/10 shadow-xl hover:shadow-primary/20 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="mb-6 flex justify-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  {f.image ? (
                    <div className="relative w-16 h-16">
                      <Image
                        src={typeof f.image === 'string' ? f.image : f.image.src}
                        alt={
                          typeof f.image === 'string'
                            ? (f.title?.[lang] || f.title?.en || 'Feature image')
                            : (f.image.alt?.[lang] || f.image.alt?.en || 'Feature image')
                        }
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="text-4xl text-primary flex items-center justify-center w-16 h-16">
                      {f.icon ? <IconRenderer iconName={f.icon} /> : null}
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 text-white">
                {f.title?.[lang] || f.title?.en || ''}
              </h3>

              <p className="text-gray-400 leading-relaxed mb-6">
                {f.description?.[lang] || f.description?.en || ''}
              </p>

              {f.link && (
                <Link
                  href={f.link.url}
                  target={f.link.target || '_self'}
                  className="mt-auto inline-flex items-center justify-center text-primary font-bold hover:text-white transition-colors text-sm uppercase tracking-wide"
                >
                  {f.link.text?.[lang] || f.link.text?.en || ''}
                  <i className="fa-solid fa-arrow-right fa-fw ml-2"></i>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}