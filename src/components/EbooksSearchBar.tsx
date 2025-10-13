"use client";
import { useEffect, useState } from 'react';

type Filters = {
  search: string;
  category: string;
  language: string;
  sort: string;
};

export default function EbooksSearchBar({ filters, onSearch }: { filters: Filters; onSearch: (f: Filters) => void }) {
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
          <label className="form-label" htmlFor="ebook-search">Search by title</label>
          <input
            id="ebook-search"
            className="form-input"
            placeholder="Type a title..."
            value={local.search}
            onChange={(e) => setLocal({ ...local, search: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-category">Category</label>
          <select id="ebook-category" className="form-select" value={local.category} onChange={(e) => setLocal({ ...local, category: e.target.value })}>
            <option value="all">All categories</option>
            <option value="history">History</option>
            <option value="language">Language</option>
            <option value="literature">Literature</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-language">Language</label>
          <select id="ebook-language" className="form-select" value={local.language} onChange={(e) => setLocal({ ...local, language: e.target.value })}>
            <option value="all">All languages</option>
            <option value="tamil">Tamil</option>
            <option value="english">English</option>
            <option value="bilingual">Bilingual</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ebook-sort">Sort</label>
          <select id="ebook-sort" className="form-select" value={local.sort} onChange={(e) => setLocal({ ...local, sort: e.target.value })}>
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>
      <div className="flex-center">
        <button className="btn btn-primary" onClick={() => onSearch(local)}>Search</button>
      </div>
    </div>
  );
}