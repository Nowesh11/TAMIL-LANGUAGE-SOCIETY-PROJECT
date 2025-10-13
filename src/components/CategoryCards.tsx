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
  if (!cats.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cats.map((c) => (
        <button key={c.name} className="card p-4 hover-lift" onClick={() => onCategoryClick(c.name)}>
          <div className="text-lg font-semibold">{c.name}</div>
          <div className="text-sm text-muted">{c.count} books</div>
        </button>
      ))}
    </div>
  );
}