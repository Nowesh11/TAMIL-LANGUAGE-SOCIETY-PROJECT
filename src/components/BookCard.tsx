"use client";
import { useMemo } from 'react';
import { useLanguage } from '../hooks/LanguageContext';

type Bilingual = { en: string; ta: string };
type Book = {
  _id: string;
  title: Bilingual;
  author: Bilingual;
  description: Bilingual;
  coverPath?: string | null;
  price: number;
  stock: number;
};

export default function BookCard({ book, onAddToCart, onBuyNow }: {
  book: Book;
  onAddToCart: (bookId: string) => void;
  onBuyNow: (book: Book) => void;
}) {
  const { lang } = useLanguage();
  const title = useMemo(() => book.title?.[lang] || book.title?.en, [book, lang]);
  const author = useMemo(() => book.author?.[lang] || book.author?.en, [book, lang]);
  const description = useMemo(() => book.description?.[lang] || book.description?.en, [book, lang]);
  const coverUrl = getCoverUrl(book.coverPath || undefined);
  const outOfStock = !book.stock || book.stock <= 0;

  return (
    <div className={`project-card ${outOfStock ? 'opacity-60' : ''}`}>
      <div className="project-image" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={title} className="media-cover" />
      </div>
      <div className="project-card-content">
        <div className="project-content">
          <h3>{title}</h3>
          <h4>{author}</h4>
          <p>{description}</p>
          <div className="project-status">
            <div className={`status-indicator ${outOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
            <span>Price: RM {book.price?.toFixed(2)}</span>
            <span>{outOfStock ? 'Out of stock' : `In stock: ${book.stock}`}</span>
          </div>
        </div>
        <div className="project-content flex gap-2">
          <button className="btn btn-secondary" onClick={() => onAddToCart(book._id)} disabled={outOfStock}>Add to Cart</button>
          <button className="btn btn-primary" onClick={() => onBuyNow(book)} disabled={outOfStock}>Buy Now</button>
        </div>
      </div>
    </div>
  );
}

function getCoverUrl(coverPath?: string) {
  if (!coverPath) return '/assets/default-book-cover.svg';
  if (coverPath.startsWith('http')) return coverPath;
  return coverPath;
}