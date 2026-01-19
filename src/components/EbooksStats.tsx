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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
      <Stat label={lang === 'ta' ? 'மொத்த நூல்கள்' : 'Total books'} value={String(stats.totalEbooks)} icon="📚" color="text-primary" />
      <Stat label={lang === 'ta' ? 'மொத்த பதிவிறக்கங்கள்' : 'Total downloads'} value={String(stats.totalDownloads)} icon="⬇️" color="text-green-400" />
      <Stat label={lang === 'ta' ? 'செயலில் உள்ள வாசகர்கள்' : 'Active readers'} value={String(stats.activeReaders ?? 0)} icon="👥" color="text-blue-400" />
      <Stat label={lang === 'ta' ? 'மொழிகள்' : 'Languages'} value={String(stats.languagesCount ?? 1)} icon="🗣️" color="text-purple-400" />
    </div>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="card-morphism p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center transform hover:scale-105 transition-transform duration-300 shadow-lg group">
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <div className={`text-3xl font-bold mb-2 ${color} drop-shadow-sm`}>{value}</div>
      <div className="text-sm font-medium text-gray-400 uppercase tracking-wider text-center">{label}</div>
    </div>
  );
}