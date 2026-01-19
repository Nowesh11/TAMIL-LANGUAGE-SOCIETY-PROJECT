"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';

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
  const backgroundColor = content.backgroundColor || 'var(--card-bg)';
  const textColor = content.textColor || 'var(--foreground)';
  const bannerType = content.type || 'info';
  const buttons = content.buttons || [];

  // Banner type styles
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: backgroundColor || 'rgba(251, 191, 36, 0.1)',
          textColor: textColor || '#fbbf24',
          borderColor: '#f59e0b'
        };
      case 'success':
        return {
          backgroundColor: backgroundColor || 'rgba(16, 185, 129, 0.1)',
          textColor: textColor || '#34d399',
          borderColor: '#059669'
        };
      case 'error':
        return {
          backgroundColor: backgroundColor || 'rgba(239, 68, 68, 0.1)',
          textColor: textColor || '#f87171',
          borderColor: '#dc2626'
        };
      default: // info
        return {
          backgroundColor: backgroundColor || 'rgba(59, 130, 246, 0.1)',
          textColor: textColor || '#60a5fa',
          borderColor: '#2563eb'
        };
    }
  };

  const typeStyles = getTypeStyles(bannerType);

  return (
    <section 
      className="relative py-20 px-4 overflow-hidden"
      style={{
        backgroundImage: backgroundImage 
          ? `url(${
              backgroundImage.startsWith('/') || backgroundImage.startsWith('http')
                ? backgroundImage
                : `/api/files/serve?path=${encodeURIComponent(backgroundImage)}`
            })` 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {!backgroundImage && (
        <div 
          className="absolute inset-0 aurora-bg opacity-50"
          style={{ backgroundColor: typeStyles.backgroundColor }}
        />
      )}
      
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
      )}
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center card-morphism p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl">
          {title && (
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight ${backgroundImage ? 'text-white' : ''}`} style={{ color: backgroundImage ? 'white' : typeStyles.textColor }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <h2 className={`text-xl md:text-2xl font-medium mb-8 ${backgroundImage ? 'text-gray-200' : ''}`} style={{ color: backgroundImage ? 'rgba(255,255,255,0.8)' : typeStyles.textColor, opacity: 0.9 }}>
              {subtitle}
            </h2>
          )}
          
          {buttons.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {buttons.map((button: any, index: number) => (
                <a
                  key={index}
                  href={button.href || '#'}
                  target={button.target || '_self'}
                  className={`inline-flex items-center justify-center font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${
                    button.variant === 'secondary'
                      ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-primary/25'
                  }`}
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