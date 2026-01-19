"use client";
import { useEffect, useRef } from 'react';
import EbookCard from './EbookCard';

export default function FeaturedEbooks({ ebooks, onDownload, onRate }: {
  ebooks: any[];
  onDownload: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      el.scrollBy({ left: 300, behavior: 'smooth' });
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  if (!ebooks?.length) return null;
  return (
    <div className="py-8 relative">
      <div ref={ref} className="flex gap-6 overflow-x-auto pb-6 px-4 scrollbar-hide snap-x">
        {ebooks.map((e) => (
          <div key={e._id} className="min-w-[280px] w-[280px] snap-start transform transition-transform duration-300 hover:scale-105">
            <EbookCard ebook={e} onDownload={onDownload} onRate={onRate} />
          </div>
        ))}
      </div>
    </div>
  );
}