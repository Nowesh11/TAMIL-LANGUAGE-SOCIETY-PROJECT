"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

export default function EbooksStats() {
  const { lang } = useLanguage();
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
      <Stat label={lang === 'ta' ? 'மொத்த நூல்கள்' : 'Total books'} value={String(stats.totalEbooks)} />
      <Stat label={lang === 'ta' ? 'மொத்த பதிவிறக்கங்கள்' : 'Total downloads'} value={String(stats.totalDownloads)} />
      <Stat label={lang === 'ta' ? 'செயலில் உள்ள வாசகர்கள்' : 'Active readers'} value={String(stats.activeReaders ?? 0)} />
      <Stat label={lang === 'ta' ? 'மொழிகள்' : 'Languages'} value={String(stats.languagesCount ?? 1)} />
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