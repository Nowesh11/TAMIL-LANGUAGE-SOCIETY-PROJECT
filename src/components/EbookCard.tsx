"use client";
import { useMemo } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type Ebook = {
  _id: string;
  title: Bilingual;
  author: Bilingual;
  description: Bilingual;
  coverPath?: string | null;
  filePath: string;
  downloadCount: number;
  rating?: { avg: number; count: number };
};

export default function EbookCard({ ebook, onDownload, onRate }: {
  ebook: Ebook;
  onDownload: (id: string) => Promise<void>;
  onRate: (id: string, rating: number) => Promise<void>;
}) {
  const { lang } = useLanguage();
  const title = useMemo(() => ebook.title?.[lang] || ebook.title?.en, [ebook, lang]);
  const author = useMemo(() => ebook.author?.[lang] || ebook.author?.en, [ebook, lang]);
  const description = useMemo(() => ebook.description?.[lang] || ebook.description?.en, [ebook, lang]);
  const coverUrl = getCoverUrl(ebook.coverPath || undefined);
  const stars = Math.round((ebook.rating?.avg || 0) * 2) / 2; // half-star rounding

  return (
    <div className="project-card">
      <div className="project-image" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={title} className="media-cover" />
      </div>
      <div className="project-card-content">
        <div className="project-content">
          {ebook.filePath ? (<span className="project-category">{(ebook.filePath.split('.').pop() || '').toUpperCase()}</span>) : null}
          <h3>{title}</h3>
          <h4>{author}</h4>
          <p>{description}</p>
          <div className="project-status">
            <div className="status-indicator" />
            <span>Downloads: {ebook.downloadCount || 0}</span>
            <span>Rating: {stars || 0}</span>
          </div>
          <div className="project-actions">
            <RatingStars value={stars} onChange={(v) => onRate(ebook._id, v)} />
            <span> ({ebook.rating?.count || 0})</span>
          </div>
        </div>
        <div className="project-content">
          <button className="btn btn-primary" onClick={() => onDownload(ebook._id)}>Download</button>
        </div>
      </div>
    </div>
  );
}

function RatingStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => (
        <button key={s} aria-label={`rate-${s}`} className="text-yellow-500" onClick={() => onChange(s)}>
          {s <= Math.floor(value) ? '★' : s - 0.5 === value ? '☆' : '☆'}
        </button>
      ))}
    </div>
  );
}

function getCoverUrl(coverPath?: string) {
  if (!coverPath) return '/assets/default-book-cover.svg';
  if (coverPath.startsWith('http')) return coverPath;
  return coverPath;
}