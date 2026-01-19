"use client";
import { useEffect, useState } from "react";
import Image from 'next/image';
import { useLanguage } from "../hooks/LanguageContext";
import { safeFetchJson } from '../lib/safeFetch';

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

  function resolveUploadSrc(src: string) {
    try {
      const s = src || '';
      const pos = s.toLowerCase().lastIndexOf('uploads');
      if (pos >= 0) {
        const rest = s.slice(pos).replace(/^[\\/]+/, '').replace(/\\/g, '/');
        return `/api/files/serve?path=${encodeURIComponent(rest)}`;
      }
      if (s.startsWith('/api/')) return s;
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const url = new URL(s, base);
      const pathOnly = url.pathname.replace(/^[/]+/, '');
      if (pathOnly.toLowerCase().startsWith('uploads/')) {
        return `/api/files/serve?path=${encodeURIComponent(pathOnly)}`;
      }
      return s;
    } catch {
      const raw = src || '';
      const pos = raw.toLowerCase().lastIndexOf('uploads');
      if (pos >= 0) {
        const rest = raw.slice(pos).replace(/^[\\/]+/, '').replace(/\\/g, '/');
        return `/api/files/serve?path=${encodeURIComponent(rest)}`;
      }
      const p = raw.replace(/^https?:\/\/[^/]+/, '').replace(/^[/]+/, '');
      if (p.toLowerCase().startsWith('uploads/')) {
        return `/api/files/serve?path=${encodeURIComponent(p)}`;
      }
      return raw;
    }
  }

  // Don't render anything if there's no data
  if (!data && !loading) {
    return null;
  }

  return (
    <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Slider */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {allImages.length > 0 ? (
          allImages.map((img, i) => (
            <div 
              key={i}
              className={`absolute inset-0 w-full h-full transition-all duration-[2000ms] ease-in-out transform ${
                i === index ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
              }`}
            >
              <Image
                src={resolveUploadSrc(img.src)}
                alt={typeof img.alt === 'string' ? img.alt : (img.alt?.[lang] || img.alt?.en || '')}
                fill
                className="object-cover"
                priority={i === 0}
                unoptimized
              />
              {/* Image Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/90" />
            </div>
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/30 via-secondary-dark/30 to-background" />
        )}
      </div>
      
      {/* Content Container */}
      <div className="relative z-10 layout-container px-6 flex flex-col justify-center items-center text-center">
        {loading ? (
          <div className="animate-pulse space-y-6 w-full max-w-4xl flex flex-col items-center">
            <div className="h-20 bg-surface/30 rounded-2xl w-3/4 backdrop-blur-sm" />
            <div className="h-8 bg-surface/30 rounded-xl w-1/2 backdrop-blur-sm" />
            <div className="flex gap-4 mt-8">
               <div className="h-14 w-40 bg-surface/30 rounded-xl backdrop-blur-sm" />
               <div className="h-14 w-40 bg-surface/30 rounded-xl backdrop-blur-sm" />
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl bg-surface/10 border border-border/20 rounded-2xl p-8 backdrop-blur-md">
            <p className="text-lg text-foreground/80">{lang === 'en' ? 'Unable to load hero content.' : 'ஹீரோ பகுதியை ஏற்ற முடியவில்லை.'}</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Animated Title */}
            {title && (
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tight text-foreground mb-8 leading-tight drop-shadow-2xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary-light to-foreground animate-text-glow">
                  {typeof title === 'string' ? title : (title?.[lang] || title?.en || '')}
                </span>
              </h1>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-xl sm:text-2xl md:text-3xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed mb-12 font-light tracking-wide drop-shadow-lg backdrop-blur-sm py-2 rounded-lg">
                {typeof subtitle === 'string' ? subtitle : (subtitle?.[lang] || subtitle?.en || '')}
              </p>
            )}
            
            {/* CTAs */}
            {ctas.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                {ctas.map((cta, i) => (
                  <a
                    key={i}
                    href={cta.href}
                    className={`px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center gap-3 group ${
                      cta.variant === "secondary" ?
                        "bg-surface/10 backdrop-blur-md border border-border/20 text-foreground hover:bg-surface/20 hover:border-border/40" :
                        "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50"
                    }`}
                  >
                    <span>{cta.text?.[lang] || cta.text?.en || ''}</span>
                    <i className={`fa-solid fa-arrow-right transition-transform group-hover:translate-x-1 ${cta.variant === 'secondary' ? 'opacity-70' : ''}`}></i>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-10 hidden md:block">
         <div className="w-8 h-12 rounded-full border-2 border-foreground/30 flex justify-center p-2 backdrop-blur-sm bg-surface/5">
            <div className="w-1.5 h-3 bg-foreground/80 rounded-full animate-scroll-indicator"></div>
         </div>
      </div>
      
      {/* Decorative Overlay Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background/80 to-transparent z-1 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-1 pointer-events-none"></div>
    </section>
  );
}
