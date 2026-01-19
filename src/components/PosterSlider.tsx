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
  imagePath?: string;
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
    <section className="py-12 relative bg-transparent overflow-hidden" id="poster">
      <div className="layout-container max-w-6xl mx-auto">
        <div className="relative h-[420px] sm:h-[480px] md:h-[560px] lg:h-[640px] rounded-3xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500 border border-white/10 group card-morphism">
          {(current.imageUrl || current.imagePath) && (
            <Image 
              src={
                current.imageUrl
                  ? current.imageUrl
                  : current.imagePath && (current.imagePath.startsWith('/') || current.imagePath.startsWith('http') 
                      ? current.imagePath 
                      : `/api/files/serve?path=${encodeURIComponent(current.imagePath)}`)
              }
              alt={
                typeof current.title === 'string' 
                  ? current.title 
                  : current.title?.[lang] || current.title?.en || ''
              } 
              className="object-cover transition-transform duration-1000 group-hover:scale-105" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority 
              unoptimized 
            />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-10">
             <div className="transform transition-all duration-500 translate-y-4 group-hover:translate-y-0 opacity-90 group-hover:opacity-100">
               <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
                {typeof current.title === 'string' 
                  ? current.title 
                  : current.title?.[lang] || current.title?.en || ''}
              </h3>
              <p className="text-gray-200 text-lg md:text-xl max-w-3xl drop-shadow-md leading-relaxed">
                {typeof current.description === 'string' 
                  ? current.description 
                  : current.description?.[lang] || current.description?.en || ''}
              </p>
             </div>
          </div>
          
          <div className="absolute bottom-8 right-8 flex gap-3 z-20">
            {posters.map((_, i) => (
              <button 
                key={i} 
                aria-label={`Slide ${i+1}`} 
                className={`h-2 rounded-full transition-all duration-300 backdrop-blur-sm ${i === index ? 'w-10 bg-primary' : 'w-3 bg-white/40 hover:bg-white/70'}`} 
                onClick={() => setIndex(i)} 
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
