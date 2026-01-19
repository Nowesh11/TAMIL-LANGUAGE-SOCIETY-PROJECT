"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';

interface TestimonialsProps {
  page: string;
  slug?: string;
  data?: any;
}

export default function Testimonials({ page, slug = 'testimonials', data }: TestimonialsProps) {
  const { lang } = useLanguage();
  const [content, setContent] = React.useState<any>(data || null);

  React.useEffect(() => {
    if (data) return;
    async function fetchContent() {
      try {
        const pageContent = await getPageContent(page, 'testimonials', slug);
        setContent(pageContent[slug] || pageContent[`testimonials-0`]);
      } catch (error) {
        console.error('Error fetching testimonials content:', error);
      }
    }
    fetchContent();
  }, [page, slug]);

  if (!content) {
    return (
      <section className="py-20 relative overflow-hidden aurora-bg">
        <div className="layout-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card-morphism p-8 h-64 animate-pulse flex flex-col justify-between rounded-3xl border border-white/10">
                <div className="space-y-4">
                  <div className="h-4 bg-white/10 rounded w-full"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                  <div className="h-4 bg-white/10 rounded w-4/6"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                    <div className="h-3 bg-white/10 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const title = content.title?.[lang] || content.title?.en || '';
  const subtitle = content.subtitle?.[lang] || content.subtitle?.en || '';
  const layout = content.layout || 'grid';
  const showRatings = content.showRatings !== false; // Default to true
  const testimonials = content.testimonials || [];

  const getLayoutClasses = (layout: string) => {
    switch (layout) {
      case 'carousel':
        return 'flex overflow-x-auto space-x-6 pb-4 snap-x snap-mandatory hide-scrollbar';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
    }
  };

  return (
    <section className="py-20 relative overflow-hidden aurora-bg">
      <div className="layout-container relative z-10">
        <div className="text-center mb-16">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg inline-block">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className={getLayoutClasses(layout)}>
          {testimonials.map((testimonial: any, index: number) => (
            <div 
              key={index} 
              className={`card-morphism p-8 relative h-full flex flex-col hover-lift transition-all duration-300 rounded-3xl border border-white/10 shadow-lg hover:shadow-primary/20 ${layout === 'carousel' ? 'min-w-[300px] md:min-w-[350px] snap-center' : ''}`}
            >
              <div className="absolute top-6 right-8 text-6xl text-primary/20 font-serif leading-none select-none">❝</div>
              
              <div className="flex-1 relative z-10">
                {showRatings && testimonial.rating && (
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${i < testimonial.rating ? 'text-amber-400 drop-shadow-sm' : 'text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
                
                <blockquote className="text-gray-300 italic leading-relaxed mb-6 relative">
                  "{testimonial.text?.[lang] || testimonial.text?.en || testimonial.text}"
                </blockquote>
              </div>
              
              <div className="flex items-center mt-auto pt-6 border-t border-white/10">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg shrink-0 overflow-hidden border border-white/20">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(testimonial.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  {testimonial.name && (
                    <div className="font-bold text-white truncate">
                      {testimonial.name}
                    </div>
                  )}
                  {testimonial.position && (
                    <div className="text-sm text-gray-400 truncate">
                      {testimonial.position?.[lang] || testimonial.position?.en || testimonial.position}
                    </div>
                  )}
                  {testimonial.company && (
                    <div className="text-xs font-semibold text-primary mt-0.5 truncate">
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {testimonials.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-4">💬</div>
            <div className="text-lg">No testimonials available.</div>
          </div>
        )}
      </div>
    </section>
  );
}
