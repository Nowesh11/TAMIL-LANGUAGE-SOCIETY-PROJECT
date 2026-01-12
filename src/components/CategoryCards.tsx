"use client";
import { useEffect, useState } from 'react';
import '../styles/components/CategoryCards.css';

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
    <div className="category-cards-loading">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="category-card-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-title"></div>
          <div className="skeleton-description"></div>
          <div className="skeleton-description"></div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="category-cards">
      {cats.map((c) => (
        <div key={c.name} className="category-card" onClick={() => onCategoryClick(c.name)}>
          <div className="category-card-icon">
            📚
          </div>
          <h3 className="category-card-title">{c.name}</h3>
          <p className="category-card-description">
            Explore our collection of {c.name.toLowerCase()} books and resources
          </p>
          <div className="category-card-count">
            <span>{c.count} books</span>
            <span className="category-card-arrow">→</span>
          </div>
        </div>
      ))}
    </div>
  );
}