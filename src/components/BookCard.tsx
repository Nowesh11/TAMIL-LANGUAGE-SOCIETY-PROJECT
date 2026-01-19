"use client";
import { useMemo, useState } from 'react';
import Image from 'next/image';
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
  const [imageError, setImageError] = useState(false);
  
  const title = useMemo(() => book.title?.[lang] || book.title?.en, [book, lang]);
  const author = useMemo(() => book.author?.[lang] || book.author?.en, [book, lang]);
  const description = useMemo(() => book.description?.[lang] || book.description?.en, [book, lang]);
  const coverUrl = getCoverUrl(book.coverPath || undefined);
  const outOfStock = !book.stock || book.stock <= 0;

  return (
    <div className={`group relative card-morphism overflow-hidden hover-lift flex flex-col h-full ${outOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}>
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full bg-surface-hover overflow-hidden">
        <Image 
          src={!imageError ? coverUrl : '/assets/default-book-cover.svg'} 
          alt={title} 
          fill
          className={`object-cover transition-transform duration-700 group-hover:scale-110 ${outOfStock ? 'opacity-80' : ''}`}
          onError={() => setImageError(true)}
          unoptimized
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
           <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md ${
             outOfStock 
               ? 'bg-red-500/90 text-white border border-red-400' 
               : 'bg-emerald-500/90 text-white border border-emerald-400'
           }`}>
             {outOfStock 
               ? (lang === 'ta' ? 'கையிருப்பில் இல்லை' : 'Out of Stock') 
               : (lang === 'ta' ? `கையிருப்பில்: ${book.stock}` : `In Stock: ${book.stock}`)
             }
           </span>
        </div>

        {/* Quick Actions Overlay */}
        {!outOfStock && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
             <button 
                onClick={() => onBuyNow(book)}
                className="w-full btn-primary py-2.5 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 font-bold tracking-wide"
             >
               {lang === 'ta' ? 'இப்போது வாங்கவும்' : 'Buy Now'}
             </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col relative">
        <h3 className="font-bold text-lg text-foreground leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
           <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
              <i className="fa-solid fa-pen-nib"></i>
           </div>
           <h4 className="text-sm text-foreground-muted font-medium line-clamp-1">{author}</h4>
        </div>

        <p className="text-sm text-foreground-secondary line-clamp-3 mb-5 leading-relaxed flex-1">
          {description}
        </p>
        
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between gap-4">
          <div className="flex flex-col">
             <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-bold">
               {lang === 'ta' ? 'விலை' : 'Price'}
             </span>
             <span className="text-xl font-black text-foreground">
               RM {book.price?.toFixed(2)}
             </span>
          </div>

          <button 
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md ${
              outOfStock 
                ? 'bg-surface border border-border text-foreground-muted cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark hover:scale-105 hover:shadow-primary/30 active:scale-95'
            }`}
            onClick={() => onAddToCart(book._id)} 
            disabled={outOfStock}
            title={lang === 'ta' ? 'கார்ட்டில் சேர்க்கவும்' : 'Add to Cart'}
          >
            <i className="fa-solid fa-cart-shopping text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

function getCoverUrl(coverPath?: string) {
  if (!coverPath) return '/assets/default-book-cover.svg';
  if (coverPath.startsWith('http') || coverPath.startsWith('/')) return coverPath;
  return `/api/files/serve?path=${encodeURIComponent(coverPath)}`;
}