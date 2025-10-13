"use client";
import { useEffect, useState } from 'react';

export default function EbooksStats() {
  const [stats, setStats] = useState<{ totalEbooks: number; totalDownloads: number; ratingCount: number; ratingAverage: number; languagesCount?: number; activeReaders?: number } | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/ebooks/stats');
        const data = await res.json();
        if (data.success) setStats({ totalEbooks: data.totalEbooks, totalDownloads: data.totalDownloads, ratingCount: data.ratingCount, ratingAverage: data.ratingAverage, languagesCount: data.languagesCount, activeReaders: data.activeReaders });
      } catch {}
    })();
  }, []);
  if (!stats) return null;
  return (
    <div className="stats grid grid-cols-2 md:grid-cols-4 gap-4">
      <Stat label="Total books" value={String(stats.totalEbooks)} />
      <Stat label="Total downloads" value={String(stats.totalDownloads)} />
      <Stat label="Active readers" value={String(stats.activeReaders ?? 0)} />
      <Stat label="Languages" value={String(stats.languagesCount ?? 1)} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-6 text-center animate-fade-in-up">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}