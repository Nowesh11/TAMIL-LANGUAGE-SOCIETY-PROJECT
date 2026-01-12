"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { useLanguage } from "../hooks/LanguageContext";
import { safeFetchJson } from '../lib/safeFetch';
import '../styles/components/Hero.css';

type Bilingual = { en: string; ta: string };
 type ImageContent = { src: string; alt: Bilingual; width?: number; height?: number };

type HeroContent = {
  title?: Bilingual;
  subtitle?: Bilingual;
  ctas?: { text: Bilingual; href: string; variant?: "primary" | "secondary" }[];
  accent?: string;
  backgroundImages?: ImageContent[];
  backgroundImage?: string;
  image?: string;
};

type ComponentRecord = { type: string; content: HeroContent };

export default function Hero({ page = 'home', bureau, data: propData }: { page?: string; bureau?: string; data?: any }) {
  const { lang } = useLanguage();
  const [data, setData] = useState<HeroContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If data is provided as prop, use it directly
    if (propData) {
      setData(propData as HeroContent);
      setLoading(false);
      return;
    }

    // Fallback to API call if no data prop provided
    async function load() {
      try {
        const reqUrl = (() => {
          try {
            const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
            if (origin) {
              const url = new URL('/api/components/page', origin);
              url.searchParams.set('page', page);
              if (bureau) url.searchParams.set('bureau', bureau);
              return url.toString();
            }
          } catch {}
          const qs = new URLSearchParams({ page });
          if (bureau) qs.set('bureau', bureau);
          return `/api/components/page?${qs.toString()}`;
        })();
        const json = await safeFetchJson<{ components?: ComponentRecord[] }>(reqUrl);
        const list = Array.isArray(json.components) ? (json.components as ComponentRecord[]) : [];
        const hero = list.find((c) => c.type === 'hero');
        if (hero?.content) {
          setData(hero.content);
        } else {
          setData(null);
          setError('Hero content not found in database');
        }
      } catch (e) {
        console.error('Failed to load hero', e);
        setError('Failed to load hero content');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, bureau, propData]);

  const title = data?.title;
  const subtitle = data?.subtitle;
  const ctas = data?.ctas || [];

  // Combine all images: SVG backgrounds + uploaded images
  const allImages = [];
  
  // Add SVG background images
  if (data?.backgroundImages) {
    allImages.push(...data.backgroundImages);
  }
  
  // Add uploaded background image
  if (data?.backgroundImage) {
    allImages.push({
      src: data.backgroundImage,
      alt: { en: "Hero background image", ta: "ஹீரோ பின்னணி படம்" }
    });
  }
  
  // Add uploaded image
  if (data?.image) {
    allImages.push({
      src: data.image,
      alt: { en: "Hero image", ta: "ஹீரோ படம்" }
    });
  }

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!allImages.length) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % allImages.length);
    }, 5000);
    return () => clearInterval(id);
  }, [allImages.length]);

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 w-full h-full">
        {allImages.length > 0 && (
          allImages.map((img, i) => (
            <Image
              key={i}
              src={img.src}
              alt={typeof img.alt === 'string' ? img.alt : (img.alt?.[lang] || img.alt?.en || '')}
              fill
              className={`object-cover hero-slide ${i === index ? 'hero-slide--active' : ''}`}
              priority={i === 0}
              unoptimized
            />
          ))
        )}
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 sm:py-28 md:py-32 text-white">
        <div className="text-center">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-10 sm:h-12 md:h-14 bg-white/30 rounded w-2/3" />
              <div className="mx-auto h-6 sm:h-7 md:h-8 bg-white/20 rounded w-1/2" />
              <div className="mx-auto h-11 bg-white/20 rounded w-40" />
            </div>
          ) : error ? (
            <div className="mx-auto max-w-xl bg-black/40 border border-white/20 rounded-xl p-5">
              <p className="text-lg">{lang === 'en' ? 'Unable to load hero.' : 'ஹீரோ பகுதியை ஏற்ற முடியவில்லை.'}</p>
            </div>
          ) : (
            <>
              {title && (
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white whitespace-nowrap">
                  {typeof title === 'string' ? title : (title?.[lang] || title?.en || '')}
                </h1>
              )}
              {subtitle && (
                <p className="mt-4 text-lg sm:text-xl md:text-2xl opacity-90">
                  {typeof subtitle === 'string' ? subtitle : (subtitle?.[lang] || subtitle?.en || '')}
                </p>
              )}
              {ctas.length > 0 && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  {ctas.map((cta, i) => (
                    <a
                      key={i}
                      href={cta.href}
                      className={cta.variant === "secondary" ?
                        "px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all btn-gradient-secondary hover:scale-[1.02] text-white" :
                        "px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all btn-gradient-primary hover:scale-[1.02] text-white"}
                    >
                      {cta.text?.[lang] || cta.text?.en || ''}
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Decorative line to enhance hero visuals */}
        <div className="mt-12 mx-auto w-24 h-1 rounded-full bg-white/60" />
      </div>
    </section>
  );
}