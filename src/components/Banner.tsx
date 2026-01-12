"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';
import '../styles/components/Banner.css';

interface BannerProps {
  page: string;
  slug?: string;
  data?: any;
}

export default function Banner({ page, slug = 'banner', data }: BannerProps) {
  const { lang } = useLanguage();
  const [content, setContent] = React.useState<any>(data || null);

  React.useEffect(() => {
    if (data) return;
    async function fetchContent() {
      try {
        const pageContent = await getPageContent(page, 'banner', slug);
        setContent(pageContent[slug] || pageContent[`banner-0`]);
      } catch (error) {
        console.error('Error fetching banner content:', error);
      }
    }
    fetchContent();
  }, [page, slug]);

  if (!content) return null;

  const title = content.title?.[lang] || content.title?.en || '';
  const subtitle = content.subtitle?.[lang] || content.subtitle?.en || '';
  const backgroundImage = content.backgroundImage || '';
  const backgroundColor = content.backgroundColor || '#f8f9fa';
  const textColor = content.textColor || '#1f2937';
  const bannerType = content.type || 'info';
  const buttons = content.buttons || [];

  // Banner type styles
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: backgroundColor || '#fbbf24',
          textColor: textColor || '#92400e',
          borderColor: '#f59e0b'
        };
      case 'success':
        return {
          backgroundColor: backgroundColor || '#10b981',
          textColor: textColor || '#065f46',
          borderColor: '#059669'
        };
      case 'error':
        return {
          backgroundColor: backgroundColor || '#ef4444',
          textColor: textColor || '#991b1b',
          borderColor: '#dc2626'
        };
      default: // info
        return {
          backgroundColor: backgroundColor || '#3b82f6',
          textColor: textColor || '#1e40af',
          borderColor: '#2563eb'
        };
    }
  };

  const typeStyles = getTypeStyles(bannerType);

  return (
    <section 
      className="banner-section py-16 px-4 relative overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundColor: backgroundImage ? 'transparent' : typeStyles.backgroundColor,
        color: typeStyles.textColor
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0" />
      )}
      
      <div className="banner-container max-w-6xl mx-auto relative z-10">
        <div className="banner-content text-center">
          {title && (
            <h1 className={`banner-title text-4xl md:text-5xl font-bold mb-6 ${backgroundImage ? 'text-white' : ''}`}>
              {title}
            </h1>
          )}
          {subtitle && (
            <h2 className={`banner-subtitle text-xl md:text-2xl font-semibold mb-6 ${backgroundImage ? 'text-gray-200' : ''}`}>
              {subtitle}
            </h2>
          )}
          
          {buttons.length > 0 && (
            <div className="banner-buttons flex flex-wrap justify-center gap-4 mt-8">
              {buttons.map((button: any, index: number) => (
                <a
                  key={index}
                  href={button.href || '#'}
                  target={button.target || '_self'}
                  className={`banner-button inline-block font-semibold py-3 px-8 rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl ${
                    button.variant === 'secondary'
                      ? 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-gray-300'
                      : backgroundImage
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-white text-gray-900 hover:bg-gray-100 border-2'
                  }`}
                  style={{
                    borderColor: button.variant === 'secondary' ? typeStyles.borderColor : 'transparent'
                  }}
                >
                  {button.text?.[lang] || button.text?.en || button.text}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}