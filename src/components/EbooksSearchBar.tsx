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
    <div className="section-stack">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="form-group md:col-span-2">
          <label className="form-label" htmlFor="ebook-search">
            {lang === 'ta' ? 'தலைப்பு மூலம் தேடுங்கள்' : 'Search by title'}
          </label>
          <input
            id="ebook-search"
            className="form-input"
            placeholder={lang === 'ta' ? 'தலைப்பு தட்டச்சு செய்யுங்கள்...' : 'Type a title...'}
            value={local.search}
            onChange={(e) => setLocal({ ...local, search: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-category">
            {lang === 'ta' ? 'வகை' : 'Category'}
          </label>
          <select id="ebook-category" className="form-select" value={local.category} onChange={(e) => setLocal({ ...local, category: e.target.value })}>
            <option value="all">{lang === 'ta' ? 'அனைத்து வகைகள்' : 'All categories'}</option>
            <option value="history">{lang === 'ta' ? 'வரலாறு' : 'History'}</option>
            <option value="language">{lang === 'ta' ? 'மொழி' : 'Language'}</option>
            <option value="literature">{lang === 'ta' ? 'இலக்கியம்' : 'Literature'}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-language">
            {lang === 'ta' ? 'மொழி' : 'Language'}
          </label>
          <select id="ebook-language" className="form-select" value={local.language} onChange={(e) => setLocal({ ...local, language: e.target.value })}>
            <option value="all">{lang === 'ta' ? 'அனைத்து மொழிகள்' : 'All languages'}</option>
            <option value="tamil">{lang === 'ta' ? 'தமிழ்' : 'Tamil'}</option>
            <option value="english">{lang === 'ta' ? 'ஆங்கிலம்' : 'English'}</option>
            <option value="bilingual">{lang === 'ta' ? 'இருமொழி' : 'Bilingual'}</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-sort">
            {lang === 'ta' ? 'வரிசைப்படுத்து' : 'Sort'}
          </label>
          <select id="ebook-sort" className="form-select" value={local.sort} onChange={(e) => setLocal({ ...local, sort: e.target.value })}>
            <option value="latest">{lang === 'ta' ? 'சமீபத்திய' : 'Latest'}</option>
            <option value="popular">{lang === 'ta' ? 'பிரபலமான' : 'Popular'}</option>
            <option value="oldest">{lang === 'ta' ? 'பழைய' : 'Oldest'}</option>
          </select>
        </div>
      </div>
      <div className="flex-center">
        <button className="btn btn-primary" onClick={() => onSearch(local)}>
          {lang === 'ta' ? 'தேடு' : 'Search'}
        </button>
      </div>
    </div>
  );
}