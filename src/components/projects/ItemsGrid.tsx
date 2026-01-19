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
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <p className="text-gray-400 text-lg">No items found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((it) => (
          <ItemCard key={it._id} item={it} />
        ))}
      </div>
    </div>
  );
}