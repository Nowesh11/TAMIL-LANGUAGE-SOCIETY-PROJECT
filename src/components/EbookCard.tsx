"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../hooks/LanguageContext';

interface Bilingual {
  en: string;
  ta: string;
}

interface Ebook {
  _id: string;
  title: Bilingual;
  author: Bilingual;
  description: Bilingual;
  price: number;
  discountPrice?: number;
  coverImage?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  pages?: number;
  language?: string;
  publishDate?: string;
  format?: 'pdf' | 'epub' | 'mobi' | 'audiobook';
  fileSize?: string;
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  downloadUrl?: string;
}

interface EbookCardProps {
  ebook: Ebook;
  layout?: 'grid' | 'list' | 'compact';
  showActions?: boolean;
  onAddToCart?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onDownload?: (id: string) => void;
  onReadOnline?: (id: string) => void;
  loading?: boolean;
}

export default function EbookCard({
  ebook,
  layout = 'grid',
  showActions = true,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  onDownload,
  onReadOnline,
  loading = false
}: EbookCardProps) {
  const { lang } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (loading) {
    return (
      <div className={`relative card-morphism overflow-hidden ${layout === 'list' ? 'flex flex-row' : 'flex flex-col h-full'}`}>
        <div className={`relative bg-slate-200 dark:bg-slate-700 animate-pulse ${layout === 'list' ? 'w-32 aspect-[3/4]' : 'aspect-[3/4] w-full'}`} />
        <div className="p-4 flex-1 space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 animate-pulse" />
          <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded w-full animate-pulse" />
          <div className="flex gap-2 pt-2">
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded flex-1 animate-pulse" />
            <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-10 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    author,
    description,
    price,
    discountPrice,
    coverImage,
    category,
    rating = 0,
    reviewCount = 0,
    pages,
    format = 'pdf',
    fileSize,
    isNew,
    isFeatured
  } = ebook;

  const displayPrice = discountPrice || price;
  const hasDiscount = !!discountPrice && discountPrice < price;
  const discountPercentage = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const isFree = displayPrice === 0;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(ebook._id);
      return;
    }
    
    if (ebook.downloadUrl) {
      const link = document.createElement('a');
      link.href = ebook.downloadUrl;
      link.download = `${title?.en || 'ebook'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback or toast if no URL
      console.warn('No download URL available');
    }
  };

  const handleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger rating modal or callback
    // For now we'll assume a callback or just log
    console.log('Rate clicked');
  };

  return (
    <div 
      className={`
        group relative card-morphism overflow-hidden hover-lift hover-glow
        ${layout === 'list' ? 'flex flex-row' : 'flex flex-col h-full'}
        ${isFeatured ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20' : ''}
        ${layout === 'compact' ? 'p-4' : ''}
      `}
      onClick={() => onViewDetails?.(ebook._id)}
    >
      {/* Featured Highlight */}
      {isFeatured && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10 animate-pulse" />
      )}

      {/* Image Container */}
      <div className={`
        relative overflow-hidden bg-slate-100 dark:bg-slate-800
        ${layout === 'list' ? 'w-32 sm:w-48 aspect-[3/4] shrink-0' : layout === 'compact' ? 'hidden' : 'aspect-[3/4] w-full'}
      `}>
        <Image
          src={
            !imageError && coverImage 
              ? (coverImage.startsWith('/') || coverImage.startsWith('http') 
                  ? coverImage 
                  : `/api/files/serve?path=${encodeURIComponent(coverImage)}`)
              : '/placeholder-book.jpg'
          }
          alt={typeof title === 'string' ? title : title?.[lang] || 'Book Cover'}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          unoptimized
        />
        
        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
           <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm ${getFormatColor(format)}`}>
             {format}
           </span>
        </div>

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <span className="bg-blue-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {lang === 'en' ? 'New' : 'புதியது'}
            </span>
          )}
          {hasDiscount && (
            <span className="bg-red-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm animate-pulse">
              -{discountPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 flex flex-col ${layout === 'compact' ? 'pt-0' : 'p-5'}`}>
        {/* Category */}
        {category && (
          <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
            {category}
          </div>
        )}

        {/* Title */}
        <h3 className={`font-bold text-foreground leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors ${layout === 'compact' ? 'text-base' : 'text-lg'}`}>
          {typeof title === 'string' ? title : title?.[lang]}
        </h3>

        {/* Author */}
        <div className="text-sm text-foreground-muted mb-3 font-medium flex items-center gap-2">
           <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-foreground-secondary">
              <i className="fa-solid fa-user"></i>
           </div>
          {typeof author === 'string' ? author : author?.[lang]}
        </div>

        {/* Description (Grid/List only) */}
        {layout !== 'compact' && (
          <p className="text-sm text-foreground-secondary line-clamp-3 mb-4 flex-1 leading-relaxed">
            {typeof description === 'string' ? description : description?.[lang]}
          </p>
        )}

        {/* Meta Info */}
        <div className="mt-auto space-y-4">
          {/* Stats Row */}
          <div className="flex items-center justify-between py-3 border-t border-border/50">
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(rating)}</div>
              <span className="text-xs text-foreground-muted ml-1 font-medium">({reviewCount})</span>
            </div>
            {fileSize && (
              <div className="text-xs text-foreground-muted flex items-center gap-1 font-medium">
                <i className="fa-solid fa-download text-primary/70"></i> {fileSize}
              </div>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex items-center justify-between gap-3">
             {/* Price Display */}
            <div className="flex flex-col">
              {hasDiscount && (
                <span className="text-xs text-foreground-muted line-through font-medium">
                  ₹{price}
                </span>
              )}
              <span className={`text-xl font-black ${isFree ? 'text-emerald-500' : 'text-foreground'}`}>
                {isFree ? (lang === 'en' ? 'Free' : 'இலவசம்') : `₹${displayPrice}`}
              </span>
            </div>

            {/* Buttons: Rate & Download */}
            <div className="flex gap-2">
                <button
                  onClick={handleRate}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface border border-border text-amber-500 hover:bg-amber-500/10 hover:border-amber-500 transition-all shadow-sm"
                  title={lang === 'en' ? 'Rate this book' : 'மதிப்பிடவும்'}
                >
                  <i className="fa-solid fa-star"></i>
                </button>
                
                <button
                  onClick={handleDownload}
                  className="btn-primary py-2 px-4 text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center gap-2"
                  title={lang === 'en' ? 'Download' : 'பதிவிறக்கம்'}
                >
                  <i className="fa-solid fa-download"></i>
                  <span className="hidden sm:inline">{lang === 'en' ? 'Download' : 'பதிவிறக்கம்'}</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
