"use client";
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

interface Bilingual { en: string; ta: string }
interface PosterItem {
  _id: string;
  title: Bilingual;
  description: Bilingual;
  imageUrl: string;
  order: number;
}

export default function PosterSlider({ page, data }: { page?: string, data?: any }) {
  const [posters, setPosters] = useState<PosterItem[]>([]);
  const { lang } = useLanguage();
  const [index, setIndex] = useState(0);
  const timerRef = useRef<number | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const loadPosters = async () => {
    try {
      const res = await fetch('/api/posters');
      const json = await res.json();
      const items = (json.posters || []) as PosterItem[];
      items.sort((a, b) => a.order - b.order);
      setPosters(items);
    } catch (e) {
      console.error('Failed to fetch posters', e);
    }
  };

  useEffect(() => {
    loadPosters();
    
    // Set up periodic refresh every 30 seconds
    refreshTimerRef.current = window.setInterval(() => {
      loadPosters();
    }, 30000);

    return () => {
      if (refreshTimerRef.current) window.clearInterval(refreshTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!posters.length) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % posters.length);
    }, 4000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [posters.length]);

  if (!posters.length) return null;

  const current = posters[index];

  return (
    <section className="poster-slider w-full" id="poster">
      <div className="layout-container max-w-5xl mx-auto">
        <div className="slider-frame relative h-[420px] sm:h-[480px] md:h-[560px] lg:h-[640px] card-morphism hover-glow overflow-hidden rounded-2xl">
          <Image 
            src={current.imageUrl} 
            alt={
              typeof current.title === 'string' 
                ? current.title 
                : current.title?.[lang] || current.title?.en || ''
            } 
            className="object-cover animate-fade-in" 
            fill 
            sizes="100vw" 
            priority 
            unoptimized 
          />
          <div className="flex gap-2 p-3">
            {posters.map((_, i) => (
              <button key={i} aria-label={`Slide ${i+1}`} className={`h-2 w-2 rounded-full ${i === index ? 'bg-blue-500' : 'bg-gray-400'}`} onClick={() => setIndex(i)} />
            ))}
          </div>
        </div>
        {/* Caption below the image, centered */}
        <div className="px-2 sm:px-3 md:px-4 py-3 text-center">
          <h3 className="text-2xl font-bold gradient-title animate-text-glow">
            {typeof current.title === 'string' 
              ? current.title 
              : current.title?.[lang] || current.title?.en || ''}
          </h3>
          <p className="mt-1 text-base opacity-85">
            {typeof current.description === 'string' 
              ? current.description 
              : current.description?.[lang] || current.description?.en || ''}
          </p>
        </div>
      </div>
    </section>
  );
}