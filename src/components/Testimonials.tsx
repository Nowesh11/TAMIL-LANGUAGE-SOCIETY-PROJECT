"use client";
import React from 'react';
import { useLanguage } from '../hooks/LanguageContext';
import { getPageContent } from '../lib/getPageContent';
import '../styles/components/Testimonials.css';

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
      <section className="testimonials-section">
        <div className="testimonials-container">
          <div className="testimonials-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="testimonial-skeleton">
                <div className="testimonial-skeleton-text"></div>
                <div className="testimonial-skeleton-text"></div>
                <div className="testimonial-skeleton-text"></div>
                <div className="testimonial-skeleton-author">
                  <div className="testimonial-skeleton-avatar"></div>
                  <div className="testimonial-skeleton-info">
                    <div className="testimonial-skeleton-name"></div>
                    <div className="testimonial-skeleton-role"></div>
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
        return 'flex overflow-x-auto space-x-6 pb-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8';
    }
  };

  const layoutClasses = getLayoutClasses(layout);

  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        <div className="testimonials-header">
          {title && (
            <h2 className="testimonials-title">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="testimonials-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="testimonials-grid">
          {testimonials.map((testimonial: any, index: number) => (
            <div key={index} className="testimonial-card">
              <div className="testimonial-quote">❝</div>
              
              <div className="testimonial-content">
                {showRatings && testimonial.rating && (
                  <div className="testimonial-rating">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`testimonial-star ${i < testimonial.rating ? '' : 'empty'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                )}
                
                <blockquote className="testimonial-text">
                  {testimonial.text?.[lang] || testimonial.text?.en || testimonial.text}
                </blockquote>
              </div>
              
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name || 'Testimonial'}
                    />
                  ) : (
                    <span>{(testimonial.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="testimonial-info">
                  {testimonial.name && (
                    <div className="testimonial-name">
                      {testimonial.name}
                    </div>
                  )}
                  {testimonial.position && (
                    <div className="testimonial-role">
                      {testimonial.position?.[lang] || testimonial.position?.en || testimonial.position}
                    </div>
                  )}
                  {testimonial.company && (
                    <div className="testimonial-company">
                      {testimonial.company}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {testimonials.length === 0 && (
          <div className="faq-no-results">
            <div className="faq-no-results-icon">💬</div>
            <div className="faq-no-results-text">No testimonials available.</div>
          </div>
        )}
      </div>
    </section>
  );
}