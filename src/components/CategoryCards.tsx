"use client";
import { useEffect, useState } from 'react';

export default function CategoryCards({ onCategoryClick }: { onCategoryClick: (cat: string) => void }) {
  const [cats, setCats] = useState<{ name: string; count: number }[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ebooks/categories');
        const data = await res.json();
        if (data.success) setCats(data.categories || []);
      } catch {}
    })();
  }, []);
  
  if (!cats.length) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card-morphism h-48 rounded-2xl animate-pulse"></div>
      ))}
    </div>
  );
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
      {cats.map((c) => (
        <div 
          key={c.name} 
          className="card-morphism group cursor-pointer p-6 rounded-2xl border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 relative overflow-hidden" 
          onClick={() => onCategoryClick(c.name)}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-primary/30 group-hover:bg-primary/10">
              📚
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
            
            <p className="text-sm text-gray-400 mb-4 flex-grow">
              Explore our collection of {c.name.toLowerCase()} books
            </p>
            
            <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-white/5">
              <span className="text-gray-300 group-hover:text-white transition-colors">{c.count} books</span>
              <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">→</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}