"use client";
import { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

type Filters = {
  search: string;
  category: string;
  language: string;
  sort: string;
};

export default function EbooksSearchBar({ filters, onSearch }: { filters: Filters; onSearch: (f: Filters) => void }) {
  const { lang } = useLanguage();
  const [local, setLocal] = useState<Filters>(filters);

  useEffect(() => setLocal(filters), [filters]);

  useEffect(() => {
    const h = setTimeout(() => onSearch(local), 300);
    return () => clearTimeout(h);
  }, [local]);

  return (
    <div className="card-morphism p-6 rounded-2xl border border-white/10 mb-8 mx-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-semibold text-gray-300" htmlFor="ebook-search">
            {lang === 'ta' ? 'தலைப்பு மூலம் தேடுங்கள்' : 'Search by title'}
          </label>
          <input
            id="ebook-search"
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none"
            placeholder={lang === 'ta' ? 'தலைப்பு தட்டச்சு செய்யுங்கள்...' : 'Type a title...'}
            value={local.search}
            onChange={(e) => setLocal({ ...local, search: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300" htmlFor="ebook-category">
            {lang === 'ta' ? 'வகை' : 'Category'}
          </label>
          <select 
            id="ebook-category" 
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none" 
            value={local.category} 
            onChange={(e) => setLocal({ ...local, category: e.target.value })}
          >
            <option value="all" className="bg-gray-900">{lang === 'ta' ? 'அனைத்து வகைகள்' : 'All categories'}</option>
            <option value="history" className="bg-gray-900">{lang === 'ta' ? 'வரலாறு' : 'History'}</option>
            <option value="language" className="bg-gray-900">{lang === 'ta' ? 'மொழி' : 'Language'}</option>
            <option value="literature" className="bg-gray-900">{lang === 'ta' ? 'இலக்கியம்' : 'Literature'}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300" htmlFor="ebook-language">
            {lang === 'ta' ? 'மொழி' : 'Language'}
          </label>
          <select 
            id="ebook-language" 
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none" 
            value={local.language} 
            onChange={(e) => setLocal({ ...local, language: e.target.value })}
          >
            <option value="all" className="bg-gray-900">{lang === 'ta' ? 'அனைத்து மொழிகள்' : 'All languages'}</option>
            <option value="tamil" className="bg-gray-900">{lang === 'ta' ? 'தமிழ்' : 'Tamil'}</option>
            <option value="english" className="bg-gray-900">{lang === 'ta' ? 'ஆங்கிலம்' : 'English'}</option>
            <option value="bilingual" className="bg-gray-900">{lang === 'ta' ? 'இருமொழி' : 'Bilingual'}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300" htmlFor="ebook-sort">
            {lang === 'ta' ? 'வரிசைப்படுத்து' : 'Sort'}
          </label>
          <select 
            id="ebook-sort" 
            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm outline-none" 
            value={local.sort} 
            onChange={(e) => setLocal({ ...local, sort: e.target.value })}
          >
            <option value="latest" className="bg-gray-900">{lang === 'ta' ? 'சமீபத்திய' : 'Latest'}</option>
            <option value="popular" className="bg-gray-900">{lang === 'ta' ? 'பிரபலமான' : 'Popular'}</option>
            <option value="oldest" className="bg-gray-900">{lang === 'ta' ? 'பழைய' : 'Oldest'}</option>
          </select>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <button 
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-1" 
          onClick={() => onSearch(local)}
        >
          {lang === 'ta' ? 'தேடு' : 'Search'}
        </button>
      </div>
    </div>
  );
}