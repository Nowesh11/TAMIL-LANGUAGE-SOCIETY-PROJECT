"use client";
import { useEffect, useState } from 'react';
import ItemCard, { ItemRecord } from './ItemCard';

export default function ItemsGrid({ type, bureau }: { type: 'project' | 'activity' | 'initiative'; bureau?: string }) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type });
        if (bureau) params.set('bureau', bureau);
        const res = await fetch(`/api/project-items?${params.toString()}`);
        const json = await res.json();
        if (isMounted) setItems(Array.isArray(json.items) ? json.items : []);
      } catch (e) {
        if (isMounted) setItems([]);
        console.error('Failed to load items', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [type, bureau]);

  if (loading) {
    const wrapperClass = type === 'project' ? 'projects-grid' : type === 'activity' ? 'activities-grid' : 'initiatives-grid';
    return (
      <div className={wrapperClass}>
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (!items.length) {
    return <p className="text-muted">No items found.</p>;
  }

  const wrapperClass = type === 'project' ? 'projects-grid' : type === 'activity' ? 'activities-grid' : 'initiatives-grid';
  return (
    <div className={wrapperClass}>
      {items.map((it) => (
        <ItemCard key={it._id} item={it} />
      ))}
    </div>
  );
}