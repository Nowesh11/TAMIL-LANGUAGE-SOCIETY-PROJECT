"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';

interface ImageProps {
  page: string;
  data: any;
}

export default function Image({ page, data }: ImageProps) {
  const { lang } = useLanguage();

  if (!data) return null;

  // Handle both old and new data structures
  let imageUrl = data.url || data.image?.url || '';
  const altText = data.alt?.[lang] || data.alt?.en || data.image?.alt?.[lang] || data.image?.alt?.en || '';
  const caption = data.caption?.[lang] || data.caption?.en || data.image?.caption?.[lang] || data.image?.caption?.en || '';
  const size = data.size || data.image?.size || 'medium';
  const alignment = data.alignment || data.image?.alignment || 'center';
  const borderRadius = data.borderRadius || data.image?.borderRadius || 0;

  // If the image URL is a component upload path, use the component image serving endpoint
  if (imageUrl && imageUrl.includes('/uploads/component/')) {
    const filename = imageUrl.split('/').pop();
    imageUrl = `/api/components/image?filename=${filename}&t=${Date.now()}`;
  }

  if (!imageUrl) {
    return null;
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'max-w-sm';
      case 'medium':
        return 'max-w-2xl';
      case 'large':
        return 'max-w-4xl';
      case 'full':
        return 'w-full';
      default:
        return 'max-w-2xl';
    }
  };

  const getAlignmentClasses = (alignment: string) => {
    switch (alignment) {
      case 'left':
        return 'text-left mx-0';
      case 'right':
        return 'text-right ml-auto mr-0';
      case 'center':
      default:
        return 'text-center mx-auto';
    }
  };

  const sizeClasses = getSizeClasses(size);
  const alignmentClasses = getAlignmentClasses(alignment);

  return (
    <div className={`image-component py-8 ${alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left'}`}>
      <div className="image-container max-w-6xl mx-auto px-4">
        <div className={`image-wrapper ${sizeClasses} ${alignmentClasses}`}>
          <img
            src={imageUrl}
            alt={altText}
            className="image-element w-full h-auto shadow-lg"
            style={{
              borderRadius: `${borderRadius}px`
            }}
          />
          {caption && (
            <p className="image-caption mt-4 text-gray-600 text-sm italic">
              {caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}